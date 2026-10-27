import mongoose from "mongoose";

const forgotPasswordSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
      unique: true,
    },
    expireAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

forgotPasswordSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const ForgotPassword = mongoose.model(
  "ForgotPassword",
  forgotPasswordSchema,
  "forgot-password",
);

export default ForgotPassword;
