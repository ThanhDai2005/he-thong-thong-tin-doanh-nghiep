import Promotion from "../../../../models/promotion.model.js";
import OrderPromotion from "../../../../models/orderPromotion.model.js";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/order-promotions
export const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const keyword = req.query.keyword;

    // Lấy danh sách promotionId từ OrderPromotion để join
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
      OrderPromotion.find({ promotionId: { $in: promotionIds } })
        .populate({
          path: "promotionId",
          match: promotionFilter,
          select: "-customersUsed",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      OrderPromotion.countDocuments({ promotionId: { $in: promotionIds } }),
    ]);

    // Filter out docs where populate returned null (mismatched filter)
    const filtered = data.filter((d) => d.promotionId !== null);

    res.status(200).json({
      message: "Lấy danh sách khuyến mãi đơn hàng thành công",
      data: filtered,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list orderPromotion", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [GET] /api/v1/admin/order-promotions/:orderPromotionId
export const detail = async (req, res) => {
  try {
    const orderPromotion = await OrderPromotion.findOne({
      _id: req.params.orderPromotionId,
    }).populate("promotionId");

    if (!orderPromotion) {
      return res
        .status(404)
        .json({ message: "Khuyến mãi đơn hàng không tồn tại" });
    }

    res.status(200).json({
      message: "Lấy chi tiết khuyến mãi đơn hàng thành công",
      data: orderPromotion,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi detail orderPromotion", error, {
      adminId: req.user?._id,
      orderPromotionId: req.params?.orderPromotionId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [POST] /api/v1/admin/order-promotions
// Tạo Promotion (code chung) + OrderPromotion (điều kiện đơn hàng)
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
      minOrderValue,
    } = req.body;

    if (
      !title ||
      !code ||
      !discountType ||
      !discountValue ||
      !startDate ||
      !endDate ||
      minOrderValue === undefined
    ) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
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

    const orderPromotion = await OrderPromotion.create({
      promotionId: promotion._id,
      minOrderValue: Number(minOrderValue),
    });

    const populated = await OrderPromotion.findOne({
      _id: orderPromotion._id,
    }).populate("promotionId");

    res.status(201).json({
      message: "Tạo khuyến mãi đơn hàng thành công",
      data: populated,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi create orderPromotion", error, {
      adminId: req.user?._id,
      code: req.body?.code,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [PATCH] /api/v1/admin/order-promotions/update/:orderPromotionId
export const update = async (req, res) => {
  try {
    const { orderPromotionId } = req.params;
    const {
      minOrderValue,
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

    const existedOrderPromo = await OrderPromotion.findOne({
      _id: orderPromotionId,
    });
    if (!existedOrderPromo) {
      return res
        .status(404)
        .json({ message: "Khuyến mãi đơn hàng không tồn tại" });
    }

    const existedPromotion = await Promotion.findOne({
      _id: existedOrderPromo.promotionId,
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

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res
        .status(400)
        .json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });
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

    // Update OrderPromotion
    if (minOrderValue !== undefined) {
      await OrderPromotion.updateOne(
        { _id: orderPromotionId },
        { minOrderValue: Number(minOrderValue) },
      );
    }

    const updated = await OrderPromotion.findOne({
      _id: orderPromotionId,
    }).populate("promotionId");

    res.status(200).json({
      message: "Cập nhật khuyến mãi đơn hàng thành công",
      data: updated,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi update orderPromotion", error, {
      adminId: req.user?._id,
      orderPromotionId: req.params?.orderPromotionId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [PATCH] /api/v1/admin/order-promotions/change-status/:orderPromotionId
export const changeStatus = async (req, res) => {
  try {
    const { orderPromotionId } = req.params;
    const { status } = req.body;

    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const existedOrderPromo = await OrderPromotion.findOne({
      _id: orderPromotionId,
    });
    if (!existedOrderPromo) {
      return res
        .status(404)
        .json({ message: "Khuyến mãi đơn hàng không tồn tại" });
    }

    await Promotion.updateOne(
      { _id: existedOrderPromo.promotionId },
      { status },
    );

    res.status(200).json({ message: "Thay đổi trạng thái thành công" });
  } catch (error) {
    logger.logError("Lỗi khi gọi changeStatus orderPromotion", error, {
      adminId: req.user?._id,
      orderPromotionId: req.params?.orderPromotionId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [PATCH] /api/v1/admin/order-promotions/change-multi
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

    // Lấy danh sách OrderPromotion để có promotionId
    const orderPromotions = await OrderPromotion.find({
      _id: { $in: ids },
    }).lean();

    if (orderPromotions.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy khuyến mãi đơn hàng nào",
      });
    }

    const promotionIds = orderPromotions.map((op) => op.promotionId);

    switch (type) {
      case "active":
        await Promotion.updateMany(
          { _id: { $in: promotionIds }, deleted: false },
          { status: "active" },
        );
        res.status(200).json({
          message: `Khôi phục thành công ${ids.length} khuyến mãi đơn hàng`,
        });
        break;

      case "inactive":
        await Promotion.updateMany(
          { _id: { $in: promotionIds }, deleted: false },
          { status: "inactive" },
        );
        res.status(200).json({
          message: `Ngưng hoạt động thành công ${ids.length} khuyến mãi đơn hàng`,
        });
        break;

      case "delete-all":
        await Promotion.updateMany(
          { _id: { $in: promotionIds }, deleted: false },
          { deleted: true, deletedAt: new Date() },
        );
        res.status(200).json({
          message: `Xóa vĩnh viễn thành công ${ids.length} khuyến mãi đơn hàng`,
        });
        break;

      default:
        res.status(400).json({ message: "Type không hợp lệ" });
        break;
    }
  } catch (error) {
    logger.logError("Lỗi khi gọi changeMulti orderPromotion", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [PATCH] /api/v1/admin/order-promotions/delete/:orderPromotionId
export const deleteItem = async (req, res) => {
  try {
    const { orderPromotionId } = req.params;

    const existedOrderPromo = await OrderPromotion.findOne({
      _id: orderPromotionId,
    });
    if (!existedOrderPromo) {
      return res
        .status(404)
        .json({ message: "Khuyến mãi đơn hàng không tồn tại" });
    }

    // Soft delete promotion cha
    await Promotion.updateOne(
      { _id: existedOrderPromo.promotionId },
      { deleted: true, deletedAt: new Date() },
    );

    res.status(200).json({ message: "Xóa khuyến mãi đơn hàng thành công" });
  } catch (error) {
    logger.logError("Lỗi khi gọi delete orderPromotion", error, {
      adminId: req.user?._id,
      orderPromotionId: req.params?.orderPromotionId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
