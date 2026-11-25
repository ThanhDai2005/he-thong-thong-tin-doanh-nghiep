import { create } from "zustand";
import { useAdminSocketStore } from "./useAdminSocketStore";
import type { AdminChatState } from "@/types/store";

export const useAdminChatStore = create<AdminChatState>((set, get) => ({
  conversations: [],
  selectedConversationId: null,
  messages: [],
  conversationLoading: false,
  messageLoading: false,
  isTyping: false,
  typingUser: null,

  loadConversations: () => {
    const { emit, on, off } = useAdminSocketStore.getState();
    set({ conversationLoading: true });

    const handleLoadConversationsResponse = (response: any) => {
      if (response.error) {
        console.error("Lỗi khi load conversations:", response.error);
        set({ conversationLoading: false });
        off("admin:loadConversationsResponse", handleLoadConversationsResponse);
        return;
      }

      set({
        conversations: response.conversations || [],
        conversationLoading: false,
      });
      off("admin:loadConversationsResponse", handleLoadConversationsResponse);
    };

    on("admin:loadConversationsResponse", handleLoadConversationsResponse);
    emit("admin:loadConversations");
  },

  selectConversation: (conversationId) => {
    const { emit, on, off } = useAdminSocketStore.getState();
    set({ messageLoading: true, selectedConversationId: conversationId });

    const handleJoinConversationResponse = (response: any) => {
      if (response.error) {
        console.error("Lỗi khi join conversation:", response.error);
        set({ messageLoading: false });
        off("admin:joinConversationResponse", handleJoinConversationResponse);
        return;
      }

      set({
        messages: response.messages || [],
        messageLoading: false,
      });

      // Đồng bộ status từ server (waiting_human → human_active)
      if (response.conversation?.status) {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === conversationId
              ? {
                  ...c,
                  status: response.conversation.status,
                  unreadByAdmin: 0,
                }
              : c,
          ),
        }));
      } else {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === conversationId ? { ...c, unreadByAdmin: 0 } : c,
          ),
        }));
      }

      off("admin:joinConversationResponse", handleJoinConversationResponse);
    };

    on("admin:joinConversationResponse", handleJoinConversationResponse);
    emit("admin:joinConversation", { conversationId });
  },

  sendMessage: (conversationId, message) => {
    const { emit, on, off } = useAdminSocketStore.getState();

    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      content: message,
      senderType: "staff" as const,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    const handleSendMessageResponse = (response: any) => {
      if (response.error) {
        console.error("Lỗi khi gửi tin nhắn:", response.error);
        set((state) => ({
          messages: state.messages.filter(
            (m) => m._id !== optimisticMessage._id,
          ),
        }));
      }
      off("admin:sendMessageResponse", handleSendMessageResponse);
    };

    on("admin:sendMessageResponse", handleSendMessageResponse);
    emit("admin:sendMessage", { conversationId, message });
  },

  closeConversation: (conversationId) => {
    const { emit, on, off } = useAdminSocketStore.getState();

    const handleCloseConversationResponse = (response: any) => {
      if (response.error) {
        console.error("Lỗi khi đóng conversation:", response.error);
        off("admin:closeConversationResponse", handleCloseConversationResponse);
        return;
      }

      set((state) => ({
        conversations: state.conversations.map((c) =>
          c._id === conversationId
            ? { ...c, status: "bot", assignedStaffId: null }
            : c,
        ),
      }));

      off("admin:closeConversationResponse", handleCloseConversationResponse);
    };

    on("admin:closeConversationResponse", handleCloseConversationResponse);
    emit("admin:closeConversation", { conversationId });
  },

  addMessage: (conversationId, message) => {
    const currentConversationId = get().selectedConversationId;

    if (currentConversationId === conversationId) {
      set((state) => ({
        messages: [...state.messages, message],
      }));
    }

    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId
          ? {
              ...c,
              lastMessage: {
                content: message.content,
                senderType: message.senderType,
                createdAt: message.createdAt,
              },
              lastMessageAt: message.createdAt,
              unreadByAdmin:
                currentConversationId === conversationId
                  ? 0
                  : (c.unreadByAdmin || 0) + 1,
            }
          : c,
      ),
    }));
  },

  addNewConversation: (conversation) => {
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    }));
  },

  updateConversationStatus: (conversationId, status) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, status } : c,
      ),
    }));
  },

  updateConversationPreview: (
    conversationId,
    lastMessage,
    status,
    unreadByAdmin,
  ) => {
    const currentConversationId = get().selectedConversationId;
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId
          ? {
              ...c,
              lastMessage,
              status,
              unreadByAdmin:
                currentConversationId === conversationId ? 0 : unreadByAdmin,
            }
          : c,
      ),
    }));
  },

  setTyping: (isTyping, user) => {
    set({ isTyping, typingUser: user });
  },
}));
