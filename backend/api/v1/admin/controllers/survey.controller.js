import Survey from "../../../../models/survey.model.js";
import SurveyResponse from "../../../../models/surveyResponse.model.js";
import Customer from "../../../../models/customer.model.js";
import User from "../../../../models/user.model.js";

// [GET] /api/v1/admin/survey/recipients
export const recipients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const keyword = req.query.keyword || "";
    const userFilter = { deleted: false, status: "active" };
    if (keyword) {
      const pattern = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      userFilter.$or = [
        { displayName: { $regex: pattern, $options: "i" } },
        { email: { $regex: pattern, $options: "i" } },
        { phone: { $regex: pattern, $options: "i" } },
      ];
    }
    const userIds = await User.find(userFilter).distinct("_id");
    const filter = { userId: { $in: userIds } };
    const [data, totalItems] = await Promise.all([
      Customer.find(filter)
        .select("userId")
        .populate("userId", "displayName email phone avatarUrl")
        .sort({ _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(filter),
    ]);
    res.status(200).json({
      message: "Lấy danh sách người nhận thành công",
      data,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    console.log("Lỗi khi gọi recipients survey", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [POST] /api/v1/admin/survey/:surveyId/send
export const send = async (req, res) => {
  try {
    const surveyId = req.params.surveyId;
    const { customerIds } = req.body;

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({
        message: "Vui lòng chọn ít nhất 1 khách hàng",
      });
    }

    const survey = await Survey.findOne({ _id: surveyId }).lean();

    if (!survey) {
      return res.status(404).json({
        message: "Khảo sát không tồn tại",
      });
    }

    if (survey.status !== "active") {
      return res.status(409).json({
        message: "Vui lòng mở khảo sát trước khi gửi",
      });
    }

    const ids = [...new Set(customerIds)];
    const customers = await Customer.find({ _id: { $in: ids } })
      .populate({
        path: "userId",
        match: { deleted: false, status: "active" },
        select: "_id",
      })
      .lean();
    if (
      customers.length !== ids.length ||
      customers.some((customer) => !customer.userId)
    ) {
      return res.status(400).json({
        message: "Danh sách chứa khách hàng không tồn tại, đã xóa hoặc bị khóa",
      });
    }
    // Bổ sung người nhận, không thêm trùng khách hàng đã được gửi.
    const updatedSurvey = await Survey.findOneAndUpdate(
      { _id: surveyId, status: "active" },
      { $addToSet: { recipientIds: { $each: ids } } },
      { new: true },
    ).lean();
    if (!updatedSurvey) {
      return res.status(409).json({
        message: "Khảo sát đã đóng, không thể gửi",
      });
    }

    res.status(200).json({
      message: "Đã gửi khảo sát đến các tài khoản được chọn",
      data: {
        recipientIds: updatedSurvey.recipientIds,
        recipientCount: updatedSurvey.recipientIds.length,
      },
    });
  } catch (error) {
    console.log("Lỗi khi gọi send survey", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

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
          recipientCount: survey.recipientIds?.length || 0,
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
    console.log("Lỗi khi gọi list survey", error);
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
        recipientCount: survey.recipientIds?.length || 0,
      },
    });
  } catch (error) {
    console.log("Lỗi khi gọi detail survey", error);
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

    const cleanedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question?.questionText || !question.questionText.trim()) {
        return res.status(400).json({
          message: `Câu hỏi ${i + 1} không được để trống`,
        });
      }
      if (!["single_choice", "text"].includes(question.type)) {
        return res.status(400).json({
          message: `Loại câu hỏi ${i + 1} không hợp lệ`,
        });
      }
      let options = [];
      if (
        question.type === "single_choice" &&
        Array.isArray(question.options)
      ) {
        options = question.options
          .filter((option) => option && option.trim())
          .map((option) => option.trim());
      }

      if (question.type === "single_choice" && options.length < 2) {
        return res.status(400).json({
          message: `Câu hỏi trắc nghiệm ${i + 1} phải có ít nhất 2 lựa chọn hợp lệ`,
        });
      }

      cleanedQuestions.push({
        questionText: question.questionText.trim(),
        type: question.type,
        options,
      });
    }

    const newSurvey = await Survey.create({
      title: title.trim(),
      description: description?.trim() || "",
      questions: cleanedQuestions,
      status: status || "active",
      createdBy: req.staffId,
    });

    await newSurvey.populate({
      path: "createdBy",
      select: "userId",
      populate: {
        path: "userId",
        select: "displayName email",
      },
    });

    res.status(201).json({
      message: "Tạo khảo sát thành công",
      data: newSurvey,
    });
  } catch (error) {
    console.log("Lỗi khi gọi create survey", error);
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

    // Khảo sát đã có phản hồi thì không được chỉnh sửa câu hỏi.
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

    const cleanedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question?.questionText || !question.questionText.trim()) {
        return res.status(400).json({
          message: `Câu hỏi ${i + 1} không được để trống`,
        });
      }
      if (!["single_choice", "text"].includes(question.type)) {
        return res.status(400).json({
          message: `Loại câu hỏi ${i + 1} không hợp lệ`,
        });
      }
      let options = [];
      if (
        question.type === "single_choice" &&
        Array.isArray(question.options)
      ) {
        options = question.options
          .filter((option) => option && option.trim())
          .map((option) => option.trim());
      }

      if (question.type === "single_choice" && options.length < 2) {
        return res.status(400).json({
          message: `Câu hỏi trắc nghiệm ${i + 1} phải có ít nhất 2 lựa chọn hợp lệ`,
        });
      }

      cleanedQuestions.push({
        questionText: question.questionText.trim(),
        type: question.type,
        options,
      });
    }

    const updatedSurvey = await Survey.findOneAndUpdate(
      { _id: surveyId },
      {
        title: title.trim(),
        description: description?.trim() || "",
        questions: cleanedQuestions,
        status: status || survey.status,
      },
      { new: true, runValidators: true },
    )
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
    console.log("Lỗi khi gọi update survey", error);
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

    await Survey.updateOne({ _id: surveyId }, { status });

    res.status(200).json({
      message: `${status === "active" ? "Kích hoạt" : "Vô hiệu hóa"} khảo sát thành công`,
    });
  } catch (error) {
    console.log("Lỗi khi gọi changeStatus survey", error);
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
    console.log("Lỗi khi gọi getResponses survey", error);
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

    // Mẫu số là nhóm đã được gửi, không phải toàn bộ khách hàng CRM.
    const totalCustomers = survey.recipientIds?.length || 0;
    const recipientSet = new Set((survey.recipientIds || []).map(String));
    const completedRecipients = new Set(
      responses
        .filter((response) => recipientSet.has(String(response.customerId)))
        .map((response) => String(response.customerId)),
    ).size;

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
        ? ((completedRecipients / totalCustomers) * 100).toFixed(1)
        : "0.0";

    res.status(200).json({
      message: "Lấy thống kê khảo sát thành công",
      data: {
        surveyId: survey._id,
        title: survey.title,
        totalResponses,
        totalCustomers,
        completedRecipients,
        completionRate,
        questionStats,
      },
    });
  } catch (error) {
    console.log("Lỗi khi gọi getStatistics survey", error);
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
