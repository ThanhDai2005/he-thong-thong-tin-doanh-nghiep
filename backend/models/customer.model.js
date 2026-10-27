import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    birthday: {
      type: Date,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

const Customer = mongoose.model("Customer", customerSchema, "customers");

export default Customer;
