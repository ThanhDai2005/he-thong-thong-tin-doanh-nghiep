import mongoose from "mongoose";

const productPromotionSchema = new mongoose.Schema(
  {
    promotionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promotion",
      required: true,
      unique: true,
    },
    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    ],
  },
  { timestamps: true },
);

productPromotionSchema.index({ productIds: 1 });

const ProductPromotion = mongoose.model(
  "ProductPromotion",
  productPromotionSchema,
  "productPromotions",
);
export default ProductPromotion;
