import Promotion from "../../../../models/promotion.model.js";
import ProductPromotion from "../../../../models/productPromotion.model.js";
import Product from "../../../../models/product.model.js";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/product-promotions
export const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const keyword = req.query.keyword;

    const promotionFilter = { deleted: false };
    if (req.query.status) {
      promotionFilter.status = req.query.status;
    }
    if (keyword) {
      promotionFilter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { code: { $regex: keyword, $options: "i" } },
      ];
    }

    const promotions = await Promotion.find(promotionFilter)
      .select("_id")
      .lean();
    const promotionIds = promotions.map((p) => p._id);

    const [data, totalItems] = await Promise.all([
      ProductPromotion.find({ promotionId: { $in: promotionIds } })
        .populate({
          path: "promotionId",
          select: "-customersUsed",
        })
        .populate("productIds", "name images price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ProductPromotion.countDocuments({ promotionId: { $in: promotionIds } }),
    ]);

    res.status(200).json({
      message: "Lấy danh sách khuyến mãi sản phẩm thành công",
      data: data,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list productPromotion", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [GET] /api/v1/admin/product-promotions/:productPromotionId
export const detail = async (req, res) => {
  try {
    const productPromotion = await ProductPromotion.findOne({
      _id: req.params.productPromotionId,
    })
      .populate("promotionId")
      .populate("productIds", "name images price");

    if (!productPromotion) {
      return res
        .status(404)
        .json({ message: "Khuyến mãi sản phẩm không tồn tại" });
    }

    res.status(200).json({
      message: "Lấy chi tiết khuyến mãi sản phẩm thành công",
      data: productPromotion,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi detail productPromotion", error, {
      adminId: req.user?._id,
      productPromotionId: req.params?.productPromotionId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [POST] /api/v1/admin/product-promotions
// Tạo Promotion (code chung) + ProductPromotion (danh sách sản phẩm)
export const create = async (req, res) => {
  try {
    const {
      title,
      code,
      discountType,
      discountValue,
      maxDiscountAmount,
      usageLimit,
      startDate,
      endDate,
      status,
      productIds,
    } = req.body;

    if (
      !title ||
      !code ||
      !discountType ||
      !discountValue ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Phải chọn ít nhất một sản phẩm" });
    }

    if (
      discountType === "percentage" &&
      (discountValue < 0 || discountValue > 100)
    ) {
      return res
        .status(400)
        .json({ message: "Giá trị giảm giá phần trăm phải từ 0 đến 100" });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res
        .status(400)
        .json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });
    }

    const existedCode = await Promotion.findOne({ code: code.toUpperCase() });
    if (existedCode) {
      return res.status(409).json({ message: "Mã khuyến mãi đã tồn tại" });
    }

    // Validate products exist
    const products = await Product.find({
      _id: { $in: productIds },
      deleted: false,
    }).select("_id");

    if (products.length !== productIds.length) {
      return res.status(400).json({ message: "Một số sản phẩm không tồn tại" });
    }

    const promotion = await Promotion.create({
      title,
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: status || "active",
    });

    const productPromotion = await ProductPromotion.create({
      promotionId: promotion._id,
      productIds: productIds,
    });

    const populated = await ProductPromotion.findOne({
      _id: productPromotion._id,
    })
      .populate("promotionId")
      .populate("productIds", "name images price");

    res.status(201).json({
      message: "Tạo khuyến mãi sản phẩm thành công",
      data: populated,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi create productPromotion", error, {
      adminId: req.user?._id,
      code: req.body?.code,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [PATCH] /api/v1/admin/product-promotions/update/:productPromotionId
export const update = async (req, res) => {
  try {
    const { productPromotionId } = req.params;
    const {
      productIds,
      title,
      code,
      discountType,
      discountValue,
      maxDiscountAmount,
      usageLimit,
      startDate,
      endDate,
      status,
    } = req.body;

    const existedProductPromo = await ProductPromotion.findOne({
      _id: productPromotionId,
    });
    if (!existedProductPromo) {
      return res
        .status(404)
        .json({ message: "Khuyến mãi sản phẩm không tồn tại" });
    }

    const existedPromotion = await Promotion.findOne({
      _id: existedProductPromo.promotionId,
      deleted: false,
    });
    if (!existedPromotion) {
      return res.status(404).json({ message: "Khuyến mãi gốc không tồn tại" });
    }

    if (code) {
      const duplicate = await Promotion.findOne({
        code: code.toUpperCase(),
        _id: { $ne: existedPromotion._id },
      });
      if (duplicate) {
        return res.status(409).json({ message: "Mã khuyến mãi đã tồn tại" });
      }
    }

    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      const products = await Product.find({
        _id: { $in: productIds },
        deleted: false,
      }).select("_id");
      if (products.length !== productIds.length) {
        return res
          .status(400)
          .json({ message: "Một số sản phẩm không tồn tại" });
      }
    }

    // Update Promotion cha
    await Promotion.updateOne(
      { _id: existedPromotion._id },
      {
        ...(title && { title }),
        ...(code && { code: code.toUpperCase() }),
        ...(discountType && { discountType }),
        ...(discountValue && { discountValue: Number(discountValue) }),
        ...(maxDiscountAmount !== undefined && {
          maxDiscountAmount: maxDiscountAmount
            ? Number(maxDiscountAmount)
            : null,
        }),
        ...(usageLimit !== undefined && {
          usageLimit: usageLimit ? Number(usageLimit) : null,
        }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(status && { status }),
      },
    );

    // Update ProductPromotion
    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      await ProductPromotion.updateOne(
        { _id: productPromotionId },
        { productIds },
      );
    }

    const updated = await ProductPromotion.findOne({ _id: productPromotionId })
      .populate("promotionId")
      .populate("productIds", "name images price");

    res.status(200).json({
      message: "Cập nhật khuyến mãi sản phẩm thành công",
      data: updated,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi update productPromotion", error, {
      adminId: req.user?._id,
      productPromotionId: req.params?.productPromotionId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [PATCH] /api/v1/admin/product-promotions/change-status/:productPromotionId
export const changeStatus = async (req, res) => {
  try {
    const { productPromotionId } = req.params;
    const { status } = req.body;

    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const existedProductPromo = await ProductPromotion.findOne({
      _id: productPromotionId,
    });
    if (!existedProductPromo) {
      return res
        .status(404)
        .json({ message: "Khuyến mãi sản phẩm không tồn tại" });
    }

    await Promotion.updateOne(
      { _id: existedProductPromo.promotionId },
      { status },
    );

    res.status(200).json({ message: "Thay đổi trạng thái thành công" });
  } catch (error) {
    logger.logError("Lỗi khi gọi changeStatus productPromotion", error, {
      adminId: req.user?._id,
      productPromotionId: req.params?.productPromotionId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [PATCH] /api/v1/admin/product-promotions/change-multi
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

    // Lấy danh sách ProductPromotion để có promotionId
    const productPromotions = await ProductPromotion.find({
      _id: { $in: ids },
    }).lean();

    if (productPromotions.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy khuyến mãi sản phẩm nào",
      });
    }

    const promotionIds = productPromotions.map((pp) => pp.promotionId);

    switch (type) {
      case "active":
        await Promotion.updateMany(
          { _id: { $in: promotionIds }, deleted: false },
          { status: "active" },
        );
        res.status(200).json({
          message: `Khôi phục thành công ${ids.length} khuyến mãi sản phẩm`,
        });
        break;

      case "inactive":
        await Promotion.updateMany(
          { _id: { $in: promotionIds }, deleted: false },
          { status: "inactive" },
        );
        res.status(200).json({
          message: `Ngưng hoạt động thành công ${ids.length} khuyến mãi sản phẩm`,
        });
        break;

      case "delete-all":
        await Promotion.updateMany(
          { _id: { $in: promotionIds }, deleted: false },
          { deleted: true, deletedAt: new Date() },
        );
        res.status(200).json({
          message: `Xóa vĩnh viễn thành công ${ids.length} khuyến mãi sản phẩm`,
        });
        break;

      default:
        res.status(400).json({ message: "Type không hợp lệ" });
        break;
    }
  } catch (error) {
    logger.logError("Lỗi khi gọi changeMulti productPromotion", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [PATCH] /api/v1/admin/product-promotions/delete/:productPromotionId
export const deleteItem = async (req, res) => {
  try {
    const { productPromotionId } = req.params;

    const existedProductPromo = await ProductPromotion.findOne({
      _id: productPromotionId,
    });
    if (!existedProductPromo) {
      return res
        .status(404)
        .json({ message: "Khuyến mãi sản phẩm không tồn tại" });
    }

    await Promotion.updateOne(
      { _id: existedProductPromo.promotionId },
      { deleted: true, deletedAt: new Date() },
    );

    res.status(200).json({ message: "Xóa khuyến mãi sản phẩm thành công" });
  } catch (error) {
    logger.logError("Lỗi khi gọi delete productPromotion", error, {
      adminId: req.user?._id,
      productPromotionId: req.params?.productPromotionId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
