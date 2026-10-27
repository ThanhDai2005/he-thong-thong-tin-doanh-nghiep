import { create } from "zustand";
import { useSocketStore } from "./useSocketStore";
import type { ChatState } from "@/types/store";

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  conversationId: null,
  conversationStatus: null,
  isLoading: false,
  isTyping: false,
  typingUser: null,
  unreadCount: 0,
  isWidgetOpen: false,

  loadHistory: () => {
    const { emit, on, off } = useSocketStore.getState();

    set({ isLoading: true });

    const handleLoadHistoryResponse = (response: any) => {
      if (response.error) {
        console.error("Lỗi khi load lịch sử:", response.error);
        set({ isLoading: false });
        off("client:loadHistoryResponse", handleLoadHistoryResponse);
        return;
      }

      set({
        messages: response.messages || [],
        conversationId: response.conversationId,
        conversationStatus: response.status || "bot",
        isLoading: false,
      });
      off("client:loadHistoryResponse", handleLoadHistoryResponse);
    };

    on("client:loadHistoryResponse", handleLoadHistoryResponse);
    emit("client:loadHistory");
  },

  sendMessage: (message) => {
    const { emit, on, off } = useSocketStore.getState();

    const handleSendMessageResponse = (response: any) => {
      if (response.error) {
        console.error("Lỗi khi gửi tin nhắn:", response.error);
      }
      off("client:sendMessageResponse", handleSendMessageResponse);
    };

    on("client:sendMessageResponse", handleSendMessageResponse);
    emit("client:sendMessage", { message });
  },

  requestHuman: () => {
    const { emit, on, off } = useSocketStore.getState();

    const handleRequestHumanResponse = (response: any) => {
      if (response.error) {
        console.error("Lỗi khi yêu cầu nhân viên:", response.error);
        off("client:requestHumanResponse", handleRequestHumanResponse);
        return;
      }

      set({ conversationStatus: "waiting_human" });
      off("client:requestHumanResponse", handleRequestHumanResponse);
    };

    on("client:requestHumanResponse", handleRequestHumanResponse);
    emit("client:requestHuman");
  },

  addMessage: (message) => {
    const { isWidgetOpen } = get();

    set((state) => ({
      messages: [...state.messages, message],
      unreadCount:
        !isWidgetOpen && message.senderType !== "client"
          ? state.unreadCount + 1
          : state.unreadCount,
    }));

    // Play notification sound when widget is closed and message is not from client
    if (!isWidgetOpen && message.senderType !== "client") {
      const audio = new Audio("/tieng_ting.mp3");
      audio.play().catch(() => {
        // Catch browser autoplay policy error silently
      });
    }
  },

  setTyping: (isTyping, user) => {
    set({ isTyping, typingUser: user });
  },

  setConversationStatus: (status) => {
    set({ conversationStatus: status });
  },

  setUnreadCount: (count) => {
    set({ unreadCount: count });
  },

  setWidgetOpen: (open) => {
    set({ isWidgetOpen: open });
    if (open) set({ unreadCount: 0 });
  },

  clearMessages: () => {
    set({
      messages: [],
      conversationId: null,
      conversationStatus: null,
      isTyping: false,
      typingUser: null,
      unreadCount: 0,
    });
  },
}));
