import BlogCategory from "../../../../models/blogCategory.model.js";
import Blog from "../../../../models/blog.model.js";
import slugify from "slugify";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/blog-category
export const list = async (req, res) => {
  try {
    const keyword = req.query.keyword;
    const status = req.query.status;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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
      BlogCategory.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      BlogCategory.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Lấy danh sách blog category thành công",
      data: data,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list blog category", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/admin/blog-category/:blogCategoryId
export const detail = async (req, res) => {
  try {
    const blogCategoryId = req.params.blogCategoryId;

    const blogCategory = await BlogCategory.findOne({
      _id: blogCategoryId,
      deleted: false,
    });

    if (!blogCategory) {
      return res.status(404).json({
        message: "Blog category không tồn tại",
      });
    }

    res.status(200).json({
      message: "Lấy chi tiết blog category thành công",
      data: blogCategory,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi detail blog category", error, {
      adminId: req.user?._id,
      blogCategoryId: req.params.blogCategoryId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/admin/blog-category
export const create = async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Tên blog category là bắt buộc",
      });
    }

    const slug = slugify(name, { lower: true, strict: true });
    const existedBlogCategory = await BlogCategory.findOne({ slug: slug });
    if (existedBlogCategory) {
      return res.status(409).json({
        message: "Slug blog category đã tồn tại",
      });
    }

    const createdBlogCategory = await BlogCategory.create({
      name: name,
      slug: slug,
      status: status || "active",
    });

    res.status(201).json({
      message: "Tạo blog category thành công",
      data: createdBlogCategory,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi create blog category", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/blog-category/update/:blogCategoryId
export const update = async (req, res) => {
  try {
    const blogCategoryId = req.params.blogCategoryId;
    const { name, status } = req.body;

    if (!name && !status) {
      return res.status(400).json({
        message: "Không có dữ liệu để cập nhật",
      });
    }

    const existedBlogCategory = await BlogCategory.findOne({
      _id: blogCategoryId,
      deleted: false,
    });
    if (!existedBlogCategory) {
      return res.status(404).json({
        message: "Blog category không tồn tại",
      });
    }

    let slug = existedBlogCategory.slug;
    if (name) {
      slug = slugify(name, { lower: true, strict: true });
      const duplicateSlug = await BlogCategory.findOne({
        slug: slug,
        _id: { $ne: blogCategoryId },
      });
      if (duplicateSlug) {
        return res.status(409).json({
          message: "Slug blog category đã tồn tại",
        });
      }
    }

    const updatedBlogCategory = await BlogCategory.findOneAndUpdate(
      { _id: blogCategoryId },
      {
        name: name,
        slug: slug,
        status: status,
      },
      { new: true },
    );

    res.status(200).json({
      message: "Cập nhật blog category thành công",
      data: updatedBlogCategory,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi update blog category", error, {
      adminId: req.user?._id,
      blogCategoryId: req.params.blogCategoryId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/blog-category/change-status/:status/:blogCategoryId
export const changeStatus = async (req, res) => {
  try {
    const status = req.params.status;
    const blogCategoryId = req.params.blogCategoryId;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Status không hợp lệ. Chỉ chấp nhận: active, inactive",
      });
    }

    const existedBlogCategory = await BlogCategory.findOne({
      _id: blogCategoryId,
      deleted: false,
    });

    if (!existedBlogCategory) {
      return res.status(404).json({
        message: "Blog category không tồn tại",
      });
    }

    await BlogCategory.updateOne({ _id: blogCategoryId }, { status: status });

    res.status(200).json({
      message: "Cập nhật trạng thái thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi changeStatus blog category", error, {
      adminId: req.user?._id,
      blogCategoryId: req.params.blogCategoryId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/blog-category/change-multi
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
        await BlogCategory.updateMany(
          { _id: { $in: ids }, deleted: false },
          { status: "active" },
        );
        res.status(200).json({
          message: `Cập nhật trạng thái thành công ${ids.length} danh mục`,
        });
        break;

      case "inactive":
        await BlogCategory.updateMany(
          { _id: { $in: ids }, deleted: false },
          { status: "inactive" },
        );
        res.status(200).json({
          message: `Cập nhật trạng thái thành công ${ids.length} danh mục`,
        });
        break;

      case "delete-all":
        if (!req.user.roleId.permissions.includes("blog_categories_delete")) {
          return res.status(403).json({
            message: "Bạn không có quyền xóa danh mục blog",
          });
        }
        await BlogCategory.updateMany(
          { _id: { $in: ids }, deleted: false },
          {
            deleted: true,
            deletedAt: new Date(),
          },
        );
        // Set blogCategoryId to null for blogs in these categories
        await Blog.updateMany(
          { blogCategoryId: { $in: ids }, deleted: false },
          { blogCategoryId: null },
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
    logger.logError("Lỗi khi gọi changeMulti blog categories", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/blog-category/delete/:blogCategoryId
export const deleteItem = async (req, res) => {
  try {
    const blogCategoryId = req.params.blogCategoryId;

    const existedBlogCategory = await BlogCategory.findOne({
      _id: blogCategoryId,
      deleted: false,
    });

    if (!existedBlogCategory) {
      return res.status(404).json({
        message: "Blog category không tồn tại",
      });
    }

    await BlogCategory.updateOne(
      { _id: blogCategoryId },
      {
        deleted: true,
        deletedAt: new Date(),
      },
    );

    // Set blogCategoryId to null for blogs in this category
    await Blog.updateMany(
      { blogCategoryId: blogCategoryId, deleted: false },
      { blogCategoryId: null },
    );

    res.status(200).json({
      message: "Đã xóa thành công danh mục",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi deleteItem blog category", error, {
      adminId: req.user?._id,
      blogCategoryId: req.params.blogCategoryId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
