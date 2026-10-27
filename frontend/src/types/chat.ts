export interface Conversation {
  _id: string;
  userId?: string | null;
  guestInfo?: {
    name: string;
    phone: string;
  } | null;
  userName: string;
  phone: string;
  lastMessage: {
    messageId?: string;
    content: string;
    senderType: "client" | "bot" | "staff";
    createdAt: string;
  } | null;
  status: "bot" | "waiting_human" | "human_active" | "closed";
  assignedStaffId?: string | null;
  unreadByAdmin: number;
  unreadByClient?: number;
  lastMessageAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  _id: string;
  conversationId?: string;
  senderType: "client" | "bot" | "staff";
  senderId?: string | null;
  content: string;
  createdAt: string;
  updatedAt?: string;
}
