import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    address: { type: String, required: true },
    taxCode: { type: String, default: "" }, // Mã số thuế (nếu cần)
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

supplierSchema.index({ status: 1, deleted: 1 });

const Supplier = mongoose.model("Supplier", supplierSchema, "suppliers");

export default Supplier;
