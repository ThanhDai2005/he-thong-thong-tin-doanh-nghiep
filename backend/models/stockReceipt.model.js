import mongoose from "mongoose";

const stockReceiptItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    importPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const stockReceiptSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    items: [stockReceiptItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
  },
  { timestamps: true },
);

stockReceiptSchema.index({ supplierId: 1, status: 1, createdAt: -1 });

const StockReceipt = mongoose.model(
  "StockReceipt",
  stockReceiptSchema,
  "stockReceipts",
);

export default StockReceipt;
