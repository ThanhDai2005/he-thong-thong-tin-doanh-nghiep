import { useState, useEffect, useRef } from "react";
import { useAdminSocketStore } from "@/stores/useAdminSocketStore";
import { useAdminChatStore } from "@/stores/useAdminChatStore";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Send,
  Smile,
  EllipsisVertical,
  Search,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { hasPermission } from "@/lib/permissions";
import AdminHeader from "@/components/admin/AdminHeader";
import NoPermissionScreen from "@/components/admin/NoPermissionScreen";

const ChatManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { accessToken, user } = useAdminAuthStore();
  const { connect, disconnect, on, off, isConnected } = useAdminSocketStore();
  const {
    conversations,
    selectedConversationId,
    messages,
    conversationLoading,
    messageLoading,
    isTyping,
    typingUser,
    loadConversations,
    selectConversation,
    sendMessage,
    closeConversation,
    addMessage,
    addNewConversation,
    updateConversationStatus,
    updateConversationPreview,
    setTyping,
  } = useAdminChatStore();

  const canView = hasPermission(user, "chats_view");

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket connection & listeners
  useEffect(() => {
    if (accessToken && !isConnected) {
      connect(accessToken);
    }

    if (isConnected) {
      // Load conversations
      loadConversations();

      // Listen for new messages
      on("admin:newMessage", (data: { conversationId: string; message }) => {
        addMessage(data.conversationId, data.message);
      });

      // Listen for new conversations
      on("admin:newConversation", (data: { conversation: any }) => {
        addNewConversation(data.conversation);
      });

      // Listen for conversation status changes
      on(
        "admin:conversationStatusChanged",
        (data: { conversationId: string; status: string }) => {
          updateConversationStatus(data.conversationId, data.status);
        },
      );

      // Listen for conversation updates (sidebar real-time for all admins)
      on(
        "admin:conversationUpdated",
        (data: {
          conversationId: string;
          lastMessage: {
            messageId?: string;
            content: string;
            senderType: "client" | "bot" | "staff";
            createdAt: string;
          } | null;
          status: "bot" | "waiting_human" | "human_active" | "closed";
          unreadByAdmin: number;
        }) => {
          updateConversationPreview(
            data.conversationId,
            data.lastMessage,
            data.status,
            data.unreadByAdmin,
          );
        },
      );

      // Listen for typing indicator
      on(
        "admin:typing",
        (data: {
          conversationId: string;
          isTyping: boolean;
          user: "client" | "bot" | null;
        }) => {
          if (data.conversationId === selectedConversationId) {
            setTyping(data.isTyping, data.user);
          }
        },
      );
    }

    return () => {
      off("admin:newMessage");
      off("admin:newConversation");
      off("admin:conversationStatusChanged");
      off("admin:conversationUpdated");
      off("admin:typing");
    };
  }, [isConnected, accessToken, selectedConversationId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const normalize = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/gi, "d")
      .toLowerCase()
      .trim();
  };

  const filteredConversations = conversations.filter((chat) => {
    const keyword = normalize(searchQuery);
    if (!keyword) return true;

    const name = normalize(chat.userName || "");
    const phone = (chat.phone || "").toLowerCase();

    return name.includes(keyword) || phone.includes(keyword);
  });

  const selectedChat = conversations.find(
    (chat) => chat._id === selectedConversationId,
  );

  const handleSelectChat = (conversationId: string) => {
    selectConversation(conversationId);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversationId) return;

    const { emit } = useAdminSocketStore.getState();
    emit("admin:typing", {
      conversationId: selectedConversationId,
      isTyping: false,
    });

    sendMessage(selectedConversationId, messageInput);
    setMessageInput("");
  };

  const handleInputChange = (value: string) => {
    setMessageInput(value);

    if (!selectedConversationId) return;

    const { emit } = useAdminSocketStore.getState();
    if (value.trim()) {
      emit("admin:typing", {
        conversationId: selectedConversationId,
        isTyping: true,
      });
    } else {
      emit("admin:typing", {
        conversationId: selectedConversationId,
        isTyping: false,
      });
    }
  };

  const handleCloseConversation = () => {
    if (!selectedConversationId) return;

    closeConversation(selectedConversationId);
    toast.success("Đã kết thúc cuộc hội thoại");
  };

  if (!canView) {
    return (
      <NoPermissionScreen
        breadcrumbItems={[
          {
            label: "Admin",
            href: "/admin/dashboard",
          },
          {
            label: "Tư vấn với khách hàng",
            isCurrentPage: true,
          },
        ]}
      />
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-6 flex flex-col">
      {/* HEADER BREADCRUMB */}
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          {
            label: "Tư vấn với khách hàng",
            isCurrentPage: true,
          },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full space-y-4 flex-grow flex flex-col">
        <h1 className="text-[24px] font-bold text-gray-900 tracking-tight mb-6">
          Quản lý chat khách hàng
        </h1>

        {/* CHAT INTERFACE MAIN CONTAINER */}
        <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 flex overflow-hidden h-[calc(100vh-220px)] min-h-[600px]">
          {/* LEFT SIDEBAR: CONTACT LIST */}
          <div className="w-[350px] border-r border-gray-200 flex flex-col shrink-0 bg-white">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-[16px] text-gray-800 mb-3">
                # Danh sách tin nhắn ({conversations.length})
              </h2>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-gray-50 transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversationLoading ? (
                // Skeleton for conversation list
                <div className="space-y-0">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-4 border-b border-gray-50 animate-pulse"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8">
                  Chưa có cuộc hội thoại nào
                </div>
              ) : (
                filteredConversations.map((chat) => (
                  <div
                    key={chat._id}
                    onClick={() => handleSelectChat(chat._id)}
                    className={`flex gap-3 p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedConversationId === chat._id ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#e0e7ff] text-[#4f46e5] flex items-center justify-center shrink-0 mt-1">
                      <User size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-[14px] text-gray-900 truncate pr-2">
                          {chat.userName} - {chat.phone}
                        </h3>
                        <span className="text-[12px] text-gray-500 whitespace-nowrap shrink-0">
                          {new Date(chat.lastMessageAt).toLocaleTimeString(
                            "vi-VN",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] text-gray-600 line-clamp-1 leading-relaxed flex-1">
                          {chat.lastMessage?.content || "Chưa có tin nhắn"}
                        </p>
                        {chat.unreadByAdmin > 0 && (
                          <span className="ml-2 bg-[#b51c00] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                            {chat.unreadByAdmin}
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full ${
                            chat.status === "bot"
                              ? "bg-blue-100 text-blue-700"
                              : chat.status === "waiting_human"
                                ? "bg-yellow-100 text-yellow-700"
                                : chat.status === "human_active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {chat.status === "bot"
                            ? "🤖 AI Bot"
                            : chat.status === "waiting_human"
                              ? "⏳ Chờ nhân viên"
                              : chat.status === "human_active"
                                ? "👤 Đang tư vấn"
                                : "✓ Đã đóng"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR: ACTIVE CHAT WINDOW */}
          <div className="flex-1 flex flex-col bg-[#fcfcfc] relative">
            {!selectedChat ? (
              // Empty State
              <div className="p-6 border-b border-gray-200 bg-white flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#e0e7ff] text-[#4f46e5] flex items-center justify-center border-2 border-white shadow-sm">
                  <User size={24} />
                </div>
                <h3 className="text-[15px] font-semibold text-gray-700">
                  Chọn cuộc hội thoại để bắt đầu
                </h3>
              </div>
            ) : (
              // Active Chat State
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#e0e7ff] text-[#4f46e5] flex items-center justify-center shrink-0">
                      <User size={20} />
                    </div>

                    <div>
                      <h3 className="font-bold text-[15px] text-gray-900 leading-tight">
                        {selectedChat.userName} - {selectedChat.phone}
                      </h3>
                      <p className="text-[12px] text-gray-500">
                        {selectedChat.status === "bot"
                          ? "AI đang tự động trả lời"
                          : selectedChat.status === "waiting_human"
                            ? "Chờ nhân viên hỗ trợ"
                            : "Bạn đang tư vấn"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
                          <EllipsisVertical className="h-5 w-5 text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={handleCloseConversation}
                          className="cursor-pointer"
                        >
                          Kết thúc trò chuyện
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                  {messageLoading ? (
                    // Spinner for message loading
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-[#b51c00]" />
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => (
                        <div
                          key={msg._id}
                          className={`flex gap-3 max-w-[75%] ${
                            msg.senderType === "staff"
                              ? "self-end flex-row-reverse"
                              : "self-start"
                          }`}
                        >
                          {/* Avatar */}
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              msg.senderType === "staff"
                                ? "bg-[#b51c00] text-white"
                                : msg.senderType === "bot"
                                  ? "bg-blue-500 text-white"
                                  : "bg-[#e0e7ff] text-[#4f46e5]"
                            }`}
                          >
                            {msg.senderType === "staff" ? (
                              "👤"
                            ) : msg.senderType === "bot" ? (
                              "🤖"
                            ) : (
                              <User size={16} />
                            )}
                          </div>

                          {/* Message Bubble */}
                          <div
                            className={`p-4 rounded-xl shadow-sm ${
                              msg.senderType === "staff"
                                ? "bg-[#b51c00] text-white rounded-tr-sm"
                                : msg.senderType === "bot"
                                  ? "bg-blue-50 border border-blue-200 text-gray-800 rounded-tl-sm"
                                  : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                            }`}
                          >
                            <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                            <div
                              className={`text-[11px] mt-2 text-right ${msg.senderType === "staff" ? "text-white/70" : "text-gray-400"}`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString(
                                "vi-VN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Typing Indicator */}
                      {isTyping && (
                        <div className="flex gap-3 max-w-[75%] self-start">
                          {/* Avatar */}
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              typingUser === "bot"
                                ? "bg-blue-500 text-white"
                                : "bg-[#e0e7ff] text-[#4f46e5]"
                            }`}
                          >
                            {typingUser === "bot" ? "🤖" : <User size={16} />}
                          </div>

                          {/* Typing Bubble */}
                          <div className="bg-white border border-gray-200 text-gray-800 rounded-xl rounded-tl-sm p-4 shadow-sm">
                            <div className="flex items-center gap-1">
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              ></div>
                            </div>
                            <div className="text-[11px] mt-2 text-gray-400">
                              {typingUser === "bot"
                                ? "Chatbot đang trả lời..."
                                : "Khách hàng đang nhập..."}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Nhập tin nhắn..."
                      value={messageInput}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && messageInput.trim()) {
                          handleSendMessage();
                        }
                      }}
                      className="w-full pl-4 pr-24 py-3 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] transition-shadow"
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Smile size={20} />
                      </button>
                      <button
                        onClick={handleSendMessage}
                        className="p-2 text-white bg-[#b51c00] hover:bg-[#8e1400] transition-colors rounded-md"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatManagement;
