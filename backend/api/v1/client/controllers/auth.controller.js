import User from "../../../../models/user.model.js";
import Customer from "../../../../models/customer.model.js";
import Session from "../../../../models/session.model.js";
import ForgotPassword from "../../../../models/forgot-password.model.js";
import { sendEmail } from "../../../../helpers/mailer.js";
import { forgotPasswordTemplate } from "../../../../helpers/forgotPasswordTemplate.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import logger from "../../../../config/logger.js";

const ACCESS_TOKEN_TIME = "15m";
const REFRESH_TOKEN_TIME = 14 * 24 * 60 * 60 * 1000; // 14 ngày
const PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// [POST] /api/v1/auth/signup
export const signUp = async (req, res) => {
  try {
    const { phone, password, email, firstName, lastName } = req.body;

    if (!phone || !password || !email || !firstName || !lastName) {
      return res.status(400).json({
        message:
          "Không thể thiếu phone, password, email, firstName và lastName",
      });
    }

    if (!PHONE_REGEX.test(phone)) {
      return res.status(400).json({
        message: "Số điện thoại không hợp lệ",
      });
    }

    const existPhone = await User.findOne({ phone: phone });
    if (existPhone) {
      return res.status(400).json({
        message: "Số điện thoại đã tồn tại",
      });
    }

    const existEmail = await User.findOne({ email: email });

    if (existEmail) {
      return res.status(400).json({
        message: "email đã tồn tại",
      });
    }

    // mã hóa password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      displayName: `${firstName} ${lastName}`,
      phone: phone,
      email: email,
      hashedPassword: hashedPassword,
    });

    await user.save();

    await Customer.create({
      userId: user._id,
      address: "",
    });

    res.status(201).json({
      message: "Đăng ký thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi signUp", error, {
      endpoint: req.originalUrl,
      phone: req.body.phone,
      email: req.body.email,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/auth/signin
export const signIn = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        message: "Thiếu số điện thoại hoặc password",
      });
    }

    if (!PHONE_REGEX.test(phone)) {
      return res.status(400).json({
        message: "Số điện thoại không hợp lệ",
      });
    }

    const user = await User.findOne({ phone: phone });

    if (!user) {
      return res.status(401).json({
        message: "Số điện thoại hoặc password không chính xác",
      });
    }

    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordCorrect) {
      return res.status(401).json({
        message: "Số điện thoại hoặc password không chính xác",
      });
    }

    // Kiểm tra tài khoản có phải là Customer không
    const customer = await Customer.findOne({ userId: user._id });

    if (!customer) {
      return res.status(403).json({
        message:
          "Tài khoản này không phải tài khoản khách hàng. Vui lòng sử dụng cổng quản trị để đăng nhập.",
      });
    }

    // nếu khớp, tạo accessToken với JWT
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TIME },
    );

    // tạo refreshToken
    const refreshToken = crypto.randomBytes(64).toString("hex");

    // tạo session mới để lưu refresh token
    const session = new Session({
      userId: user._id,
      refreshToken: refreshToken,
      expireAt: new Date(Date.now() + REFRESH_TOKEN_TIME),
    });

    // trả refresh token về trong cookie
    res.cookie("clientRefreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV == "production", // Chỉ truyền qua HTTPS an toàn
      sameSite: process.env.NODE_ENV == "production" ? "none" : "lax", // Cho phép Frontend từ Vercel thoải mái nhận và gửi cookie sang Render mà không bị chặn
      maxAge: REFRESH_TOKEN_TIME,
    });

    await session.save();

    res.status(200).json({
      message: `User ${user.displayName} đã logged`,
      accessToken: accessToken,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi signIn", error, {
      endpoint: req.originalUrl,
      phone: req.body.phone,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/auth/signout
export const signOut = async (req, res) => {
  try {
    // lấy refresh token từ cookie
    const refreshToken = req.cookies?.clientRefreshToken;

    if (refreshToken) {
      await Session.deleteOne({ refreshToken: refreshToken });
      res.clearCookie("clientRefreshToken");
    }

    res.status(200).json({
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi signOut", error, {
      endpoint: req.originalUrl,
      userId: req.userId,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/auth/refresh
export const refreshToken = async (req, res) => {
  try {
    // lấy refresh token từ cookie
    const refreshToken = req.cookies.clientRefreshToken;
    if (!refreshToken) {
      return res.status(401).json({
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
      hasRefreshToken: !!req.cookies.clientRefreshToken,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email;

    if (!email) {
      return res.status(400).json({
        message: "Không thể thiếu email",
      });
    }

    const existEmail = await User.findOne({ email: email });

    if (!existEmail) {
      return res.status(400).json({
        message: "email không tồn tại",
      });
    }

    // Kiểm tra User này có phải là Customer không
    const customer = await Customer.findOne({ userId: existEmail._id });

    if (!customer) {
      return res.status(403).json({
        message:
          "Tài khoản quản trị không thể sử dụng chức năng này. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await ForgotPassword.deleteMany({ email: email });

    const forgotPassword = new ForgotPassword({
      email: existEmail.email,
      otp: otp,
      expireAt: new Date(Date.now() + 3 * 60 * 1000),
    });

    await forgotPassword.save();

    await sendEmail(
      existEmail.email,
      "Khôi phục mật khẩu",
      forgotPasswordTemplate(otp),
    );

    res.status(200).json({
      message: "Đã gửi OTP về email",
      email: forgotPassword.email,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi forgotPassword", error, {
      endpoint: req.originalUrl,
      email: req.body.email,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/auth/verify-otp
export const verifyOtp = async (req, res) => {
  try {
    const { otp, email } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Thiếu email hoặc OTP",
      });
    }

    const existOtp = await ForgotPassword.findOne({
      email: email,
      otp: otp,
    });

    if (!existOtp) {
      return res.status(400).json({
        message: "Otp sai hoặc đã hết hạn",
      });
    }

    if (existOtp.expireAt < new Date()) {
      return res.status(400).json({
        message: "Otp đã hết hạn",
      });
    }

    const resetToken = jwt.sign(
      { email: email },
      process.env.RESET_TOKEN_SECRET,
      {
        expiresIn: "10m",
      },
    );

    await ForgotPassword.deleteOne({ _id: existOtp._id });

    res.status(200).json({
      message: "Mã Otp chính xác",
      resetToken: resetToken,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi verifyOtp", error, {
      endpoint: req.originalUrl,
      email: req.body.email,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.RESET_TOKEN_SECRET);
    } catch (error) {
      return res.status(400).json({
        message: "Phiên làm việc đã hết hạn. Vui lòng thực hiện lại từ đầu.",
      });
    }

    const email = decoded.email;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Thiếu newPassword hoặc confirmPassword",
      });
    }

    if (newPassword != confirmPassword) {
      return res.status(400).json({
        message: "newPassword khác với confirmPassword",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findOneAndUpdate(
      { email: email },
      { hashedPassword: hashedPassword },
      { new: true },
    );

    await Session.deleteMany({ userId: user._id });

    res.status(200).json({
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi resetPassword", error, {
      endpoint: req.originalUrl,
      email: req.body.email,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/auth/google
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Thiếu Google credential",
      });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({
        message: "Không thể lấy email từ Google",
      });
    }

    // Tìm hoặc tạo user
    let user = await User.findOne({ email: email });

    if (!user) {
      // Tạo user mới từ Google OAuth
      user = new User({
        displayName: name,
        email: email,
        avatarUrl: picture,
        phone: `GOOGLE_${googleId.slice(0, 10)}`, // Tạo phone giả từ googleId để unique
        hashedPassword: await bcrypt.hash(
          crypto.randomBytes(32).toString("hex"),
          10,
        ), // Random password
        status: "active",
      });

      await user.save();

      await Customer.create({
        userId: user._id,
        address: "",
      });
    } else {
      // User đã tồn tại - kiểm tra có phải Customer không
      const customer = await Customer.findOne({ userId: user._id });

      if (!customer) {
        return res.status(403).json({
          message:
            "Tài khoản này không phải tài khoản khách hàng. Vui lòng sử dụng cổng quản trị để đăng nhập.",
        });
      }
    }

    // Tạo accessToken và refreshToken
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

    res.cookie("clientRefreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV == "production",
      sameSite: process.env.NODE_ENV == "production" ? "none" : "lax",
      maxAge: REFRESH_TOKEN_TIME,
    });

    await session.save();

    res.status(200).json({
      message: `User ${user.displayName} đã đăng nhập với Google`,
      accessToken: accessToken,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi googleAuth", error, {
      endpoint: req.originalUrl,
      hasCredential: !!req.body.credential,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
