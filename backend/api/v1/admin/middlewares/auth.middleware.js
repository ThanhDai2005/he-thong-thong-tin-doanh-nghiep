import jwt from "jsonwebtoken";
import User from "../../../../models/user.model.js";
import Staff from "../../../../models/staff.model.js";
import logger from "../../../../config/logger.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(" ")[1];

    if (!accessToken) {
      return res.status(401).json({
        message: "Không tìm thấy accessToken",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      return res.status(401).json({
        message: "Access token hết hạn hoặc không đúng",
      });
    }

    const user = await User.findOne({
      _id: decoded.userId,
      deleted: false,
    })
      .select("-hashedPassword")
      .lean(); // chuyển Mongoose Document thành Object JS thuần để thêm các trường tùy biến (như roleId) vào object user sau này.

    if (!user) {
      return res.status(404).json({
        message: "Người dùng không tồn tại",
      });
    }

    if (user.status != "active") {
      return res.status(403).json({
        message: "Tài khoản đã bị vô hiệu hóa",
      });
    }

    const staff = await Staff.findOne({ userId: user._id })
      .populate("roleId")
      .lean();

    if (!staff) {
      return res.status(403).json({
        message: "Bạn chưa được gán vai trò nhân viên",
      });
    }

    if (!staff.roleId) {
      return res.status(403).json({
        message: "Bạn chưa được gán vai trò",
      });
    }

    req.user = user;
    req.user.roleId = staff.roleId;
    req.staffId = staff._id;
    next();
  } catch (error) {
    logger.logError("Lỗi khi xác minh admin auth", error, {
      endpoint: req.originalUrl,
    });
    return res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
