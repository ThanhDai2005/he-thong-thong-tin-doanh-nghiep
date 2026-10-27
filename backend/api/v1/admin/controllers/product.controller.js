import Product from "../../../../models/product.model.js";
import Category from "../../../../models/category.model.js";
import slugify from "slugify";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/product
export const list = async (req, res) => {
  try {
    const keyword = req.query.keyword;
    const categorySlug = req.query.categorySlug;
    const status = req.query.status;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = {
      deleted: false,
    };

    if (categorySlug) {
      const category = await Category.findOne({
        slug: categorySlug,
        status: "active",
        deleted: false,
      });

      if (!category) {
        return res.status(404).json({
          message: "Category không tồn tại",
        });
      }

      filter.categoryId = category._id;
    }

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
      Product.find(filter)
        .populate("categoryId", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Lấy danh sách product thành công",
      data: data,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list product", error, {
      adminId: req.user?._id,
      keyword: req.query.keyword,
      categorySlug: req.query.categorySlug,
      status: req.query.status,
      page: req.query.page,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/admin/product/:productId
export const detail = async (req, res) => {
  try {
    const productId = req.params.productId;

    const product = await Product.findOne({
      _id: productId,
      deleted: false,
    }).populate("categoryId", "name slug");

    if (!product) {
      return res.status(404).json({
        message: "Product không tồn tại",
      });
    }

    res.status(200).json({
      message: "Lấy chi tiết product thành công",
      data: product,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi detail product", error, {
      adminId: req.user?._id,
      productId: req.params.productId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/admin/product
export const create = async (req, res) => {
  try {
    const {
      name,
      description,
      ingredients,
      category,
      price,
      images,
      stock,
      status,
    } = req.body;

    if (!name || !description || !ingredients || !category || !price) {
      return res.status(400).json({
        message: "Thiếu dữ liệu bắt buộc",
      });
    }

    if (Number(stock) < 0) {
      return res.status(400).json({
        message: "Stock không hợp lệ",
      });
    }

    const existedCategory = await Category.findOne({
      _id: category,
      deleted: false,
    });
    if (!existedCategory) {
      return res.status(404).json({
        message: "Category không tồn tại",
      });
    }

    const slug = slugify(name, { lower: true, strict: true });
    const existedProduct = await Product.findOne({ slug: slug });
    if (existedProduct) {
      return res.status(409).json({
        message: "Slug product đã tồn tại",
      });
    }

    const createdProduct = await Product.create({
      name: name,
      slug: slug,
      description: description,
      ingredients: ingredients,
      categoryId: category,
      price: Number(price),
      images: images || [],
      stock: Number(stock || 0),
      status: status || "active",
    });

    res.status(201).json({
      message: "Tạo product thành công",
      data: createdProduct,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi create product", error, {
      adminId: req.user?._id,
      productName: req.body.name,
      category: req.body.category,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/product/update/:productId
export const update = async (req, res) => {
  try {
    const productId = req.params.productId;
    const {
      name,
      description,
      ingredients,
      category,
      price,
      images,
      stock,
      status,
    } = req.body;

    if (
      !name &&
      !description &&
      !ingredients &&
      !category &&
      !price &&
      !images &&
      !stock &&
      !status
    ) {
      return res.status(400).json({
        message: "Không có dữ liệu để cập nhật",
      });
    }

    if (Number(stock) < 0) {
      return res.status(400).json({
        message: "Stock không hợp lệ",
      });
    }

    const existedProduct = await Product.findOne({
      _id: productId,
      deleted: false,
    });
    if (!existedProduct) {
      return res.status(404).json({
        message: "Product không tồn tại",
      });
    }

    if (category) {
      const existedCategory = await Category.findOne({
        _id: category,
        deleted: false,
      });

      if (!existedCategory) {
        return res.status(404).json({
          message: "Category không tồn tại",
        });
      }
    }

    let slug = existedProduct.slug;
    if (name) {
      slug = slugify(name, { lower: true, strict: true });
      const duplicateSlug = await Product.findOne({
        slug: slug,
        _id: { $ne: productId },
      });
      if (duplicateSlug) {
        return res.status(409).json({
          message: "Slug product đã tồn tại",
        });
      }
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId },
      {
        name: name,
        slug: slug,
        description: description,
        ingredients: ingredients,
        categoryId: category,
        price: price ? Number(price) : existedProduct.price,
        images: images,
        stock: stock ? Number(stock) : existedProduct.stock,
        status: status,
      },
      { new: true },
    );

    res.status(200).json({
      message: "Cập nhật product thành công",
      data: updatedProduct,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi update product", error, {
      adminId: req.user?._id,
      productId: req.params.productId,
      productName: req.body.name,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/product/change-status/:status/:productId
export const changeStatus = async (req, res) => {
  try {
    const status = req.params.status;
    const productId = req.params.productId;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Status không hợp lệ. Chỉ chấp nhận: active, inactive",
      });
    }

    const existedProduct = await Product.findOne({
      _id: productId,
      deleted: false,
    });

    if (!existedProduct) {
      return res.status(404).json({
        message: "Product không tồn tại",
      });
    }

    await Product.updateOne({ _id: productId }, { status: status });

    res.status(200).json({
      message: "Cập nhật trạng thái thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi changeStatus product", error, {
      adminId: req.user?._id,
      productId: req.params.productId,
      status: req.params.status,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/product/change-multi
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
        await Product.updateMany(
          { _id: { $in: ids }, deleted: false },
          { status: "active" },
        );
        res.status(200).json({
          message: `Cập nhật trạng thái thành công ${ids.length} sản phẩm`,
        });
        break;

      case "inactive":
        await Product.updateMany(
          { _id: { $in: ids }, deleted: false },
          { status: "inactive" },
        );
        res.status(200).json({
          message: `Cập nhật trạng thái thành công ${ids.length} sản phẩm`,
        });
        break;

      case "delete-all":
        if (!req.user.roleId.permissions.includes("products_delete")) {
          return res.status(403).json({
            message: "Bạn không có quyền xóa sản phẩm",
          });
        }
        await Product.updateMany(
          { _id: { $in: ids }, deleted: false },
          {
            deleted: true,
            deletedAt: new Date(),
          },
        );
        res.status(200).json({
          message: `Đã xóa thành công ${ids.length} sản phẩm`,
        });
        break;

      default:
        res.status(400).json({
          message: "Type không hợp lệ",
        });
        break;
    }
  } catch (error) {
    logger.logError("Lỗi khi gọi changeMulti products", error, {
      adminId: req.user?._id,
      type: req.body.type,
      idsCount: req.body.ids?.length,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/product/delete/:productId
export const deleteItem = async (req, res) => {
  try {
    const productId = req.params.productId;

    const existedProduct = await Product.findOne({
      _id: productId,
      deleted: false,
    });

    if (!existedProduct) {
      return res.status(404).json({
        message: "Product không tồn tại",
      });
    }

    await Product.updateOne(
      { _id: productId },
      {
        deleted: true,
        deletedAt: new Date(),
      },
    );

    res.status(200).json({
      message: "Đã xóa thành công sản phẩm",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi deleteItem product", error, {
      adminId: req.user?._id,
      productId: req.params.productId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
