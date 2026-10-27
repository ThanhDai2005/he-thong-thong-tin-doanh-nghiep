import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getChatbotResponse } from "../helpers/gemini.helper.js";
import logger from "../config/logger.js";

/**
 * Socket handler cho Client namespace (/)
 * Xử lý chat giữa client (user/guest) và bot/staff
 */
export const handleClientChat = (io, socket) => {
  const user = socket.user;
  const isGuest = socket.isGuest;

  logger.logInfo(
    `[CLIENT CHAT] ${user.displayName} ${isGuest ? "(Guest)" : "(User)"} connected`,
    {
      displayName: user.displayName,
      isGuest: isGuest,
      socketId: socket.id,
    },
  );

  // Join room riêng cho conversation
  let conversationId = null;

  // Event: Client gửi tin nhắn
  socket.on("client:sendMessage", async (data) => {
    try {
      const { message } = data;

      if (!message || !message.trim()) {
        return socket.emit("client:sendMessageResponse", {
          error: "Tin nhắn không được để trống",
        });
      }

      // 1. Tìm hoặc tạo conversation
      let conversation = conversationId
        ? await Conversation.findById(conversationId)
        : null;

      // Nếu bộ nhớ RAM không có conversationId, chủ động tìm trong DB trước khi tạo mới
      if (!conversation) {
        if (isGuest) {
          conversation = await Conversation.findOne({
            "guestInfo.phone": user.phone,
            status: { $ne: "closed" },
          }).sort({ lastMessageAt: -1 });
        } else {
          conversation = await Conversation.findOne({
            customerId: user.customerId,
            status: { $ne: "closed" },
          }).sort({ lastMessageAt: -1 });
        }

        if (!conversation) {
          conversation = await Conversation.create({
            customerId: isGuest ? null : user.customerId,
            guestInfo: isGuest
              ? { name: user.displayName, phone: user.phone }
              : null,
            status: "bot",
            lastMessageAt: new Date(),
          });

          // Bắn sự kiện cho Admin biết có luồng mới
          io.of("/admin").emit("admin:newConversation", {
            conversation: {
              _id: conversation._id,
              userName: user.displayName,
              phone: user.phone,
              lastMessage: null,
              status: conversation.status,
              unreadByAdmin: 0,
              lastMessageAt: conversation.lastMessageAt,
            },
          });
        }

        // Đồng bộ lại ID vào RAM của Socket và cho user join room
        conversationId = conversation._id;
        socket.join(`conversation:${conversationId}`);
      }

      // 2. Lưu tin nhắn của client
      const clientMessage = await Message.create({
        conversationId: conversation._id,
        senderType: "client",
        senderId: isGuest ? null : user.customerId,
        senderModel: isGuest ? null : "Customer",
        content: message,
      });

      // 3. Update lastMessage
      conversation.lastMessage = {
        messageId: clientMessage._id.toString(),
        content: message,
        senderType: "client",
        createdAt: clientMessage.createdAt,
      };
      conversation.lastMessageAt = clientMessage.createdAt;
      conversation.unreadByAdmin += 1;
      await conversation.save();

      // 4. Emit tin nhắn client về chính client ngay lập tức (để hiển thị bubble)
      socket.emit("client:newMessage", {
        message: {
          _id: clientMessage._id,
          content: clientMessage.content,
          senderType: "client",
          createdAt: clientMessage.createdAt,
        },
      });

      // 5. Emit tin nhắn client đến admin (nếu có staff theo dõi)
      io.of("/admin")
        .to(`conversation:${conversationId}`)
        .emit("admin:newMessage", {
          conversationId: conversation._id,
          message: {
            _id: clientMessage._id,
            content: clientMessage.content,
            senderType: "client",
            createdAt: clientMessage.createdAt,
          },
          conversation: {
            _id: conversation._id,
            userName: user.displayName,
            phone: user.phone,
            lastMessage: conversation.lastMessage,
            status: conversation.status,
            unreadByAdmin: conversation.unreadByAdmin,
          },
        });

      // 5.1. Emit conversation update to ALL admins (for sidebar updates)
      io.of("/admin").emit("admin:conversationUpdated", {
        conversationId: conversation._id,
        lastMessage: conversation.lastMessage,
        status: conversation.status,
        unreadByAdmin: conversation.unreadByAdmin,
      });

      // 6. Xử lý theo trạng thái conversation
      if (conversation.status === "bot") {
        // BOT TỰ ĐỘNG TRẢ LỜI
        // Emit typing indicator
        socket.emit("client:typing", { isTyping: true, user: "bot" });

        await handleBotResponse(
          io,
          socket,
          conversation,
          message,
          clientMessage._id,
        );

        // Stop typing indicator
        socket.emit("client:typing", { isTyping: false, user: null });
      } else if (
        conversation.status === "waiting_human" ||
        conversation.status === "human_active"
      ) {
        // STAFF ĐÃ VÀO, CHỜ STAFF TRẢ LỜI (không gọi bot)
        // Chỉ emit tin nhắn, không bot reply
      }

      socket.emit("client:sendMessageResponse", {
        success: true,
        messageId: clientMessage._id,
      });
    } catch (error) {
      logger.logError("Lỗi khi xử lý tin nhắn client", error, {
        userId: user._id,
        isGuest: isGuest,
        conversationId: conversationId,
      });
      socket.emit("client:sendMessageResponse", { error: "Lỗi hệ thống" });
    }
  });

  // Event: Client yêu cầu kết nối nhân viên
  socket.on("client:requestHuman", async () => {
    try {
      if (!conversationId) {
        return socket.emit("client:requestHumanResponse", {
          error: "Chưa có cuộc hội thoại",
        });
      }

      const conversation = await Conversation.findById(conversationId);
      if (conversation.status === "bot") {
        conversation.status = "waiting_human";
        await conversation.save();

        // Emit đến admin
        io.of("/admin").emit("admin:conversationStatusChanged", {
          conversationId: conversation._id,
          status: "waiting_human",
        });

        // Bot gửi tin nhắn thông báo
        const botMessage = await Message.create({
          conversationId: conversation._id,
          senderType: "bot",
          content:
            "Em đã chuyển yêu cầu của anh/chị đến nhân viên tư vấn. Vui lòng đợi trong giây lát ạ! 😊",
        });

        conversation.lastMessage = {
          messageId: botMessage._id.toString(),
          content: botMessage.content,
          senderType: "bot",
          createdAt: botMessage.createdAt,
        };
        conversation.lastMessageAt = botMessage.createdAt;
        await conversation.save();

        socket.emit("client:newMessage", {
          message: {
            _id: botMessage._id,
            content: botMessage.content,
            senderType: "bot",
            createdAt: botMessage.createdAt,
          },
        });

        socket.emit("client:requestHumanResponse", { success: true });
      }
    } catch (error) {
      logger.logError("Lỗi khi yêu cầu nhân viên", error, {
        userId: user._id,
        conversationId: conversationId,
      });
      socket.emit("client:requestHumanResponse", { error: "Lỗi hệ thống" });
    }
  });

  // Event: Client load lịch sử chat
  socket.on("client:loadHistory", async () => {
    try {
      // Tìm conversation của user/guest này
      let conversation;
      if (isGuest) {
        conversation = await Conversation.findOne({
          "guestInfo.phone": user.phone,
          status: { $ne: "closed" },
        }).sort({ lastMessageAt: -1 });
      } else {
        conversation = await Conversation.findOne({
          customerId: user.customerId,
          status: { $ne: "closed" },
        }).sort({ lastMessageAt: -1 });
      }

      if (!conversation) {
        conversationId = null;
        return socket.emit("client:loadHistoryResponse", {
          messages: [],
          conversationId: null,
        });
      }

      conversationId = conversation._id;
      socket.join(`conversation:${conversationId}`);

      const messages = await Message.find({
        conversationId: conversation._id,
      })
        .sort({ createdAt: 1 })
        .limit(100)
        .lean();

      // Reset unread
      conversation.unreadByClient = 0;
      await conversation.save();

      socket.emit("client:loadHistoryResponse", {
        messages: messages.map((m) => ({
          _id: m._id,
          content: m.content,
          senderType: m.senderType,
          createdAt: m.createdAt,
        })),
        conversationId: conversation._id,
        status: conversation.status,
        unreadByClient: 0,
      });
    } catch (error) {
      logger.logError("Lỗi khi load lịch sử chat", error, {
        userId: user._id,
        isGuest: isGuest,
      });
      socket.emit("client:loadHistoryResponse", { error: "Lỗi hệ thống" });
    }
  });

  // Event: Client đang nhập
  socket.on("client:typing", (data) => {
    if (!conversationId) return;

    const { isTyping } = data;

    // Emit đến admin
    io.of("/admin")
      .to(`conversation:${conversationId}`)
      .emit("admin:typing", {
        conversationId,
        isTyping,
        user: isTyping ? "client" : null,
      });
  });

  socket.on("disconnect", () => {
    logger.logInfo(`[CLIENT CHAT] ${user.displayName} disconnected`, {
      displayName: user.displayName,
      socketId: socket.id,
    });
  });
};

/**
 * Xử lý bot tự động trả lời
 */
const handleBotResponse = async (
  io,
  socket,
  conversation,
  userMessage,
  userMessageId,
) => {
  try {
    // Lấy lịch sử 10 tin nhắn gần nhất để AI có context
    const history = await Message.find({
      conversationId: conversation._id,
      _id: { $ne: userMessageId }, // Không lấy tin nhắn vừa gửi
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const conversationHistory = history.reverse().map((m) => ({
      role: m.senderType === "client" ? "user" : "bot",
      content: m.content,
    }));

    // Gọi Gemini AI
    const aiResponse = await getChatbotResponse(
      conversationHistory,
      userMessage,
    );

    // Lưu tin nhắn bot
    const botMessage = await Message.create({
      conversationId: conversation._id,
      senderType: "bot",
      content: aiResponse.text,
    });

    conversation.lastMessage = {
      messageId: botMessage._id.toString(),
      content: aiResponse.text,
      senderType: "bot",
      createdAt: botMessage.createdAt,
    };
    conversation.lastMessageAt = botMessage.createdAt;

    // Nếu AI yêu cầu escalate sang human
    if (aiResponse.action === "ESCALATE_TO_HUMAN") {
      conversation.status = "waiting_human";

      // Notify admin
      io.of("/admin").emit("admin:conversationStatusChanged", {
        conversationId: conversation._id,
        status: "waiting_human",
        reason: aiResponse.reason,
      });

      socket.emit("client:conversationStatusChanged", {
        status: "waiting_human",
      });
    }

    await conversation.save();

    // Emit bot message đến client
    socket.emit("client:newMessage", {
      message: {
        _id: botMessage._id,
        content: botMessage.content,
        senderType: "bot",
        createdAt: botMessage.createdAt,
      },
    });

    // Emit đến admin (nếu đang theo dõi)
    io.of("/admin")
      .to(`conversation:${conversation._id}`)
      .emit("admin:newMessage", {
        conversationId: conversation._id,
        message: {
          _id: botMessage._id,
          content: botMessage.content,
          senderType: "bot",
          createdAt: botMessage.createdAt,
        },
      });

    // Emit conversation update to ALL admins (for sidebar updates)
    io.of("/admin").emit("admin:conversationUpdated", {
      conversationId: conversation._id,
      lastMessage: conversation.lastMessage,
      status: conversation.status,
      unreadByAdmin: conversation.unreadByAdmin,
    });
  } catch (error) {
    logger.logError("Lỗi khi bot trả lời", error, {
      conversationId: conversation._id,
    });
    // Fallback message
    const fallbackMsg = await Message.create({
      conversationId: conversation._id,
      senderType: "bot",
      content:
        "Em xin lỗi, em đang gặp chút vấn đề. Anh/chị vui lòng thử lại sau ạ.",
    });

    socket.emit("client:newMessage", {
      message: {
        _id: fallbackMsg._id,
        content: fallbackMsg.content,
        senderType: "bot",
        createdAt: fallbackMsg.createdAt,
      },
    });
  }
};

/**
 * Socket handler cho Admin namespace (/admin)
 * Xử lý chat giữa staff và client
 */
export const handleAdminChat = (io, socket) => {
  const staff = socket.user;

  logger.logInfo(`[ADMIN CHAT] Staff ${staff.displayName} connected`, {
    displayName: staff.displayName,
    staffId: staff._id,
    socketId: socket.id,
  });

  // Event: Admin load danh sách conversations
  socket.on("admin:loadConversations", async () => {
    try {
      const conversations = await Conversation.find({
        status: { $in: ["bot", "waiting_human", "human_active"] },
      })
        .sort({ lastMessageAt: -1 })
        .limit(50)
        .populate({
          path: "customerId",
          populate: {
            path: "userId",
            select: "displayName phone",
          },
        })
        .lean();

      socket.emit("admin:loadConversationsResponse", {
        conversations: conversations.map((c) => ({
          _id: c._id,
          userName:
            c.customerId?.userId?.displayName ||
            c.guestInfo?.name ||
            "Khách vãng lai",
          phone: c.customerId?.userId?.phone || c.guestInfo?.phone || "N/A",
          lastMessage: c.lastMessage,
          status: c.status,
          unreadByAdmin: c.unreadByAdmin,
          lastMessageAt: c.lastMessageAt,
        })),
      });
    } catch (error) {
      logger.logError("Lỗi khi load danh sách conversations (admin)", error, {
        staffId: staff._id,
      });
      socket.emit("admin:loadConversationsResponse", { error: "Lỗi hệ thống" });
    }
  });

  // Event: Admin chọn conversation để chat
  socket.on("admin:joinConversation", async (data) => {
    try {
      const { conversationId } = data;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return socket.emit("admin:joinConversationResponse", {
          error: "Conversation không tồn tại",
        });
      }

      // Join room
      socket.join(`conversation:${conversationId}`);

      // Update status nếu đang waiting
      if (conversation.status === "waiting_human") {
        conversation.status = "human_active";
        conversation.assignedStaffId = staff._id;
        await conversation.save();
      }

      // Load messages
      const messages = await Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .limit(100)
        .lean();

      // Reset unread
      conversation.unreadByAdmin = 0;
      await conversation.save();

      socket.emit("admin:joinConversationResponse", {
        messages: messages.map((m) => ({
          _id: m._id,
          content: m.content,
          senderType: m.senderType,
          createdAt: m.createdAt,
        })),
        conversation: {
          _id: conversation._id,
          status: conversation.status,
        },
      });
    } catch (error) {
      logger.logError("Lỗi khi admin join conversation", error, {
        staffId: staff._id,
        conversationId: data?.conversationId,
      });
      socket.emit("admin:joinConversationResponse", { error: "Lỗi hệ thống" });
    }
  });

  // Event: Admin gửi tin nhắn
  socket.on("admin:sendMessage", async (data) => {
    try {
      const { conversationId, message } = data;

      if (!message || !message.trim()) {
        return socket.emit("admin:sendMessageResponse", {
          error: "Tin nhắn không được để trống",
        });
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return socket.emit("admin:sendMessageResponse", {
          error: "Conversation không tồn tại",
        });
      }

      // Lưu tin nhắn staff
      const staffMessage = await Message.create({
        conversationId,
        senderType: "staff",
        senderId: staff._id,
        content: message,
      });

      // Update lastMessage
      conversation.lastMessage = {
        messageId: staffMessage._id.toString(),
        content: message,
        senderType: "staff",
        createdAt: staffMessage.createdAt,
      };
      conversation.lastMessageAt = staffMessage.createdAt;
      conversation.unreadByClient += 1;
      await conversation.save();

      // Emit đến client
      io.of("/")
        .to(`conversation:${conversationId}`)
        .emit("client:newMessage", {
          message: {
            _id: staffMessage._id,
            content: staffMessage.content,
            senderType: "staff",
            createdAt: staffMessage.createdAt,
          },
          unreadByClient: conversation.unreadByClient,
        });

      // Emit đến admin khác (nếu có)
      socket.to(`conversation:${conversationId}`).emit("admin:newMessage", {
        conversationId,
        message: {
          _id: staffMessage._id,
          content: staffMessage.content,
          senderType: "staff",
          createdAt: staffMessage.createdAt,
        },
      });

      // Emit conversation update to ALL admins (for sidebar updates)
      io.of("/admin").emit("admin:conversationUpdated", {
        conversationId: conversation._id,
        lastMessage: conversation.lastMessage,
        status: conversation.status,
        unreadByAdmin: conversation.unreadByAdmin,
      });

      socket.emit("admin:sendMessageResponse", {
        success: true,
        messageId: staffMessage._id,
      });
    } catch (error) {
      logger.logError("Lỗi khi admin gửi tin nhắn", error, {
        staffId: staff._id,
        conversationId: data?.conversationId,
      });
      socket.emit("admin:sendMessageResponse", { error: "Lỗi hệ thống" });
    }
  });

  // Event: Admin đóng conversation
  socket.on("admin:closeConversation", async (data) => {
    try {
      const { conversationId } = data;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return socket.emit("admin:closeConversationResponse", {
          error: "Conversation không tồn tại",
        });
      }

      conversation.status = "bot";
      conversation.assignedStaffId = null;

      const systemMsg = await Message.create({
        conversationId,
        senderType: "bot",
        content:
          "Cuộc trò chuyện với nhân viên đã kết thúc. Bạn đang được chuyển về chat với chatbot.",
      });

      conversation.lastMessage = {
        messageId: systemMsg._id.toString(),
        content: systemMsg.content,
        senderType: "bot",
        createdAt: systemMsg.createdAt,
      };
      conversation.lastMessageAt = systemMsg.createdAt;
      await conversation.save();

      // Client nhận bubble + đổi status
      io.of("/")
        .to(`conversation:${conversationId}`)
        .emit("client:newMessage", {
          message: {
            _id: systemMsg._id,
            content: systemMsg.content,
            senderType: "bot",
            createdAt: systemMsg.createdAt,
          },
        });

      // Thông báo client → header + quick replies hiện lại
      io.of("/")
        .to(`conversation:${conversationId}`)
        .emit("client:conversationStatusChanged", {
          status: "bot",
          message: systemMsg.content,
        });

      // Cập nhật sidebar tất cả admin
      io.of("/admin").emit("admin:conversationUpdated", {
        conversationId: conversation._id,
        lastMessage: conversation.lastMessage,
        status: "bot",
        unreadByAdmin: conversation.unreadByAdmin,
      });

      // Admin đang xem hội thoại cũng thấy bubble
      io.of("/admin")
        .to(`conversation:${conversationId}`)
        .emit("admin:newMessage", {
          conversationId,
          message: {
            _id: systemMsg._id,
            content: systemMsg.content,
            senderType: "bot",
            createdAt: systemMsg.createdAt,
          },
        });

      socket.emit("admin:closeConversationResponse", { success: true });
    } catch (error) {
      logger.logError("Lỗi khi đóng conversation", error, {
        staffId: staff._id,
        conversationId: data?.conversationId,
      });
      socket.emit("admin:closeConversationResponse", { error: "Lỗi hệ thống" });
    }
  });

  // Event: Admin đang nhập
  socket.on("admin:typing", (data) => {
    const { conversationId, isTyping } = data;

    // Emit đến client
    io.of("/")
      .to(`conversation:${conversationId}`)
      .emit("client:typing", {
        isTyping,
        user: isTyping ? "staff" : null,
      });
  });

  socket.on("disconnect", () => {
    logger.logInfo(`[ADMIN CHAT] Staff ${staff.displayName} disconnected`, {
      displayName: staff.displayName,
      staffId: staff._id,
      socketId: socket.id,
    });
  });
};
