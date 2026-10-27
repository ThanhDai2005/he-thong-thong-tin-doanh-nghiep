import User from "../../../../models/user.model.js";
import Staff from "../../../../models/staff.model.js";
import Role from "../../../../models/role.model.js";
import bcrypt from "bcrypt";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/staffs
export const list = async (req, res) => {
  try {
    const keyword = req.query.keyword;
    const roleId = req.query.roleId;
    const status = req.query.status;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Lấy danh sách userId từ Staff có roleId phù hợp
    const staffFilter = {};
    if (roleId) {
      staffFilter.roleId = roleId;
    }

    const staffs = await Staff.find(staffFilter)
      .select("userId roleId")
      .populate("roleId", "title")
      .lean();
    const staffIds = staffs.map((s) => s.userId);

    const filter = {
      _id: { $in: staffIds },
      deleted: false,
    };

    if (keyword) {
      filter.$or = [
        { displayName: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
        { phone: { $regex: keyword, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    const [users, totalItems] = await Promise.all([
      User.find(filter)
        .select("-hashedPassword")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const staffMap = {};
    staffs.forEach((s) => {
      staffMap[s.userId.toString()] = {
        staffId: s._id,
        roleId: s.roleId,
      };
    });

    const formattedData = users.map((user) => {
      const staffInfo = staffMap[user._id.toString()];
      return {
        ...user,
        staffId: staffInfo?.staffId || null,
        roleId: staffInfo?.roleId || null,
      };
    });

    res.status(200).json({
      message: "Lấy danh sách nhân viên thành công",
      data: formattedData,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list staff", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/admin/staffs/:staffId
export const detail = async (req, res) => {
  try {
    const staffId = req.params.staffId;

    const staff = await Staff.findOne({
      _id: staffId,
    }).populate("roleId", "title");

    if (!staff) {
      return res.status(404).json({
        message: "Nhân viên không tồn tại",
      });
    }

    const user = await User.findOne({
      _id: staff.userId,
      deleted: false,
    })
      .select("-hashedPassword")
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "Tài khoản không tồn tại",
      });
    }

    res.status(200).json({
      message: "Lấy chi tiết nhân viên thành công",
      data: {
        _id: staff._id,
        ...user,
        roleId: staff.roleId,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi detail staff", error, {
      adminId: req.user?._id,
      targetStaffId: req.params.staffId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/admin/staffs
export const create = async (req, res) => {
  try {
    const { displayName, email, phone, password, roleId, status } = req.body;

    if (!displayName || !email || !phone || !password || !roleId) {
      return res.status(400).json({
        message: "Thiếu dữ liệu bắt buộc",
      });
    }

    const existedEmail = await User.findOne({ email: email });
    if (existedEmail) {
      return res.status(409).json({
        message: "Email đã tồn tại",
      });
    }

    const existedPhone = await User.findOne({ phone: phone });
    if (existedPhone) {
      return res.status(409).json({
        message: "Số điện thoại đã tồn tại",
      });
    }

    const existedRole = await Role.findOne({
      _id: roleId,
      deleted: false,
    });
    if (!existedRole) {
      return res.status(404).json({
        message: "Vai trò không tồn tại",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await User.create({
      displayName: displayName,
      email: email,
      phone: phone,
      hashedPassword: hashedPassword,
      status: status || "active",
    });

    const createdStaff = await Staff.create({
      userId: createdUser._id,
      roleId: roleId,
    });

    const staffData = await Staff.findOne({ _id: createdStaff._id }).populate(
      "roleId",
      "title",
    );

    const userData = await User.findOne({ _id: createdUser._id })
      .select("-hashedPassword")
      .lean();

    res.status(201).json({
      message: "Tạo nhân viên thành công",
      data: {
        _id: staffData._id,
        ...userData,
        roleId: staffData.roleId,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi create staff", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/staffs/update/:staffId
export const update = async (req, res) => {
  try {
    const staffId = req.params.staffId;
    const { displayName, email, phone, password, roleId, status } = req.body;

    if (!displayName && !email && !phone && !password && !roleId && !status) {
      return res.status(400).json({
        message: "Không có dữ liệu để cập nhật",
      });
    }

    const existedStaff = await Staff.findOne({
      _id: staffId,
    });

    if (!existedStaff) {
      return res.status(404).json({
        message: "Nhân viên không tồn tại",
      });
    }

    const existedUser = await User.findOne({
      _id: existedStaff.userId,
      deleted: false,
    });

    if (!existedUser) {
      return res.status(404).json({
        message: "Tài khoản không tồn tại",
      });
    }

    if (email) {
      const duplicateEmail = await User.findOne({
        email: email,
        _id: { $ne: existedStaff.userId },
      });
      if (duplicateEmail) {
        return res.status(409).json({
          message: "Email đã tồn tại",
        });
      }
    }

    if (phone) {
      const duplicatePhone = await User.findOne({
        phone: phone,
        _id: { $ne: existedStaff.userId },
      });
      if (duplicatePhone) {
        return res.status(409).json({
          message: "Số điện thoại đã tồn tại",
        });
      }
    }

    if (roleId) {
      const existedRole = await Role.findOne({
        _id: roleId,
        deleted: false,
      });
      if (!existedRole) {
        return res.status(404).json({
          message: "Vai trò không tồn tại",
        });
      }
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : existedUser.hashedPassword;

    await User.findOneAndUpdate(
      { _id: existedStaff.userId },
      {
        displayName: displayName || existedUser.displayName,
        email: email || existedUser.email,
        phone: phone || existedUser.phone,
        hashedPassword: hashedPassword,
        status: status || existedUser.status,
      },
    );

    if (roleId) {
      await Staff.updateOne({ _id: staffId }, { roleId: roleId });
    }

    const updatedStaff = await Staff.findOne({ _id: staffId }).populate(
      "roleId",
      "title",
    );

    const updatedUser = await User.findOne({
      _id: existedStaff.userId,
    })
      .select("-hashedPassword")
      .lean();

    res.status(200).json({
      message: "Cập nhật nhân viên thành công",
      data: {
        _id: updatedStaff._id,
        ...updatedUser,
        roleId: updatedStaff.roleId,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi update staff", error, {
      adminId: req.user?._id,
      targetStaffId: req.params.staffId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/staffs/change-status/:staffId
export const changeStatus = async (req, res) => {
  try {
    const staffId = req.params.staffId;
    const { status } = req.body;

    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Trạng thái không hợp lệ",
      });
    }

    const existedStaff = await Staff.findOne({
      _id: staffId,
    }).populate("roleId");

    if (!existedStaff) {
      return res.status(404).json({
        message: "Nhân viên không tồn tại",
      });
    }

    const existedUser = await User.findOne({
      _id: existedStaff.userId,
      deleted: false,
    });

    if (!existedUser) {
      return res.status(404).json({
        message: "Tài khoản không tồn tại",
      });
    }

    // Prevent operations on Super Admin accounts
    if (existedStaff.roleId && existedStaff.roleId.title === "Super Admin") {
      return res.status(403).json({
        message: "Không thể thay đổi trạng thái tài khoản Super Admin",
      });
    }

    // Prevent self-locking
    if (
      req.user._id.toString() === existedStaff.userId.toString() &&
      status === "inactive"
    ) {
      return res.status(403).json({
        message: "Không thể tự khóa tài khoản của chính mình",
      });
    }

    await User.updateOne({ _id: existedStaff.userId }, { status: status });

    res.status(200).json({
      message: "Thay đổi trạng thái nhân viên thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi changeStatus staff", error, {
      adminId: req.user?._id,
      targetStaffId: req.params.staffId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/staffs/change-multi
export const changeMulti = async (req, res) => {
  try {
    const { type, ids } = req.body;

    if (!type) {
      return res.status(400).json({ message: "Thiếu type" });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: "Thiếu danh sách ids hoặc danh sách rỗng",
      });
    }

    // Tìm staff records để lấy userId
    const staffs = await Staff.find({ _id: { $in: ids } })
      .populate("roleId")
      .lean();
    const userIds = staffs.map((s) => s.userId);

    // Kiểm tra không được thao tác với Super Admin
    const hasSuperAdmin = staffs.some(
      (s) => s.roleId && s.roleId.title === "Super Admin",
    );
    if (hasSuperAdmin) {
      return res.status(403).json({
        message: "Không thể thao tác với tài khoản Super Admin",
      });
    }

    // Nếu là inactive, kiểm tra không được tự khóa mình
    if (type === "inactive") {
      const isSelfLocking = staffs.some(
        (s) => s.userId.toString() === req.user._id.toString(),
      );
      if (isSelfLocking) {
        return res.status(403).json({
          message: "Không thể tự khóa tài khoản của chính mình",
        });
      }
    }

    switch (type) {
      case "active":
        await User.updateMany(
          { _id: { $in: userIds }, deleted: false },
          { status: "active" },
        );
        res.status(200).json({
          message: `Kích hoạt thành công ${ids.length} nhân viên`,
        });
        break;

      case "inactive":
        await User.updateMany(
          { _id: { $in: userIds }, deleted: false },
          { status: "inactive" },
        );
        res.status(200).json({
          message: `Khóa thành công ${ids.length} nhân viên`,
        });
        break;

      case "delete-all":
        if (!req.user.roleId.permissions.includes("staffs_delete")) {
          return res.status(403).json({
            message: "Bạn không có quyền xóa nhân viên",
          });
        }
        await User.updateMany(
          { _id: { $in: userIds }, deleted: false },
          { deleted: true, deletedAt: new Date() },
        );
        res.status(200).json({
          message: `Đã xóa thành công ${ids.length} nhân viên`,
        });
        break;

      default:
        res.status(400).json({ message: "Type không hợp lệ" });
        break;
    }
  } catch (error) {
    logger.logError("Lỗi khi gọi changeMulti staff", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [PATCH] /api/v1/admin/staffs/delete/:staffId
export const deleteItem = async (req, res) => {
  try {
    const staffId = req.params.staffId;

    const existedStaff = await Staff.findOne({
      _id: staffId,
    }).populate("roleId");

    if (!existedStaff) {
      return res.status(404).json({
        message: "Nhân viên không tồn tại",
      });
    }

    const existedUser = await User.findOne({
      _id: existedStaff.userId,
      deleted: false,
    });

    if (!existedUser) {
      return res.status(404).json({
        message: "Tài khoản đã bị xóa",
      });
    }

    // Prevent deletion of Super Admin accounts
    if (existedStaff.roleId && existedStaff.roleId.title === "Super Admin") {
      return res.status(403).json({
        message: "Không thể xóa tài khoản Super Admin",
      });
    }

    await User.updateOne(
      { _id: existedStaff.userId },
      {
        deleted: true,
        deletedAt: new Date(),
      },
    );

    res.status(200).json({
      message: "Xóa nhân viên thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi delete staff", error, {
      adminId: req.user?._id,
      targetStaffId: req.params.staffId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
