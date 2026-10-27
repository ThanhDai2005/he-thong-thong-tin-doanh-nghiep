import Role from "../../../../models/role.model.js";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/role
export const list = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      deleted: false,
    };

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    const [data, totalItems] = await Promise.all([
      Role.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Role.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Lấy danh sách vai trò thành công",
      data: data,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list role", error, {
      adminId: req.user?._id,
      roleId: req.user?.roleId,
      keyword: req.query.keyword,
      page: req.query.page,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/admin/role/detail/:roleId
export const detail = async (req, res) => {
  try {
    const roleId = req.params.roleId;

    const role = await Role.findOne({
      _id: roleId,
      deleted: false,
    });

    if (!role) {
      return res.status(404).json({
        message: "Vai trò không tồn tại",
      });
    }

    res.status(200).json({
      message: "Lấy chi tiết vai trò thành công",
      data: role,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi detail role", error, {
      adminId: req.user?._id,
      roleId: req.user?.roleId,
      targetRoleId: req.params.roleId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/admin/role
export const create = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Thiếu tên vai trò",
      });
    }

    const existedRole = await Role.findOne({ title: title });
    if (existedRole) {
      return res.status(409).json({
        message: "Tên vai trò đã tồn tại",
      });
    }

    const createdRole = await Role.create({
      title: title,
      description: description || "",
    });

    res.status(201).json({
      message: "Tạo vai trò thành công",
      data: createdRole,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi create role", error, {
      adminId: req.user?._id,
      roleId: req.user?.roleId,
      title: req.body?.title,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/role/update/:roleId
export const update = async (req, res) => {
  try {
    const roleId = req.params.roleId;
    const { title, description } = req.body;

    if (!title && !description) {
      return res.status(400).json({
        message: "Không có dữ liệu để cập nhật",
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

    if (title) {
      const duplicateTitle = await Role.findOne({
        title: title,
        _id: { $ne: roleId },
      });
      if (duplicateTitle) {
        return res.status(409).json({
          message: "Tên vai trò đã tồn tại",
        });
      }
    }

    const updatedRole = await Role.findOneAndUpdate(
      { _id: roleId },
      {
        title: title,
        description: description,
      },
      { new: true },
    );

    res.status(200).json({
      message: "Cập nhật vai trò thành công",
      data: updatedRole,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi update role", error, {
      adminId: req.user?._id,
      roleId: req.user?.roleId,
      targetRoleId: req.params.roleId,
      title: req.body?.title,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/role/delete/:roleId
export const deleteItem = async (req, res) => {
  try {
    const roleId = req.params.roleId;

    const existedRole = await Role.findOne({
      _id: roleId,
      deleted: false,
    });

    if (!existedRole) {
      return res.status(404).json({
        message: "Vai trò không tồn tại",
      });
    }

    await Role.updateOne(
      { _id: roleId },
      {
        deleted: true,
        deletedAt: new Date(),
      },
    );

    res.status(200).json({
      message: "Xóa vai trò thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi delete role", error, {
      adminId: req.user?._id,
      roleId: req.user?.roleId,
      targetRoleId: req.params.roleId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/admin/role/permissions
export const getPermissions = async (req, res) => {
  try {
    const permissions = [
      // ── QUẢN LÝ DANH MỤC ──
      { group: "Quản lý danh mục", value: "categories_view", label: "Xem" },
      { group: "Quản lý danh mục", value: "categories_create", label: "Thêm" },
      { group: "Quản lý danh mục", value: "categories_edit", label: "Sửa" },
      { group: "Quản lý danh mục", value: "categories_delete", label: "Xóa" },

      // ── QUẢN LÝ SẢN PHẨM ──
      { group: "Quản lý sản phẩm", value: "products_view", label: "Xem" },
      { group: "Quản lý sản phẩm", value: "products_create", label: "Thêm" },
      { group: "Quản lý sản phẩm", value: "products_edit", label: "Sửa" },
      { group: "Quản lý sản phẩm", value: "products_delete", label: "Xóa" },

      // ── QUẢN LÝ NHÀ CUNG CẤP ──
      { group: "Quản lý nhà cung cấp", value: "suppliers_view", label: "Xem" },
      {
        group: "Quản lý nhà cung cấp",
        value: "suppliers_create",
        label: "Thêm",
      },
      { group: "Quản lý nhà cung cấp", value: "suppliers_edit", label: "Sửa" },
      {
        group: "Quản lý nhà cung cấp",
        value: "suppliers_delete",
        label: "Xóa",
      },

      // ── QUẢN LÝ PHIẾU NHẬP ──
      {
        group: "Quản lý phiếu nhập",
        value: "stock_receipts_view",
        label: "Xem",
      },
      {
        group: "Quản lý phiếu nhập",
        value: "stock_receipts_create",
        label: "Tạo phiếu nhập",
      },
      {
        group: "Quản lý phiếu nhập",
        value: "stock_receipts_edit",
        label: "Duyệt/Hủy phiếu",
      },

      // ── QUẢN LÝ DANH MỤC BÀI VIẾT ──
      {
        group: "Quản lý danh mục bài viết",
        value: "blog_categories_view",
        label: "Xem",
      },
      {
        group: "Quản lý danh mục bài viết",
        value: "blog_categories_create",
        label: "Thêm",
      },
      {
        group: "Quản lý danh mục bài viết",
        value: "blog_categories_edit",
        label: "Sửa",
      },
      {
        group: "Quản lý danh mục bài viết",
        value: "blog_categories_delete",
        label: "Xóa",
      },

      // ── QUẢN LÝ BÀI VIẾT ──
      { group: "Quản lý bài viết", value: "blogs_view", label: "Xem" },
      { group: "Quản lý bài viết", value: "blogs_create", label: "Thêm" },
      { group: "Quản lý bài viết", value: "blogs_edit", label: "Sửa" },
      { group: "Quản lý bài viết", value: "blogs_delete", label: "Xóa" },

      // ── QUẢN LÝ KHUYẾN MÃI ĐƠN HÀNG ──
      {
        group: "Quản lý khuyến mãi đơn hàng",
        value: "order_promotions_view",
        label: "Xem",
      },
      {
        group: "Quản lý khuyến mãi đơn hàng",
        value: "order_promotions_create",
        label: "Thêm",
      },
      {
        group: "Quản lý khuyến mãi đơn hàng",
        value: "order_promotions_edit",
        label: "Sửa",
      },
      {
        group: "Quản lý khuyến mãi đơn hàng",
        value: "order_promotions_delete",
        label: "Xóa",
      },

      // ── QUẢN LÝ KHUYẾN MÃI SẢN PHẨM ──
      {
        group: "Quản lý khuyến mãi sản phẩm",
        value: "product_promotions_view",
        label: "Xem",
      },
      {
        group: "Quản lý khuyến mãi sản phẩm",
        value: "product_promotions_create",
        label: "Thêm",
      },
      {
        group: "Quản lý khuyến mãi sản phẩm",
        value: "product_promotions_edit",
        label: "Sửa",
      },
      {
        group: "Quản lý khuyến mãi sản phẩm",
        value: "product_promotions_delete",
        label: "Xóa",
      },

      // ── QUẢN LÝ VOUCHER KHÁCH HÀNG ──
      {
        group: "Quản lý voucher khách hàng",
        value: "customer_vouchers_view",
        label: "Xem",
      },
      {
        group: "Quản lý voucher khách hàng",
        value: "customer_vouchers_create",
        label: "Tạo & Phát voucher",
      },

      // ── QUẢN LÝ KHÁCH HÀNG ──
      { group: "Quản lý khách hàng", value: "customers_view", label: "Xem" },
      { group: "Quản lý khách hàng", value: "customers_create", label: "Thêm" },
      { group: "Quản lý khách hàng", value: "customers_edit", label: "Sửa" },
      { group: "Quản lý khách hàng", value: "customers_delete", label: "Xóa" },

      // ── QUẢN LÝ NHÂN VIÊN ──
      { group: "Quản lý nhân viên", value: "staffs_view", label: "Xem" },
      { group: "Quản lý nhân viên", value: "staffs_create", label: "Thêm" },
      { group: "Quản lý nhân viên", value: "staffs_edit", label: "Sửa" },
      { group: "Quản lý nhân viên", value: "staffs_delete", label: "Xóa" },

      // ── QUẢN LÝ ĐƠN HÀNG ──
      { group: "Quản lý đơn hàng", value: "orders_view", label: "Xem" },
      { group: "Quản lý đơn hàng", value: "orders_edit", label: "Sửa" },

      // ── QUẢN LÝ VAI TRÒ  & PHÂN QUYỀN ──
      { group: "Quản lý vai trò", value: "roles_view", label: "Xem" },
      { group: "Quản lý vai trò", value: "roles_create", label: "Thêm" },
      { group: "Quản lý vai trò", value: "roles_edit", label: "Sửa" },
      { group: "Quản lý vai trò", value: "roles_delete", label: "Xóa" },
      {
        group: "Quản lý vai trò",
        value: "roles_permissions",
        label: "Phân quyền",
      },

      // ── CHĂM SÓC KHÁCH HÀNG ──
      { group: "Quản lý Chat", value: "chats_view", label: "Chat khách hàng" },
      {
        group: "Quản lý đánh giá",
        value: "reviews_view",
        label: "Xem",
      },
      {
        group: "Quản lý đánh giá",
        value: "reviews_edit",
        label: "Phản hồi và xử lý đánh giá",
      },
      {
        group: "Quản lý khảo sát",
        value: "surveys_view",
        label: "Xem",
      },
      {
        group: "Quản lý khảo sát",
        value: "surveys_create",
        label: "Tạo & Gửi khảo sát",
      },
      {
        group: "Quản lý khảo sát",
        value: "surveys_edit",
        label: "Đóng / Mở khảo sát",
      },
    ];

    res.status(200).json({
      message: "Lấy danh sách quyền thành công",
      data: permissions,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi getPermissions", error, {
      adminId: req.user?._id,
      roleId: req.user?.roleId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/role/:roleId/permissions
export const updatePermissions = async (req, res) => {
  try {
    const roleId = req.params.roleId;
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        message: "Dữ liệu quyền không hợp lệ",
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

    const updatedRole = await Role.findOneAndUpdate(
      { _id: roleId },
      {
        permissions: permissions,
      },
      { new: true },
    );

    res.status(200).json({
      message: "Cập nhật quyền thành công",
      data: updatedRole,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi updatePermissions", error, {
      adminId: req.user?._id,
      roleId: req.user?.roleId,
      targetRoleId: req.params.roleId,
      permissionsCount: req.body?.permissions?.length,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
