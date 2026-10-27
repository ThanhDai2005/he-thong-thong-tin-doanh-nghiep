import jwt from "jsonwebtoken";
import User from "../../../../models/user.model.js";
import logger from "../../../../config/logger.js";
import Customer from "../../../../models/customer.model.js";

// authorization - xác minh user là ai
// - verify token
// - kiểm tra user tồn tại
// - kiểm tra role user
export const requireAuth = async (req, res, next) => {
  try {
    // lấy accessToken từ header
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(" ")[1]; // Bearer <token>

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
      .lean();

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

    const customer = await Customer.findOne({
      userId: user._id,
    })
      .lean()
      .select("address birthday");

    if (!customer) {
      return res.status(404).json({
        message: "Không tìm thấy thông tin khách hàng",
      });
    }

    req.user = user;
    req.user.address = customer.address;
    req.user.birthday = customer.birthday;
    next();
  } catch (error) {
    logger.logError("Lỗi khi xác minh client auth", error, {
      endpoint: req.originalUrl,
    });
    return res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
