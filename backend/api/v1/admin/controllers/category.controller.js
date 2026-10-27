import Category from "../../../../models/category.model.js";
import Product from "../../../../models/product.model.js";
import slugify from "slugify";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/category
export const list = async (req, res) => {
  try {
    const keyword = req.query.keyword;
    const status = req.query.status;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const filter = {
      deleted: false,
    };

    if (status && ["active", "inactive"].includes(status)) {
      filter.status = status;
    }

    const slugify = (str = "") => {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    };

    if (keyword) {
      const search = slugify(keyword);

      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const [data, totalItems] = await Promise.all([
      Category.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Category.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Lấy danh sách category thành công",
      data: data,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list category", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/admin/category/:categoryId
export const detail = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    const category = await Category.findOne({
      _id: categoryId,
      deleted: false,
    });

    if (!category) {
      return res.status(404).json({
        message: "Category không tồn tại",
      });
    }

    res.status(200).json({
      message: "Lấy chi tiết category thành công",
      data: category,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi detail category", error, {
      adminId: req.user?._id,
      categoryId: req.params.categoryId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/admin/category
export const create = async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Tên category là bắt buộc",
      });
    }

    const slug = slugify(name, { lower: true, strict: true });
    const existedCategory = await Category.findOne({ slug: slug });
    if (existedCategory) {
      return res.status(409).json({
        message: "Slug category đã tồn tại",
      });
    }

    const createdCategory = await Category.create({
      name: name,
      slug: slug,
      status: status || "active",
    });

    res.status(201).json({
      message: "Tạo category thành công",
      data: createdCategory,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi create category", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/category/update/:categoryId
export const update = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const { name, status } = req.body;

    if (!name && !status) {
      return res.status(400).json({
        message: "Không có dữ liệu để cập nhật",
      });
    }

    const existedCategory = await Category.findOne({
      _id: categoryId,
      deleted: false,
    });
    if (!existedCategory) {
      return res.status(404).json({
        message: "Category không tồn tại",
      });
    }

    let slug = existedCategory.slug;
    if (name) {
      slug = slugify(name, { lower: true, strict: true });
      const duplicateSlug = await Category.findOne({
        slug: slug,
        _id: { $ne: categoryId },
      });
      if (duplicateSlug) {
        return res.status(409).json({
          message: "Slug category đã tồn tại",
        });
      }
    }

    const updatedCategory = await Category.findOneAndUpdate(
      { _id: categoryId },
      {
        name: name,
        slug: slug,
        status: status,
      },
      { new: true },
    );

    res.status(200).json({
      message: "Cập nhật category thành công",
      data: updatedCategory,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi update category", error, {
      adminId: req.user?._id,
      categoryId: req.params.categoryId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/category/change-status/:status/:categoryId
export const changeStatus = async (req, res) => {
  try {
    const status = req.params.status;
    const categoryId = req.params.categoryId;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Status không hợp lệ. Chỉ chấp nhận: active, inactive",
      });
    }

    const existedCategory = await Category.findOne({
      _id: categoryId,
      deleted: false,
    });

    if (!existedCategory) {
      return res.status(404).json({
        message: "Category không tồn tại",
      });
    }

    await Category.updateOne({ _id: categoryId }, { status: status });

    res.status(200).json({
      message: "Cập nhật trạng thái thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi changeStatus category", error, {
      adminId: req.user?._id,
      categoryId: req.params.categoryId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/category/change-multi
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
        await Category.updateMany(
          { _id: { $in: ids }, deleted: false },
          { status: "active" },
        );
        res.status(200).json({
          message: `Cập nhật trạng thái thành công ${ids.length} danh mục`,
        });
        break;

      case "inactive":
        await Category.updateMany(
          { _id: { $in: ids }, deleted: false },
          { status: "inactive" },
        );
        res.status(200).json({
          message: `Cập nhật trạng thái thành công ${ids.length} danh mục`,
        });
        break;

      case "delete-all":
        if (!req.user.roleId.permissions.includes("categories_delete")) {
          return res.status(403).json({
            message: "Bạn không có quyền xóa danh mục",
          });
        }
        await Category.updateMany(
          { _id: { $in: ids }, deleted: false },
          {
            deleted: true,
            deletedAt: new Date(),
          },
        );
        await Product.updateMany(
          { categoryId: { $in: ids }, deleted: false },
          { categoryId: null },
        );
        res.status(200).json({
          message: `Đã xóa thành công ${ids.length} danh mục`,
        });
        break;

      default:
        res.status(400).json({
          message: "Type không hợp lệ",
        });
        break;
    }
  } catch (error) {
    logger.logError("Lỗi khi gọi changeMulti categories", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/category/delete/:categoryId
export const deleteItem = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    const existedCategory = await Category.findOne({
      _id: categoryId,
      deleted: false,
    });

    if (!existedCategory) {
      return res.status(404).json({
        message: "Category không tồn tại",
      });
    }

    await Category.updateOne(
      { _id: categoryId },
      {
        deleted: true,
        deletedAt: new Date(),
      },
    );

    await Product.updateMany(
      { categoryId: categoryId, deleted: false },
      { categoryId: null },
    );

    res.status(200).json({
      message: "Đã xóa thành công danh mục",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi deleteItem category", error, {
      adminId: req.user?._id,
      categoryId: req.params.categoryId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
