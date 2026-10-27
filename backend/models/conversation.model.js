import mongoose from "mongoose";

const lastMessageSchema = mongoose.Schema(
  {
    messageId: {
      type: String,
    },
    content: {
      type: String,
      default: null,
    },
    senderType: { type: String, enum: ["client", "bot", "staff"] },
    createdAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const conversationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    guestInfo: {
      name: String,
      phone: String,
    },
    status: {
      type: String,
      enum: ["bot", "waiting_human", "human_active", "closed"],
      default: "bot",
    },
    assignedStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    lastMessage: {
      type: lastMessageSchema,
      default: null,
    },
    lastMessageAt: { type: Date },
    unreadByAdmin: { type: Number, default: 0 },
    unreadByClient: { type: Number, default: 0 },
  },
  { timestamps: true },
);

conversationSchema.index({
  status: 1,
  lastMessageAt: -1,
});

const Conversation = mongoose.model(
  "Conversation",
  conversationSchema,
  "conversations",
);

export default Conversation;
