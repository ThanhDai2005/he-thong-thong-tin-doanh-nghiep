import { useState, useEffect, useRef } from "react";
import { X, MessageSquare, Send, User, Phone } from "lucide-react";
import { useSocketStore } from "@/stores/useSocketStore";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"form" | "chat">("form");
  const [inputValue, setInputValue] = useState("");
  const [guestInfo, setGuestInfo] = useState({ name: "", phone: "" });
  const [isWaitingReply, setIsWaitingReply] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user, accessToken } = useAuthStore();
  const { connect, disconnect, on, off, isConnected } = useSocketStore();
  const {
    messages,
    conversationStatus,
    isTyping,
    typingUser,
    unreadCount,
    loadHistory,
    sendMessage,
    addMessage,
    setTyping,
    setConversationStatus,
    setWidgetOpen,
  } = useChatStore();

  const quickReplies = [
    "XIN CHÀO",
    "ĐỊA CHỈ CỦA QUÁN?",
    "LIÊN HỆ VỚI QUÁN NHƯ NÀO?",
    "GIỜ HOẠT ĐỘNG CỦA QUÁN?",
    "GẶP NHÂN VIÊN TƯ VẤN!",
  ];

  const effectiveStep = isOpen && user ? "chat" : step;

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen && effectiveStep === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen, effectiveStep]);

  // Sync widget open → store
  useEffect(() => {
    setWidgetOpen(isOpen);
  }, [isOpen, setWidgetOpen]);

  // Connect khi mở widget + đã vào bước chat
  useEffect(() => {
    if (!isOpen || effectiveStep !== "chat" || isConnected) return;

    if (user && accessToken) {
      connect(accessToken);
    } else if (guestInfo.name.trim() && guestInfo.phone.trim()) {
      connect(undefined, guestInfo);
    }
  }, [
    isOpen,
    effectiveStep,
    isConnected,
    user,
    accessToken,
    guestInfo,
    connect,
  ]);

  useEffect(() => {
    if (!isConnected) return;

    const handleNewMessage = (data: any) => {
      addMessage(data.message);
      if (
        data.message.senderType === "bot" ||
        data.message.senderType === "staff"
      ) {
        setIsWaitingReply(false);
      }
    };

    const handleTyping = (data: any) => {
      setTyping(data.isTyping, data.user);
    };

    const handleStatusChanged = (data: any) => {
      setConversationStatus(data.status);
    };

    on("client:newMessage", handleNewMessage);
    on("client:typing", handleTyping);
    on("client:conversationStatusChanged", handleStatusChanged);

    return () => {
      off("client:newMessage", handleNewMessage);
      off("client:typing", handleTyping);
      off("client:conversationStatusChanged", handleStatusChanged);
    };
  }, [isConnected, addMessage, setTyping, setConversationStatus, on, off]);

  // Mở lại / vào chat → luôn load history
  useEffect(() => {
    if (isOpen && effectiveStep === "chat" && isConnected) {
      loadHistory();
    }
  }, [isOpen, effectiveStep, isConnected, loadHistory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      disconnect();
    };
  }, []);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (!isConnected) return;

    const { emit } = useSocketStore.getState();
    // Phát sự kiện đang gõ
    emit("client:typing", { isTyping: true });

    // Hủy bỏ lệnh "ngừng gõ" cũ nếu người dùng vẫn đang tiếp tục gõ
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Nếu xóa trắng ô input thì báo ngừng gõ ngay lập tức
    if (!value.trim()) {
      emit("client:typing", { isTyping: false });
      return;
    }

    // Hẹn giờ: Sau 2 giây nếu không gõ thêm gì thì mới báo là "đã ngừng gõ"
    typingTimeoutRef.current = setTimeout(() => {
      emit("client:typing", { isTyping: false });
    }, 2000);
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim() || isWaitingReply || !isConnected) return;

    // Hủy hẹn giờ và báo ngừng gõ ngay khi gửi tin nhắn
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    const { emit } = useSocketStore.getState();
    emit("client:typing", { isTyping: false });

    sendMessage(text);
    setInputValue("");
    setIsWaitingReply(true);
  };

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();

    if (user) {
      setStep("chat");
      return;
    }

    const name = guestInfo.name.trim();
    const phone = guestInfo.phone.trim();

    if (!name || !phone) {
      toast.error("Vui lòng nhập đầy đủ họ tên và số điện thoại");
      return;
    }

    if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(phone)) {
      toast.error("Số điện thoại không hợp lệ (10 số, đầu 03/05/07/08/09)");
      return;
    }

    setStep("chat");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* CHAT DIALOG */}
      {isOpen && (
        <div className="w-[380px] h-[550px] bg-[#f8fafc] text-[#191c1e] border border-[#e2e8f0] rounded-[12px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] flex flex-col mb-4 overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="bg-[#b51c00] p-4 flex justify-between items-center shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <MessageSquare size={20} className="text-[#b51c00]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">
                  Đặc Sản Ba Miền
                </h3>
                <p className="text-xs text-[#ffdad3] flex items-center gap-1.5 font-medium mt-0.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_4px_#4ade80]"></span>
                  {conversationStatus === "human_active"
                    ? "Nhân viên đang hỗ trợ"
                    : conversationStatus === "waiting_human"
                      ? "Đang chờ nhân viên..."
                      : "Trợ lý AI"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-grow p-4 overflow-y-auto flex flex-col bg-[#f8fafc]">
            {effectiveStep === "form" ? (
              /* GUEST INFO FORM */
              <form
                onSubmit={handleStartChat}
                className="my-auto flex flex-col gap-4 bg-white p-5 rounded-[12px] border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
              >
                <div className="text-center mb-2">
                  <p className="text-base text-gray-800 font-medium">
                    Chào mừng bạn đến với{" "}
                    <span className="text-[#b51c00] font-bold">
                      Đặc Sản Ba Miền
                    </span>
                    !
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Vui lòng để lại thông tin để chúng tôi hỗ trợ bạn tốt nhất
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Tên của bạn *
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      required
                      value={guestInfo.name}
                      onChange={(e) =>
                        setGuestInfo({ ...guestInfo, name: e.target.value })
                      }
                      placeholder="Nhập họ và tên"
                      className="w-full bg-white border border-[#e2e8f0] focus:border-[#b51c00] focus:ring-1 focus:ring-[#b51c00]/20 rounded-[8px] pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Số điện thoại *
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="tel"
                      required
                      value={guestInfo.phone}
                      onChange={(e) =>
                        setGuestInfo({ ...guestInfo, phone: e.target.value })
                      }
                      placeholder="Nhập số điện thoại"
                      className="w-full bg-white border border-[#e2e8f0] focus:border-[#b51c00] focus:ring-1 focus:ring-[#b51c00]/20 rounded-[8px] pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#b51c00] hover:bg-[#db3416] text-white font-bold text-sm py-3 rounded-[8px] mt-2 transition-all active:scale-[0.98] shadow-sm"
                >
                  Bắt đầu trò chuyện
                </button>
              </form>
            ) : (
              /* CHAT VIEW — outer column, takes all remaining body height */
              <div className="flex flex-col h-full min-h-0">
                {/* ── Messages (scrollable, grows to fill) ── */}
                <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm mt-10">
                      <MessageSquare
                        size={48}
                        className="mx-auto mb-3 text-gray-300"
                      />
                      <p>Bắt đầu cuộc trò chuyện của bạn</p>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex flex-col max-w-[85%] ${
                        msg.senderType === "client"
                          ? "items-end self-end"
                          : "items-start"
                      }`}
                    >
                      <div
                        className={`p-3 text-[14px] leading-relaxed shadow-sm ${
                          msg.senderType === "client"
                            ? "bg-[#b51c00] text-white rounded-[12px] rounded-tr-sm font-medium"
                            : "bg-white text-[#191c1e] border border-[#e2e8f0] rounded-[12px] rounded-tl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1 mx-1 font-medium">
                        {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex flex-col max-w-[85%] items-start">
                      <div className="bg-white text-[#191c1e] border border-[#e2e8f0] rounded-[12px] rounded-tl-sm p-3 shadow-sm">
                        <div className="flex items-center gap-1">
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1 mx-1 font-medium">
                          {typingUser === "staff"
                            ? "Nhân viên đang trả lời..."
                            : "Bot đang trả lời..."}
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* ── Quick Replies (only when status = bot) ── */}
                {conversationStatus === "bot" && (
                  <div className="shrink-0 border-t border-[#e2e8f0] pt-2 pb-2 mt-2">
                    <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden">
                      {quickReplies.map((reply, index) => (
                        <button
                          key={index}
                          type="button"
                          disabled={isWaitingReply}
                          onClick={() => handleSendMessage(reply)}
                          className={`text-[11px] bg-white text-[#b51c00] border border-[#ffb4a5] hover:bg-[#ffdad3] hover:text-[#8e1400] px-3 py-1.5 rounded-full transition-all flex-shrink-0 font-bold whitespace-nowrap shadow-sm ${
                            isWaitingReply
                              ? "opacity-40 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Input Bar ── */}
                <div className="flex items-center gap-2 mt-2 shrink-0">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSendMessage(inputValue)
                    }
                    placeholder={
                      isWaitingReply
                        ? "Đang chờ phản hồi..."
                        : "Nhập tin nhắn..."
                    }
                    className="flex-grow bg-white border border-[#e2e8f0] focus:border-[#b51c00] focus:ring-1 focus:ring-[#b51c00]/20 rounded-[8px] px-3 py-2.5 text-sm text-[#191c1e] placeholder-gray-400 outline-none transition-all shadow-sm"
                  />
                  <button
                    disabled={isWaitingReply}
                    onClick={() => handleSendMessage(inputValue)}
                    className={`bg-[#b51c00] hover:bg-[#db3416] text-white p-2.5 rounded-[8px] transition-all active:scale-95 shadow-sm ${
                      isWaitingReply ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FLOATING BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#b51c00] hover:bg-[#db3416] text-white rounded-full flex items-center justify-center shadow-[0_10px_15px_-3px_rgba(181,28,0,0.4)] hover:scale-110 transition-all duration-200 active:scale-95 relative"
      >
        {isOpen ? (
          <X size={28} strokeWidth={2.5} />
        ) : (
          <>
            <MessageSquare size={28} strokeWidth={2.5} />
            {/* Unread Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
