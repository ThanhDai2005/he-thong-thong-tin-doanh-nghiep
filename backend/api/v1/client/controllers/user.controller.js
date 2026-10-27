import User from "../../../../models/user.model.js";
import Customer from "../../../../models/customer.model.js";
import Session from "../../../../models/session.model.js";
import bcrypt from "bcrypt";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/user/detail
export const getDetail = async (req, res) => {
  try {
    res.status(200).json({
      message: "lấy thông tin thành công",
      user: req.user,
    });
  } catch (error) {
    logger.logError("Lỗi hệ thống", error, {
      userId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/user/uploadAvatar
export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.body.avatar) {
      return res.status(400).json({ message: "Không nhận được ảnh!" });
    }

    const user = await User.findOneAndUpdate(
      { _id: userId },
      {
        avatarUrl: req.body.avatar,
      },
      { new: true },
    ).select("avatarUrl");

    res.json({
      message: "Cập nhật avatar thành công",
      avatarUrl: user.avatarUrl,
    });
  } catch (error) {
    logger.logError("Lỗi xảy ra khi upload Avatar", error, {
      userId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/user/profile
export const updateInfo = async (req, res) => {
  try {
    const { displayName, email, phone, address, birthday } = req.body;
    const userId = req.user._id;

    if (!displayName || !email || !phone) {
      return res.status(400).json({
        message: "Không thể thiếu displayName, email và phone",
      });
    }

    const existPhone = await User.findOne({
      _id: { $ne: userId },
      phone: phone,
    });

    if (existPhone) {
      return res.status(400).json({
        message: "Số điện thoại đã tồn tại",
      });
    }

    const user = await User.findOneAndUpdate(
      { _id: userId },
      {
        displayName: displayName,
        email: email,
        phone: phone,
      },
      { new: true },
    ).select("-hashedPassword");

    // Update customer info (address, birthday)
    await Customer.updateOne(
      { userId: userId },
      {
        address: address || "",
        birthday: birthday || null,
      },
    );

    // Get updated customer data
    const customer = await Customer.findOne({ userId: userId }).select(
      "address birthday",
    );

    // Merge user and customer data
    const userData = {
      ...user.toObject(),
      address: customer?.address || "",
      birthday: customer?.birthday || null,
    };

    res.json({
      message: "Cập nhật user thành công",
      user: userData,
    });
  } catch (error) {
    logger.logError("Lỗi xảy ra khi updateInfo", error, {
      userId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/user/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        message: "Thiếu thông tin mật khẩu",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        message: "Mật khẩu mới không khớp",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
    }

    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({
        message: "Người dùng không tồn tại",
      });
    }

    const passwordCorrect = await bcrypt.compare(
      currentPassword,
      user.hashedPassword,
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        message: "Mật khẩu hiện tại không chính xác",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updateOne({ _id: userId }, { hashedPassword: hashedPassword });

    // Xóa tất cả session của user để bắt đăng nhập lại
    await Session.deleteMany({ userId: userId });

    res.status(200).json({
      message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.",
    });
  } catch (error) {
    logger.logError("Lỗi xảy ra khi changePassword", error, {
      userId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
