import Survey from "../../../../models/survey.model.js";
import SurveyResponse from "../../../../models/surveyResponse.model.js";
import Customer from "../../../../models/customer.model.js";

// [GET] /api/v1/survey
export const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const customer = await Customer.findOne({ userId: req.user._id })
      .select("_id")
      .lean();

    if (!customer) {
      return res.status(404).json({
        message: "Không tìm thấy thông tin khách hàng",
      });
    }

    const filter = {
      status: "active",
      recipientIds: customer._id,
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

    const respondedIds = await SurveyResponse.find({
      customerId: customer._id,
      surveyId: { $in: data.map((survey) => survey._id) },
    }).distinct("surveyId");
    const respondedSurveyIds = respondedIds.map((id) => id.toString());

    res.status(200).json({
      message: "Lấy danh sách khảo sát thành công",
      data: data.map((survey) => ({
        ...survey,
        hasResponded: respondedSurveyIds.includes(survey._id.toString()),
      })),
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

    const customer = await Customer.findOne({ userId: req.user._id })
      .select("_id")
      .lean();

    if (!customer) {
      return res.status(404).json({
        message: "Không tìm thấy thông tin khách hàng",
      });
    }

    const survey = await Survey.findOne({
      _id: surveyId,
      status: "active",
      recipientIds: customer._id,
    })
      .select("-recipientIds")
      .lean();

    if (!survey) {
      return res.status(404).json({
        message: "Khảo sát không được gửi cho bạn hoặc đã đóng",
      });
    }

    const existingResponse = await SurveyResponse.findOne({
      surveyId,
      customerId: customer._id,
    });

    res.status(200).json({
      message: "Lấy chi tiết khảo sát thành công",
      data: {
        ...survey,
        hasResponded: !!existingResponse,
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

    const customer = await Customer.findOne({ userId: req.user._id })
      .select("_id")
      .lean();

    if (!customer) {
      return res.status(404).json({
        message: "Không tìm thấy thông tin khách hàng",
      });
    }

    const survey = await Survey.findOne({
      _id: surveyId,
      status: "active",
      recipientIds: customer._id,
    });

    if (!survey) {
      return res.status(404).json({
        message: "Khảo sát không được gửi cho bạn hoặc đã đóng",
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

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        message: "Vui lòng trả lời ít nhất 1 câu hỏi",
      });
    }

    if (answers.length !== survey.questions.length) {
      return res.status(400).json({
        message: "Vui lòng trả lời đầy đủ mỗi câu hỏi một lần",
      });
    }

    // Mỗi câu hỏi phải có đúng một câu trả lời hợp lệ.
    for (const question of survey.questions) {
      const questionAnswers = answers.filter(
        (answer) => answer?.questionId === question._id.toString(),
      );

      if (questionAnswers.length !== 1) {
        return res.status(400).json({
          message: "Vui lòng trả lời đầy đủ mỗi câu hỏi một lần",
        });
      }

      const answer = questionAnswers[0];

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
        if (typeof answer.textAnswer !== "string" || !answer.textAnswer.trim()) {
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
