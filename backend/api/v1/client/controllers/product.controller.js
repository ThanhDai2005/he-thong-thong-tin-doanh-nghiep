import Product from "../../../../models/product.model.js";
import Category from "../../../../models/category.model.js";
import { getActiveProductPromotions } from "../../../../helpers/productPromotion.js";
import logger from "../../../../config/logger.js";
import {
  getCachedSearch,
  setCachedSearch,
} from "../../../../helpers/searchCache.helper.js";

// [GET] /api/v1/product
export const list = async (req, res) => {
  try {
    const {
      keyword,
      categorySlug,
      sortKey,
      sortValue,
      minPrice,
      maxPrice,
      hasPromotion,
    } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    // ✅ KEY DUY NHẤT cho TOÀN BỘ danh sách sản phẩm active (theo yêu cầu cô giáo)
    const ALL_PRODUCTS_CACHE_KEY = "ALL_ACTIVE_PRODUCTS";

    // ✅ Bước 1: Kiểm tra xem đã có toàn bộ danh sách sản phẩm trong RAM chưa
    let allProducts = getCachedSearch(ALL_PRODUCTS_CACHE_KEY);

    // ✅ Bước 2: Nếu chưa có (Cache Miss) → Query DB ĐÚng 1 LẦN duy nhất
    if (!allProducts) {
      logger.info("[CACHE MISS] ALL_ACTIVE_PRODUCTS - Query DB lần duy nhất");

      // Query TOÀN BỘ sản phẩm active từ Database
      allProducts = await Product.find({
        status: "active",
        deleted: false,
      })
        .populate("categoryId", "name slug")
        .lean();

      // Gắn activePromotion cho toàn bộ sản phẩm
      const allProductIds = allProducts.map((p) => p._id);
      const promoMap = await getActiveProductPromotions(allProductIds);

      allProducts = allProducts.map((product) => ({
        ...product,
        activePromotion: promoMap[product._id.toString()] || null,
      }));

      // ✅ Lưu TOÀN BỘ danh sách vào RAM (TTL: 10 phút)
      setCachedSearch(ALL_PRODUCTS_CACHE_KEY, allProducts, 600);
      logger.info(
        `[CACHE SET] ALL_ACTIVE_PRODUCTS - Đã lưu ${allProducts.length} sản phẩm vào RAM`,
      );
    } else {
      logger.info(
        `[CACHE HIT] ALL_ACTIVE_PRODUCTS - Tái sử dụng ${allProducts.length} sản phẩm từ RAM`,
      );
    }

    // ✅ Bước 3: LỌC TRONG RAM bằng JavaScript (KHÔNG query DB nữa)
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

    let filtered = [...allProducts]; // Copy mảng để không ảnh hưởng cache gốc

    // Filter theo keyword
    if (keyword) {
      const search = slugify(keyword);
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(keyword.toLowerCase()) ||
          p.slug.includes(search),
      );
    }

    // Filter theo category
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

      filtered = filtered.filter(
        (p) =>
          p.categoryId &&
          p.categoryId._id.toString() === category._id.toString(),
      );
    }

    // Filter theo khoảng giá
    if (minPrice || maxPrice) {
      const min = minPrice ? Number(minPrice) : 0;
      const max = maxPrice ? Number(maxPrice) : Infinity;
      filtered = filtered.filter((p) => p.price >= min && p.price <= max);
    }

    // Filter theo khuyến mãi
    if (hasPromotion === "true") {
      filtered = filtered.filter((p) => p.activePromotion !== null);
    }

    // ✅ Bước 4: SẮP XẾP trong RAM
    const sortKeyParam = sortKey || "createdAt";
    const sortValueParam = sortValue ? Number(sortValue) : -1;

    filtered.sort((a, b) => {
      let valA = a[sortKeyParam];
      let valB = b[sortKeyParam];

      // Xử lý Date object - chỉ gọi getTime() nếu là Date
      if (valA instanceof Date) valA = valA.getTime();
      if (valB instanceof Date) valB = valB.getTime();

      if (sortValueParam === 1) {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });

    // ✅ Bước 5: PHÂN TRANG trong RAM
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;
    const paginatedData = filtered.slice(skip, skip + limit);

    res.status(200).json({
      message: "Lấy danh sách product thành công",
      data: paginatedData,
      totalItems,
      totalPages,
      cached: true,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list product", error, {
      keyword: req.query.keyword,
      categorySlug: req.query.categorySlug,
      page: req.query.page,
      limit: req.query.limit,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/product/:slug
export const detail = async (req, res) => {
  try {
    const slug = req.params.slug;
    const data = await Product.findOne({
      slug: slug,
      status: "active",
      deleted: false,
    })
      .populate("categoryId", "name slug")
      .lean();

    if (!data) {
      return res.status(404).json({
        message: "Product không tồn tại",
      });
    }

    // Gắn activePromotion cho product detail
    const promoMap = await getActiveProductPromotions([data._id]);

    res.status(200).json({
      message: "Lấy chi tiết product thành công",
      data: {
        ...data,
        activePromotion: promoMap[data._id.toString()] || null,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi detail product", error, {
      slug: req.params.slug,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
