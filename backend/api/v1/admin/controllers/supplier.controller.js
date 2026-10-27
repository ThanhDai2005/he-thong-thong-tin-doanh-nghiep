import Supplier from "../../../../models/supplier.model.js";
import logger from "../../../../config/logger.js";

// GET /admin/supplier
export const list = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { deleted: false };

    if (status && ["active", "inactive"].includes(status)) {
      filter.status = status;
    }

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
        { phone: { $regex: keyword, $options: "i" } },
        { taxCode: { $regex: keyword, $options: "i" } },
      ];
    }

    const [data, total] = await Promise.all([
      Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Supplier.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Lấy danh sách nhà cung cấp thành công",
      data: data,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list supplier", error, {
      adminId: req.user?._id,
      keyword: req.query?.keyword,
      status: req.query?.status,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// GET /admin/supplier/:supplierId
export const detail = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplier = await Supplier.findOne({
      _id: supplierId,
      deleted: false,
    });

    if (!supplier) {
      return res.status(404).json({ message: "Nhà cung cấp không tồn tại" });
    }

    res.status(200).json({
      message: "Lấy chi tiết nhà cung cấp thành công",
      data: supplier,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi detail supplier", error, {
      adminId: req.user?._id,
      supplierId: req.params?.supplierId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// POST /admin/supplier
export const create = async (req, res) => {
  try {
    const { name, phone, email, address, taxCode, status } = req.body;

    if (!name || !phone || !email || !address) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin bắt buộc" });
    }

    // Kiểm tra email trùng
    const existingEmail = await Supplier.findOne({
      email: email.toLowerCase().trim(),
      deleted: false,
    });
    if (existingEmail) {
      return res.status(409).json({ message: "Email nhà cung cấp đã tồn tại" });
    }

    // Kiểm tra số điện thoại trùng
    const existingPhone = await Supplier.findOne({
      phone: phone.trim(),
      deleted: false,
    });
    if (existingPhone) {
      return res
        .status(409)
        .json({ message: "Số điện thoại nhà cung cấp đã tồn tại" });
    }

    const supplier = new Supplier({
      name: name,
      phone: phone,
      email: email,
      address: address,
      taxCode: taxCode ? taxCode : "",
      status: status || "active",
    });

    await supplier.save();

    res
      .status(201)
      .json({ message: "Tạo nhà cung cấp thành công", data: supplier });
  } catch (error) {
    logger.logError("Lỗi khi gọi create supplier", error, {
      adminId: req.user?._id,
      name: req.body?.name,
      email: req.body?.email,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// PATCH /admin/supplier/update/:supplierId
export const update = async (req, res) => {
  try {
    const supplierId = req.params.supplierId;
    const { name, phone, email, address, taxCode, status } = req.body;

    const supplier = await Supplier.findOne({
      _id: supplierId,
      deleted: false,
    });
    if (!supplier) {
      return res.status(404).json({ message: "Nhà cung cấp không tồn tại" });
    }

    if (email) {
      const existingEmail = await Supplier.findOne({
        email: email,
        deleted: false,
        _id: { $ne: supplierId },
      });
      if (existingEmail) {
        return res
          .status(409)
          .json({ message: "Email nhà cung cấp đã tồn tại" });
      }
    }

    if (phone) {
      const existingPhone = await Supplier.findOne({
        phone: phone.trim(),
        deleted: false,
        _id: { $ne: supplierId },
      });
      if (existingPhone) {
        return res
          .status(409)
          .json({ message: "Số điện thoại nhà cung cấp đã tồn tại" });
      }
    }

    const updated = await Supplier.findOneAndUpdate(
      { _id: supplierId, deleted: false },
      {
        name: name,
        phone: phone,
        email: email,
        address: address,
        taxCode: taxCode,
        status: status,
      },
      {
        new: true,
      },
    );

    res
      .status(200)
      .json({ message: "Cập nhật nhà cung cấp thành công", data: updated });
  } catch (error) {
    logger.logError("Lỗi khi gọi update supplier", error, {
      adminId: req.user?._id,
      supplierId: req.params?.supplierId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// PATCH /admin/supplier/change-status/:status/:supplierId
export const changeStatus = async (req, res) => {
  try {
    const { status, supplierId } = req.params;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const supplier = await Supplier.findOne({
      _id: supplierId,
      deleted: false,
    });
    if (!supplier) {
      return res.status(404).json({ message: "Nhà cung cấp không tồn tại" });
    }

    const oldStatus = supplier.status;
    supplier.status = status;
    await supplier.save();

    res
      .status(200)
      .json({ message: "Cập nhật trạng thái thành công", data: supplier });
  } catch (error) {
    logger.logError("Lỗi khi gọi changeStatus supplier", error, {
      adminId: req.user?._id,
      supplierId: req.params?.supplierId,
      status: req.params?.status,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [PATCH] /api/v1/admin/supplier/change-multi
export const changeMulti = async (req, res) => {
  try {
    const { type, ids } = req.body;

    if (!type) {
      return res.status(400).json({
        message: "Thiếu type",
      });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: "Thiếu danh sách ids hoặc danh sách rỗng",
      });
    }

    switch (type) {
      case "active":
        await Supplier.updateMany(
          { _id: { $in: ids }, deleted: false },
          { status: "active" },
        );

        return res.status(200).json({
          message: `Cập nhật trạng thái thành công ${ids.length} nhà cung cấp`,
        });

      case "inactive":
        await Supplier.updateMany(
          { _id: { $in: ids }, deleted: false },
          { status: "inactive" },
        );

        return res.status(200).json({
          message: `Cập nhật trạng thái thành công ${ids.length} nhà cung cấp`,
        });

      case "delete-all":
        if (!req.user.roleId?.permissions?.includes("suppliers_delete")) {
          return res.status(403).json({
            message: "Bạn không có quyền xóa nhà cung cấp",
          });
        }
        await Supplier.updateMany(
          { _id: { $in: ids }, deleted: false },
          {
            deleted: true,
            deletedAt: new Date(),
          },
        );

        return res.status(200).json({
          message: `Đã xóa thành công ${ids.length} nhà cung cấp`,
        });

      default:
        return res.status(400).json({
          message: "Type không hợp lệ",
        });
    }
  } catch (error) {
    logger.logError("Lỗi khi gọi changeMulti supplier", error, {
      adminId: req.user?._id,
      type: req.body?.type,
      idsCount: req.body?.ids?.length,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// PATCH /admin/supplier/delete/:supplierId
export const deleteItem = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const supplier = await Supplier.findOne({
      _id: supplierId,
      deleted: false,
    });
    if (!supplier) {
      return res.status(404).json({ message: "Nhà cung cấp không tồn tại" });
    }

    supplier.deleted = true;
    supplier.deletedAt = new Date();
    await supplier.save();

    res.status(200).json({ message: "Xóa nhà cung cấp thành công" });
  } catch (error) {
    logger.logError("Lỗi khi gọi deleteItem supplier", error, {
      adminId: req.user?._id,
      supplierId: req.params?.supplierId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
