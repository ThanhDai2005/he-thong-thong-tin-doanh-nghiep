import User from "../../../../models/user.model.js";
import Staff from "../../../../models/staff.model.js";
import Session from "../../../../models/session.model.js";
import Role from "../../../../models/role.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import logger from "../../../../config/logger.js";

const ACCESS_TOKEN_TIME = "15m";
const REFRESH_TOKEN_TIME = 14 * 24 * 60 * 60 * 1000;
const PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

// [POST] /api/v1/admin/auth/login
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        message: "Không thể thiếu số điện thoại hoặc password",
      });
    }

    if (!PHONE_REGEX.test(phone)) {
      return res.status(400).json({
        message: "Số điện thoại không hợp lệ",
      });
    }

    const user = await User.findOne({
      phone: phone,
    });

    if (!user) {
      return res.status(401).json({
        message: "Số điện thoại hoặc password không chính xác",
      });
    }

    const correctPassword = await bcrypt.compare(password, user.hashedPassword);

    if (!correctPassword) {
      return res.status(401).json({
        message: "Số điện thoại hoặc password không chính xác",
      });
    }

    if (user.status != "active") {
      return res.status(403).json({
        message: "Tài khoản đã bị vô hiệu hóa",
      });
    }

    const staff = await Staff.findOne({ userId: user._id }).populate("roleId");

    if (!staff) {
      return res.status(403).json({
        message: "Tài khoản không có quyền truy cập hệ thống quản trị",
      });
    }

    const role = await Role.findOne({
      _id: staff.roleId,
      deleted: false,
    });

    if (!role) {
      return res.status(403).json({
        message:
          "Vai trò không tồn tại hoặc đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.",
      });
    }

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TIME },
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");

    const session = new Session({
      userId: user._id,
      refreshToken: refreshToken,
      expireAt: new Date(Date.now() + REFRESH_TOKEN_TIME),
    });

    await session.save();

    res.cookie("adminRefreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV == "production", // Chỉ truyền qua HTTPS an toàn
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Cho phép Frontend từ Vercel thoải mái nhận và gửi cookie sang Render mà không bị chặn
      maxAge: REFRESH_TOKEN_TIME,
    });

    res.status(200).json({
      message: "đăng nhập thành công",
      accessToken: accessToken,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi login", error, {
      endpoint: req.originalUrl,
      phone: req.body.phone,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/admin/auth/logout
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.adminRefreshToken;
    if (refreshToken) {
      await Session.deleteOne({ refreshToken: refreshToken });

      res.clearCookie("adminRefreshToken");
    }

    res.status(200).json({
      message: "đăng xuất thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi logout", error, {
      endpoint: req.originalUrl,
      adminId: req.userId,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/admin/auth/refresh
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.adminRefreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Token không tồn tại",
      });
    }

    const session = await Session.findOne({ refreshToken: refreshToken });

    if (!session) {
      return res.status(401).json({
        message: "Token không hợp lệ hoặc đã hết hạn",
      });
    }

    if (session.expireAt < new Date()) {
      return res.status(401).json({
        message: "Token đã hết hạn",
      });
    }

    const accessToken = jwt.sign(
      { userId: session.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TIME },
    );

    res.status(200).json({
      accessToken: accessToken,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi refreshToken", error, {
      endpoint: req.originalUrl,
      hasRefreshToken: !!req.cookies.adminRefreshToken,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
