import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    images: { type: [String], default: [] },

    adminReply: {
      content: { type: String, default: "" },
      repliedAt: { type: Date, default: null },
      repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
        default: null,
      },
    },
    isHidden: { type: Boolean, default: false },
    hiddenAt: { type: Date, default: null },
    hiddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
  },
  { timestamps: true },
);

reviewSchema.index({ productId: 1, isHidden: 1, createdAt: -1 });
reviewSchema.index({ customerId: 1 });

const Review = mongoose.model("Review", reviewSchema, "reviews");

export default Review;
