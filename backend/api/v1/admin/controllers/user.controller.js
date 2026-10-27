import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/user/detail
export const getDetail = (req, res) => {
  try {
    res.status(200).json({
      message: "lấy thông tin thành công",
      user: req.user,
      staffId: req.staffId,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi getDetail", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
