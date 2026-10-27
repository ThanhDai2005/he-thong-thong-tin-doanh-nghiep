import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  refreshToken: {
    type: String,
    unique: true,
    required: true,
  },
  expireAt: {
    type: Date,
    required: true,
  },
});

sessionSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model("Session", sessionSchema, "sessions");

export default Session;
