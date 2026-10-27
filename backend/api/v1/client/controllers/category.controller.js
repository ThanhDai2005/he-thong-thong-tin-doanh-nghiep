import Category from "../../../../models/category.model.js";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/category
export const list = async (req, res) => {
  try {
    const data = await Category.find({
      status: "active",
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      message: "Lấy danh sách category thành công",
      data: data,
    });
  } catch (error) {
    logger.logError("Lỗi khi lấy danh sách category", error, {
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
