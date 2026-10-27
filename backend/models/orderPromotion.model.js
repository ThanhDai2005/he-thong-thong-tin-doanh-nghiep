import mongoose from "mongoose";

const orderPromotionSchema = new mongoose.Schema(
  {
    promotionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promotion",
      required: true,
      unique: true,
    },
    minOrderValue: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true },
);

const OrderPromotion = mongoose.model(
  "OrderPromotion",
  orderPromotionSchema,
  "orderPromotions",
);
export default OrderPromotion;
