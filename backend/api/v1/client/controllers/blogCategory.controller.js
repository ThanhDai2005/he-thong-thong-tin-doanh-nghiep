import BlogCategory from "../../../../models/blogCategory.model.js";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/blog-category
export const list = async (req, res) => {
  try {
    const data = await BlogCategory.find({
      status: "active",
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      message: "Lấy danh sách blog category thành công",
      data: data,
    });
  } catch (error) {
    logger.logError("Lỗi khi lấy danh sách blog category", error, {
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
