import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 10, // Giới hạn 10 requests mỗi 5 phút
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 5 phút",
  },
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 200, // Giới hạn 200 requests mỗi phút
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Quá nhiều yêu cầu, vui lòng thử lại sau" },
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 5, // Cho phép thử 5 lần (gửi tối đa 5 mail/mã OTP trong 10 phút)
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Yêu cầu quá nhanh, vui lòng thử lại sau 10 phút" },
});

export const orderCreationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req.ip), //nếu một người trong quán cafe đặt hàng liên tục, hệ thống sẽ khóa tính năng đặt hàng của tất cả mọi người đang ngồi trong quán đó vì họ chung một IP. Giới hạn theo ID người dùng (req.user?._id) giúp phạt đúng người đúng tội
  message: {
    message: "Bạn đã tạo quá nhiều đơn hàng, vui lòng thử lại sau 10 phút",
  },
});

export const cancelOrderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    message: "Bạn đã hủy quá nhiều đơn hàng, vui lòng liên hệ hỗ trợ",
  },
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
});

export const retryPaymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req.ip),
  message: {
    message:
      "Bạn đã thử thanh toán lại quá nhiều lần, vui lòng thử lại sau 15 phút",
  },
});
