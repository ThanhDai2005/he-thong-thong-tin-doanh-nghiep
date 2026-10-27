import logger from "../../../../config/logger.js";

// [GET] /api/v1/upload
export const upload = (req, res) => {
  try {
    res.status(200).json({
      location: req.body.file,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi upload", error, {
      adminId: req.user?._id,
      roleId: req.user?.roleId,
      fileName: req.body?.file,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
