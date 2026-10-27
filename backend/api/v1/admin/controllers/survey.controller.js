import Survey from "../../../../models/survey.model.js";
import SurveyResponse from "../../../../models/surveyResponse.model.js";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/survey
export const list = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const status = req.query.status;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (status && ["active", "inactive"].includes(status)) {
      filter.status = status;
    }

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    const [data, totalItems] = await Promise.all([
      Survey.find(filter)
        .populate({
          path: "createdBy",
          select: "userId",
          populate: {
            path: "userId",
            select: "displayName email",
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Survey.countDocuments(filter),
    ]);

    // Đếm số lượng phản hồi cho mỗi khảo sát
    const dataWithResponseCount = await Promise.all(
      data.map(async (survey) => {
        const responseCount = await SurveyResponse.countDocuments({
          surveyId: survey._id,
        });
        return {
          ...survey,
          responseCount,
        };
      }),
    );

    res.status(200).json({
      message: "Lấy danh sách khảo sát thành công",
      data: dataWithResponseCount,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list survey", error, {
      adminId: req.user?._id,
      keyword: req.query.keyword,
      status: req.query.status,
      page: req.query.page,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/admin/survey/:surveyId
export const detail = async (req, res) => {
  try {
    const surveyId = req.params.surveyId;

    const survey = await Survey.findOne({ _id: surveyId })
      .populate({
        path: "createdBy",
        select: "userId",
        populate: {
          path: "userId",
          select: "displayName email",
        },
      })
      .lean();

    if (!survey) {
      return res.status(404).json({
        message: "Khảo sát không tồn tại",
      });
    }

    // Đếm số phản hồi
    const responseCount = await SurveyResponse.countDocuments({
      surveyId: survey._id,
    });

    res.status(200).json({
      message: "Lấy chi tiết khảo sát thành công",
      data: {
        ...survey,
        responseCount,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi detail survey", error, {
      adminId: req.user?._id,
      surveyId: req.params.surveyId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/admin/survey
export const create = async (req, res) => {
  try {
    const { title, description, questions, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Tiêu đề khảo sát không được để trống",
      });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        message: "Khảo sát phải có ít nhất 1 câu hỏi",
      });
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !q.questionText.trim()) {
        return res.status(400).json({
          message: `Câu hỏi ${i + 1} không được để trống`,
        });
      }
      if (!["single_choice", "text"].includes(q.type)) {
        return res.status(400).json({
          message: `Loại câu hỏi ${i + 1} không hợp lệ`,
        });
      }
      if (q.type === "single_choice") {
        if (!q.options || q.options.length < 2) {
          return res.status(400).json({
            message: `Câu hỏi trắc nghiệm ${i + 1} phải có ít nhất 2 lựa chọn`,
          });
        }
        // Validate each option is not empty
        const validOptions = q.options.filter((opt) => opt && opt.trim());
        if (validOptions.length < 2) {
          return res.status(400).json({
            message: `Câu hỏi trắc nghiệm ${i + 1} phải có ít nhất 2 lựa chọn hợp lệ`,
          });
        }
      }
    }

    // Clean up questions data
    const cleanedQuestions = questions.map((q) => ({
      questionText: q.questionText.trim(),
      type: q.type,
      options:
        q.type === "single_choice"
          ? q.options
              .filter((opt) => opt && opt.trim())
              .map((opt) => opt.trim())
          : [],
    }));

    const newSurvey = new Survey({
      title: title.trim(),
      description: description?.trim() || "",
      questions: cleanedQuestions,
      status: status || "active",
      createdBy: req.staffId,
    });

    await newSurvey.save();

    const populatedSurvey = await Survey.findOne({ _id: newSurvey._id })
      .populate({
        path: "createdBy",
        select: "userId",
        populate: {
          path: "userId",
          select: "displayName email",
        },
      })
      .lean();

    res.status(201).json({
      message: "Tạo khảo sát thành công",
      data: populatedSurvey,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi create survey", error, {
      adminId: req.user?._id,
      title: req.body.title,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/survey/:surveyId
export const update = async (req, res) => {
  try {
    const surveyId = req.params.surveyId;
    const { title, description, questions, status } = req.body;

    const survey = await Survey.findOne({ _id: surveyId });

    if (!survey) {
      return res.status(404).json({
        message: "Khảo sát không tồn tại",
      });
    }

    // Check if survey has responses
    const responseCount = await SurveyResponse.countDocuments({
      surveyId: survey._id,
    });

    if (responseCount > 0) {
      return res.status(409).json({
        message: "Khảo sát đã có phản hồi, không thể chỉnh sửa",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Tiêu đề khảo sát không được để trống",
      });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        message: "Khảo sát phải có ít nhất 1 câu hỏi",
      });
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !q.questionText.trim()) {
        return res.status(400).json({
          message: `Câu hỏi ${i + 1} không được để trống`,
        });
      }
      if (!["single_choice", "text"].includes(q.type)) {
        return res.status(400).json({
          message: `Loại câu hỏi ${i + 1} không hợp lệ`,
        });
      }
      if (q.type === "single_choice") {
        if (!q.options || q.options.length < 2) {
          return res.status(400).json({
            message: `Câu hỏi trắc nghiệm ${i + 1} phải có ít nhất 2 lựa chọn`,
          });
        }
        // Validate each option is not empty
        const validOptions = q.options.filter((opt) => opt && opt.trim());
        if (validOptions.length < 2) {
          return res.status(400).json({
            message: `Câu hỏi trắc nghiệm ${i + 1} phải có ít nhất 2 lựa chọn hợp lệ`,
          });
        }
      }
    }

    // Clean up questions data
    const cleanedQuestions = questions.map((q) => ({
      questionText: q.questionText.trim(),
      type: q.type,
      options:
        q.type === "single_choice"
          ? q.options
              .filter((opt) => opt && opt.trim())
              .map((opt) => opt.trim())
          : [],
    }));

    // Update survey
    survey.title = title.trim();
    survey.description = description?.trim() || "";
    survey.questions = cleanedQuestions;
    survey.status = status || survey.status;

    await survey.save();

    const updatedSurvey = await Survey.findOne({ _id: surveyId })
      .populate({
        path: "createdBy",
        select: "userId",
        populate: {
          path: "userId",
          select: "displayName email",
        },
      })
      .lean();

    res.status(200).json({
      message: "Cập nhật khảo sát thành công",
      data: updatedSurvey,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi update survey", error, {
      adminId: req.user?._id,
      surveyId: req.params.surveyId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/survey/change-status/:surveyId
export const changeStatus = async (req, res) => {
  try {
    const surveyId = req.params.surveyId;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Trạng thái không hợp lệ",
      });
    }

    const survey = await Survey.findOne({ _id: surveyId });

    if (!survey) {
      return res.status(404).json({
        message: "Khảo sát không tồn tại",
      });
    }

    survey.status = status;
    await survey.save();

    res.status(200).json({
      message: `${status === "active" ? "Kích hoạt" : "Vô hiệu hóa"} khảo sát thành công`,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi changeStatus survey", error, {
      adminId: req.user?._id,
      surveyId: req.params.surveyId,
      status: req.body.status,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/admin/survey/:surveyId/responses
export const getResponses = async (req, res) => {
  try {
    const surveyId = req.params.surveyId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const survey = await Survey.findOne({ _id: surveyId });

    if (!survey) {
      return res.status(404).json({
        message: "Khảo sát không tồn tại",
      });
    }

    const [responses, totalItems] = await Promise.all([
      SurveyResponse.find({ surveyId })
        .populate({
          path: "customerId",
          populate: {
            path: "userId",
            select: "displayName email phone avatar",
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SurveyResponse.countDocuments({ surveyId }),
    ]);

    res.status(200).json({
      message: "Lấy danh sách phản hồi thành công",
      data: responses,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi getResponses survey", error, {
      adminId: req.user?._id,
      surveyId: req.params.surveyId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/admin/survey/:surveyId/statistics
export const getStatistics = async (req, res) => {
  try {
    const surveyId = req.params.surveyId;

    const survey = await Survey.findOne({ _id: surveyId }).lean();

    if (!survey) {
      return res.status(404).json({
        message: "Khảo sát không tồn tại",
      });
    }

    const responses = await SurveyResponse.find({ surveyId }).lean();

    const totalResponses = responses.length;

    // Đếm tổng số khách hàng trong hệ thống
    const Customer = (await import("../../../../models/customer.model.js"))
      .default;
    const totalCustomers = await Customer.countDocuments();

    // Thống kê cho từng câu hỏi
    const questionStats = survey.questions.map((question) => {
      const questionId = question._id.toString();

      if (question.type === "single_choice") {
        // Thống kê trắc nghiệm
        const optionCounts = {};
        question.options.forEach((option) => {
          optionCounts[option] = 0;
        });

        responses.forEach((response) => {
          const answer = response.answers.find(
            (a) => a.questionId.toString() === questionId,
          );
          if (answer && answer.selectedOption) {
            if (optionCounts[answer.selectedOption] !== undefined) {
              optionCounts[answer.selectedOption]++;
            }
          }
        });

        const optionStats = Object.entries(optionCounts).map(
          ([option, count]) => ({
            option,
            count,
            percentage:
              totalResponses > 0
                ? ((count / totalResponses) * 100).toFixed(1)
                : "0.0",
          }),
        );

        return {
          questionId,
          questionText: question.questionText,
          type: "single_choice",
          totalAnswers: responses.filter((r) =>
            r.answers.some((a) => a.questionId.toString() === questionId),
          ).length,
          optionStats,
        };
      } else {
        // Thống kê tự luận
        const textAnswers = responses
          .map((response) => {
            const answer = response.answers.find(
              (a) => a.questionId.toString() === questionId,
            );
            return answer?.textAnswer || null;
          })
          .filter(Boolean);

        return {
          questionId,
          questionText: question.questionText,
          type: "text",
          totalAnswers: textAnswers.length,
          textAnswers: textAnswers.slice(0, 50), // Giới hạn 50 câu trả lời mẫu
        };
      }
    });

    // Tính tỷ lệ hoàn thành = (Số người đã làm / Tổng số khách hàng) × 100
    const completionRate =
      totalCustomers > 0
        ? ((totalResponses / totalCustomers) * 100).toFixed(1)
        : "0.0";

    res.status(200).json({
      message: "Lấy thống kê khảo sát thành công",
      data: {
        surveyId: survey._id,
        title: survey.title,
        totalResponses,
        totalCustomers,
        completionRate,
        questionStats,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi getStatistics survey", error, {
      adminId: req.user?._id,
      surveyId: req.params.surveyId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
