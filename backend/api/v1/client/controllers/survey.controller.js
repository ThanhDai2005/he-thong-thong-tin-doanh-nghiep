import Survey from "../../../../models/survey.model.js";
import SurveyResponse from "../../../../models/surveyResponse.model.js";
import Customer from "../../../../models/customer.model.js";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/survey
export const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      status: "active",
    };

    const [data, totalItems] = await Promise.all([
      Survey.find(filter)
        .select("title description createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Survey.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Lấy danh sách khảo sát thành công",
      data,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    console.log("Lỗi khi gọi list survey", error);
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/survey/:surveyId
export const detail = async (req, res) => {
  try {
    const surveyId = req.params.surveyId;

    const survey = await Survey.findOne({
      _id: surveyId,
      status: "active",
    }).lean();

    if (!survey) {
      return res.status(404).json({
        message: "Khảo sát không tồn tại hoặc đã đóng",
      });
    }

    // Kiểm tra xem user đã trả lời chưa
    const customer = await Customer.findOne({ userId: req.user._id });
    let hasResponded = false;

    if (customer) {
      const existingResponse = await SurveyResponse.findOne({
        surveyId,
        customerId: customer._id,
      });
      hasResponded = !!existingResponse;
    }

    res.status(200).json({
      message: "Lấy chi tiết khảo sát thành công",
      data: {
        ...survey,
        hasResponded,
      },
    });
  } catch (error) {
    console.log("Lỗi khi gọi detail survey", error);
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/survey/:surveyId/submit
export const submit = async (req, res) => {
  try {
    const surveyId = req.params.surveyId;
    const { answers } = req.body;

    const survey = await Survey.findOne({
      _id: surveyId,
      status: "active",
    });

    if (!survey) {
      return res.status(404).json({
        message: "Khảo sát không tồn tại hoặc đã đóng",
      });
    }

    const customer = await Customer.findOne({ userId: req.user._id });

    if (!customer) {
      return res.status(404).json({
        message: "Không tìm thấy thông tin khách hàng",
      });
    }

    // Kiểm tra đã trả lời chưa
    const existingResponse = await SurveyResponse.findOne({
      surveyId,
      customerId: customer._id,
    });

    if (existingResponse) {
      return res.status(409).json({
        message: "Bạn đã trả lời khảo sát này rồi",
      });
    }

    // Validate answers
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        message: "Vui lòng trả lời ít nhất 1 câu hỏi",
      });
    }

    // Validate từng câu trả lời
    for (const answer of answers) {
      const question = survey.questions.find(
        (q) => q._id.toString() === answer.questionId,
      );

      if (!question) {
        return res.status(400).json({
          message: "Câu hỏi không hợp lệ",
        });
      }

      if (question.type === "single_choice") {
        if (
          !answer.selectedOption ||
          !question.options.includes(answer.selectedOption)
        ) {
          return res.status(400).json({
            message: `Lựa chọn cho câu hỏi "${question.questionText}" không hợp lệ`,
          });
        }
      } else if (question.type === "text") {
        if (!answer.textAnswer || !answer.textAnswer.trim()) {
          return res.status(400).json({
            message: `Vui lòng trả lời câu hỏi "${question.questionText}"`,
          });
        }
      }
    }

    const newResponse = new SurveyResponse({
      surveyId,
      customerId: customer._id,
      answers: answers.map((a) => ({
        questionId: a.questionId,
        selectedOption: a.selectedOption || undefined,
        textAnswer: a.textAnswer?.trim() || "",
      })),
    });

    await newResponse.save();

    res.status(201).json({
      message: "Cảm ơn bạn đã hoàn thành khảo sát!",
      data: newResponse,
    });
  } catch (error) {
    console.log("Lỗi khi gọi submit survey", error);
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/survey/my-responses
export const myResponses = async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.user._id });

    if (!customer) {
      return res.status(404).json({
        message: "Không tìm thấy thông tin khách hàng",
      });
    }

    const responses = await SurveyResponse.find({ customerId: customer._id })
      .populate("surveyId", "title description createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      message: "Lấy danh sách phản hồi thành công",
      data: responses,
    });
  } catch (error) {
    console.log("Lỗi khi gọi myResponses survey", error);
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
