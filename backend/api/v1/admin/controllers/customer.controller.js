import User from "../../../../models/user.model.js";
import Customer from "../../../../models/customer.model.js";
import bcrypt from "bcrypt";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/customer
export const list = async (req, res) => {
  try {
    const keyword = req.query.keyword;
    const status = req.query.status;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const customers = await Customer.find({}).select("userId address").lean();
    const customerIds = customers.map((c) => c.userId);

    const userFilter = {
      _id: { $in: customerIds }, // Chỉ tìm kiếm những User là Khách hàng
      deleted: false,
    };

    if (keyword) {
      userFilter.$or = [
        { displayName: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
        { phone: { $regex: keyword, $options: "i" } },
      ];
    }

    if (status) {
      userFilter.status = status;
    }

    const [users, totalItems] = await Promise.all([
      User.find(userFilter)
        .select("-hashedPassword")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(userFilter),
    ]);

    const customerMap = {};
    customers.forEach((c) => {
      customerMap[c.userId.toString()] = {
        customerId: c._id,
        address: c.address || "",
      };
    });

    const formattedData = users.map((user) => {
      const customerInfo = customerMap[user._id.toString()];
      return {
        ...user,
        customerId: customerInfo?.customerId || null,
        address: customerInfo?.address || "",
      };
    });

    res.status(200).json({
      message: "Lấy danh sách khách hàng thành công",
      data: formattedData,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list customer", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [GET] /api/v1/admin/customer/:customerId
export const detail = async (req, res) => {
  try {
    const customerId = req.params.customerId;

    const customer = await Customer.findOne({
      _id: customerId,
    });

    if (!customer) {
      return res.status(404).json({
        message: "Khách hàng không tồn tại",
      });
    }

    const user = await User.findOne({
      _id: customer.userId,
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
      message: "Lấy chi tiết khách hàng thành công",
      data: {
        _id: customer._id,
        ...user,
        address: customer.address,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi detail customer", error, {
      adminId: req.user?._id,
      targetCustomerId: req.params.customerId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/admin/customer
export const create = async (req, res) => {
  try {
    const { displayName, email, phone, password, status, address } = req.body;

    if (!displayName || !email || !phone || !password) {
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await User.create({
      displayName: displayName,
      email: email,
      phone: phone,
      hashedPassword: hashedPassword,
      status: status || "active",
    });

    const createdCustomer = await Customer.create({
      userId: createdUser._id,
      address: address || "",
    });

    const userData = await User.findOne({ _id: createdUser._id })
      .select("-hashedPassword")
      .lean();

    res.status(201).json({
      message: "Tạo khách hàng thành công",
      data: {
        _id: createdCustomer._id,
        ...userData,
        address: createdCustomer.address,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi create customer", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/customer/update/:customerId
export const update = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const { displayName, email, phone, password, status, address } = req.body;

    if (!displayName && !email && !phone && !password && !status && !address) {
      return res.status(400).json({
        message: "Không có dữ liệu để cập nhật",
      });
    }

    const existedCustomer = await Customer.findOne({
      _id: customerId,
    });

    if (!existedCustomer) {
      return res.status(404).json({
        message: "Khách hàng không tồn tại",
      });
    }

    const existedUser = await User.findOne({
      _id: existedCustomer.userId,
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
        _id: { $ne: existedCustomer.userId },
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
        _id: { $ne: existedCustomer.userId },
      });
      if (duplicatePhone) {
        return res.status(409).json({
          message: "Số điện thoại đã tồn tại",
        });
      }
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : existedUser.hashedPassword;

    await User.findOneAndUpdate(
      { _id: existedCustomer.userId },
      {
        displayName: displayName || existedUser.displayName,
        email: email || existedUser.email,
        phone: phone || existedUser.phone,
        hashedPassword: hashedPassword,
        status: status || existedUser.status,
      },
    );

    if (address !== undefined) {
      await Customer.updateOne({ _id: customerId }, { address: address });
    }

    const updatedCustomer = await Customer.findOne({ _id: customerId });

    const updatedUser = await User.findOne({
      _id: existedCustomer.userId,
    })
      .select("-hashedPassword")
      .lean();

    res.status(200).json({
      message: "Cập nhật khách hàng thành công",
      data: {
        _id: updatedCustomer._id,
        ...updatedUser,
        address: updatedCustomer.address,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi update customer", error, {
      adminId: req.user?._id,
      targetCustomerId: req.params.customerId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/customer/change-status/:customerId
export const changeStatus = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const { status } = req.body;

    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Trạng thái không hợp lệ",
      });
    }

    const existedCustomer = await Customer.findOne({
      _id: customerId,
    });

    if (!existedCustomer) {
      return res.status(404).json({
        message: "Khách hàng không tồn tại",
      });
    }

    const existedUser = await User.findOne({
      _id: existedCustomer.userId,
      deleted: false,
    });

    if (!existedUser) {
      return res.status(404).json({
        message: "Tài khoản không tồn tại",
      });
    }

    await User.updateOne({ _id: existedCustomer.userId }, { status: status });

    res.status(200).json({
      message: "Thay đổi trạng thái khách hàng thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi changeStatus customer", error, {
      adminId: req.user?._id,
      targetCustomerId: req.params.customerId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/customer/change-multi
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

    // Tìm customer records để lấy userId
    const customers = await Customer.find({ _id: { $in: ids } }).lean();
    const userIds = customers.map((c) => c.userId);

    switch (type) {
      case "active":
        await User.updateMany(
          { _id: { $in: userIds }, deleted: false },
          { status: "active" },
        );
        res.status(200).json({
          message: `Kích hoạt thành công ${ids.length} khách hàng`,
        });
        break;

      case "inactive":
        await User.updateMany(
          { _id: { $in: userIds }, deleted: false },
          { status: "inactive" },
        );
        res.status(200).json({
          message: `Khóa thành công ${ids.length} khách hàng`,
        });
        break;

      case "delete-all":
        if (!req.user.roleId.permissions.includes("customers_delete")) {
          return res.status(403).json({
            message: "Bạn không có quyền xóa khách hàng",
          });
        }
        await User.updateMany(
          { _id: { $in: userIds }, deleted: false },
          { deleted: true, deletedAt: new Date() },
        );
        res.status(200).json({
          message: `Đã xóa thành công ${ids.length} khách hàng`,
        });
        break;

      default:
        res.status(400).json({ message: "Type không hợp lệ" });
        break;
    }
  } catch (error) {
    logger.logError("Lỗi khi gọi changeMulti customer", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [PATCH] /api/v1/admin/customer/delete/:customerId
export const deleteItem = async (req, res) => {
  try {
    const customerId = req.params.customerId;

    const existedCustomer = await Customer.findOne({
      _id: customerId,
    });

    if (!existedCustomer) {
      return res.status(404).json({
        message: "Khách hàng không tồn tại",
      });
    }

    const existedUser = await User.findOne({
      _id: existedCustomer.userId,
      deleted: false,
    });

    if (!existedUser) {
      return res.status(404).json({
        message: "Tài khoản đã bị xóa",
      });
    }

    await User.updateOne(
      { _id: existedCustomer.userId },
      {
        deleted: true,
        deletedAt: new Date(),
      },
    );

    res.status(200).json({
      message: "Xóa khách hàng thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi delete customer", error, {
      adminId: req.user?._id,
      targetCustomerId: req.params.customerId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
