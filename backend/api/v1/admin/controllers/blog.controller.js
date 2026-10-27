import Blog from "../../../../models/blog.model.js";
import BlogCategory from "../../../../models/blogCategory.model.js";
import Product from "../../../../models/product.model.js";
import slugify from "slugify";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/blog
export const list = async (req, res) => {
  try {
    const keyword = req.query.keyword;
    const blogCategorySlug = req.query.blogCategorySlug;
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

    if (blogCategorySlug) {
      const blogCategory = await BlogCategory.findOne({
        slug: blogCategorySlug,
        status: "active",
        deleted: false,
      });

      if (!blogCategory) {
        return res.status(404).json({
          message: "Blog category không tồn tại",
        });
      }

      filter.blogCategoryId = blogCategory._id;
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
        { title: { $regex: keyword, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const [data, totalItems] = await Promise.all([
      Blog.find(filter)
        .populate({
          path: "authorId",
          select: "userId",
          populate: {
            path: "userId",
            select: "displayName",
          },
        })
        .populate("blogCategoryId", "name slug")
        .populate("relatedProducts", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Lấy danh sách blog thành công",
      data: data,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list blog", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/admin/blog/:blogId
export const detail = async (req, res) => {
  try {
    const blogId = req.params.blogId;

    const blog = await Blog.findOne({
      _id: blogId,
      deleted: false,
    })
      .populate({
        path: "authorId",
        select: "userId",
        populate: {
          path: "userId",
          select: "displayName",
        },
      })
      .populate("blogCategoryId", "name slug")
      .populate("relatedProducts", "name slug images price");

    if (!blog) {
      return res.status(404).json({
        message: "Blog không tồn tại",
      });
    }

    res.status(200).json({
      message: "Lấy chi tiết blog thành công",
      data: blog,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi detail blog", error, {
      adminId: req.user?._id,
      blogId: req.params.blogId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/admin/blog
export const create = async (req, res) => {
  try {
    const {
      title,
      content,
      imageUrl,
      blogCategory,
      featured,
      relatedProducts,
      status,
    } = req.body;

    if (!title || !content || !imageUrl) {
      return res.status(400).json({
        message: "Thiếu dữ liệu bắt buộc",
      });
    }

    const slug = slugify(title, { lower: true, strict: true });
    const existedBlog = await Blog.findOne({ slug: slug });
    if (existedBlog) {
      return res.status(409).json({
        message: "Slug blog đã tồn tại",
      });
    }

    // Validate blogCategory if provided
    if (blogCategory) {
      const existedBlogCategory = await BlogCategory.findOne({
        _id: blogCategory,
        deleted: false,
      });

      if (!existedBlogCategory) {
        return res.status(404).json({
          message: "Blog category không tồn tại",
        });
      }
    }

    // Validate relatedProducts if provided
    if (relatedProducts && relatedProducts.length > 0) {
      const validProducts = await Product.find({
        _id: { $in: relatedProducts },
        deleted: false,
      });

      if (validProducts.length !== relatedProducts.length) {
        return res.status(404).json({
          message: "Một số sản phẩm không tồn tại",
        });
      }
    }

    const createdBlog = await Blog.create({
      title: title,
      slug: slug,
      content: content,
      imageUrl: imageUrl,
      blogCategoryId: blogCategory || null,
      authorId: req.user._id,
      featured: featured || false,
      relatedProducts: relatedProducts || [],
      status: status || "active",
      publishedAt: status === "active" ? new Date() : null,
    });

    res.status(201).json({
      message: "Tạo blog thành công",
      data: createdBlog,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi create blog", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/blog/update/:blogId
export const update = async (req, res) => {
  try {
    const blogId = req.params.blogId;
    const {
      title,
      content,
      imageUrl,
      blogCategory,
      featured,
      relatedProducts,
      status,
    } = req.body;

    if (
      !title &&
      !content &&
      !imageUrl &&
      !blogCategory &&
      featured === undefined &&
      !relatedProducts &&
      !status
    ) {
      return res.status(400).json({
        message: "Không có dữ liệu để cập nhật",
      });
    }

    const existedBlog = await Blog.findOne({
      _id: blogId,
      deleted: false,
    });
    if (!existedBlog) {
      return res.status(404).json({
        message: "Blog không tồn tại",
      });
    }

    let slug = existedBlog.slug;
    if (title) {
      slug = slugify(title, { lower: true, strict: true });
      const duplicateSlug = await Blog.findOne({
        slug: slug,
        _id: { $ne: blogId },
      });
      if (duplicateSlug) {
        return res.status(409).json({
          message: "Slug blog đã tồn tại",
        });
      }
    }

    // Validate blogCategory if provided
    if (blogCategory) {
      const existedBlogCategory = await BlogCategory.findOne({
        _id: blogCategory,
        deleted: false,
      });

      if (!existedBlogCategory) {
        return res.status(404).json({
          message: "Blog category không tồn tại",
        });
      }
    }

    // Validate relatedProducts if provided
    if (relatedProducts && relatedProducts.length > 0) {
      const validProducts = await Product.find({
        _id: { $in: relatedProducts },
        deleted: false,
      });

      if (validProducts.length !== relatedProducts.length) {
        return res.status(404).json({
          message: "Một số sản phẩm không tồn tại",
        });
      }
    }

    // Set publishedAt if status changes to active
    let publishedAt = existedBlog.publishedAt;
    if (status === "active" && existedBlog.status !== "active") {
      publishedAt = new Date();
    }

    // Build update object
    const updateData = {
      title: title,
      slug: slug,
      content: content,
      blogCategoryId: blogCategory,
      featured: featured,
      relatedProducts: relatedProducts,
      status: status,
      publishedAt: publishedAt,
    };

    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    const updatedBlog = await Blog.findOneAndUpdate(
      { _id: blogId },
      updateData,
      { new: true },
    );

    res.status(200).json({
      message: "Cập nhật blog thành công",
      data: updatedBlog,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi update blog", error, {
      adminId: req.user?._id,
      blogId: req.params.blogId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/blog/change-status/:status/:blogId
export const changeStatus = async (req, res) => {
  try {
    const status = req.params.status;
    const blogId = req.params.blogId;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Status không hợp lệ. Chỉ chấp nhận: active, inactive",
      });
    }

    const existedBlog = await Blog.findOne({
      _id: blogId,
      deleted: false,
    });

    if (!existedBlog) {
      return res.status(404).json({
        message: "Blog không tồn tại",
      });
    }

    // Set publishedAt when status changes to active
    let publishedAt = existedBlog.publishedAt;
    if (status === "active" && existedBlog.status !== "active") {
      publishedAt = new Date();
    }

    await Blog.updateOne(
      { _id: blogId },
      { status: status, publishedAt: publishedAt },
    );

    res.status(200).json({
      message: "Cập nhật trạng thái thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi changeStatus blog", error, {
      adminId: req.user?._id,
      blogId: req.params.blogId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/blog/change-multi
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
        await Blog.updateMany(
          { _id: { $in: ids }, deleted: false },
          { status: "active", publishedAt: new Date() },
        );
        res.status(200).json({
          message: `Cập nhật trạng thái thành công ${ids.length} bài viết`,
        });
        break;

      case "inactive":
        await Blog.updateMany(
          { _id: { $in: ids }, deleted: false },
          { status: "inactive" },
        );
        res.status(200).json({
          message: `Cập nhật trạng thái thành công ${ids.length} bài viết`,
        });
        break;

      case "delete-all":
        if (!req.user.roleId.permissions.includes("blogs_delete")) {
          return res.status(403).json({
            message: "Bạn không có quyền xóa bài viết",
          });
        }
        await Blog.updateMany(
          { _id: { $in: ids }, deleted: false },
          {
            deleted: true,
            deletedAt: new Date(),
          },
        );
        res.status(200).json({
          message: `Đã xóa thành công ${ids.length} bài viết`,
        });
        break;

      default:
        res.status(400).json({
          message: "Type không hợp lệ",
        });
        break;
    }
  } catch (error) {
    logger.logError("Lỗi khi gọi changeMulti blogs", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/blog/delete/:blogId
export const deleteItem = async (req, res) => {
  try {
    const blogId = req.params.blogId;

    const existedBlog = await Blog.findOne({
      _id: blogId,
      deleted: false,
    });

    if (!existedBlog) {
      return res.status(404).json({
        message: "Blog không tồn tại",
      });
    }

    await Blog.updateOne(
      { _id: blogId },
      {
        deleted: true,
        deletedAt: new Date(),
      },
    );

    res.status(200).json({
      message: "Đã xóa thành công bài viết",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi deleteItem blog", error, {
      adminId: req.user?._id,
      blogId: req.params.blogId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
