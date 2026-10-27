import mongoose from "mongoose";

const surveyQuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  type: {
    type: String,
    enum: ["single_choice", "text"],
    default: "single_choice",
  },
  options: [String], // Ví dụ: ["Rất hài lòng", "Hài lòng", "Không hài lòng"] (nếu là single_choice)
});

const surveySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    questions: [surveyQuestionSchema],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
  },
  { timestamps: true },
);

surveySchema.index({ status: 1 });

export default mongoose.model("Survey", surveySchema, "surveys");
