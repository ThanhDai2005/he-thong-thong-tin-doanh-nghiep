import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedOption: { type: String }, // Lưu đáp án trắc nghiệm được chọn
  textAnswer: { type: String, default: "" }, // Lưu nội dung nếu là câu hỏi tự luận
});

const surveyResponseSchema = new mongoose.Schema(
  {
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    answers: [answerSchema],
  },
  { timestamps: true },
);

surveyResponseSchema.index({ surveyId: 1, customerId: 1 });

export default mongoose.model(
  "SurveyResponse",
  surveyResponseSchema,
  "surveyResponses",
);
