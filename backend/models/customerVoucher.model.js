import mongoose from "mongoose";

const customerVoucherSchema = new mongoose.Schema(
  {
    promotionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promotion",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  { timestamps: true },
);

customerVoucherSchema.index(
  { promotionId: 1, customerId: 1 },
  { unique: true },
);
customerVoucherSchema.index({ customerId: 1, isUsed: 1 });

const CustomerVoucher = mongoose.model(
  "CustomerVoucher",
  customerVoucherSchema,
  "customerVouchers",
);
export default CustomerVoucher;
