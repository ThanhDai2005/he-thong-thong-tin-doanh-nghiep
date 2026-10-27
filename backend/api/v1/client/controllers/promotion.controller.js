import OrderPromotion from "../../../../models/orderPromotion.model.js";
import CustomerVoucher from "../../../../models/customerVoucher.model.js";
import Customer from "../../../../models/customer.model.js";
import Promotion from "../../../../models/promotion.model.js";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/promotion/collectible
export const getCollectibleVouchers = async (req, res) => {
  try {
    const now = new Date();

    const allActivePromos = await Promotion.find({
      deleted: false,
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).lean();

    // Lấy các promotionId đã là OrderPromotion (loại trừ)
    const orderPromoIds = await OrderPromotion.distinct("promotionId");

    // Lọc ra các promotion không phải OrderPromotion => là loại CustomerVoucher collectible
    const collectiblePromos = allActivePromos.filter(
      (p) => !orderPromoIds.some((id) => id.toString() === p._id.toString()),
    );

    let myVoucherPromotionIds = [];

    const customer = await Customer.findOne({ userId: req.user._id });

    if (customer) {
      const myVouchers = await CustomerVoucher.find({
        customerId: customer._id,
      }).select("promotionId");
      myVoucherPromotionIds = myVouchers.map((v) => v.promotionId.toString());
    }

    const result = collectiblePromos.map((p) => ({
      promotion: p,
      isCollected: myVoucherPromotionIds.includes(p._id.toString()),
    }));

    res.status(200).json({
      message: "Lấy danh sách voucher có thể thu thập thành công",
      data: result,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi getCollectibleVouchers", error, {
      userId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [POST] /api/v1/promotion/collect/:promotionId
export const collectVoucher = async (req, res) => {
  try {
    const { promotionId } = req.params;
    const now = new Date();

    const customer = await Customer.findOne({ userId: req.user._id });
    if (!customer) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy thông tin khách hàng" });
    }

    const promotion = await Promotion.findOne({
      _id: promotionId,
      deleted: false,
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (!promotion) {
      return res
        .status(404)
        .json({ message: "Khuyến mãi không tồn tại hoặc đã hết hạn" });
    }

    // Kiểm tra không phải OrderPromotion
    const isOrderPromo = await OrderPromotion.exists({ promotionId });
    if (isOrderPromo) {
      return res
        .status(400)
        .json({ message: "Khuyến mãi này không thể thu thập" });
    }

    // Kiểm tra đã thu thập chưa (unique index sẽ bắt, nhưng check trước để có thông báo rõ hơn)
    const existing = await CustomerVoucher.findOne({
      promotionId,
      customerId: customer._id,
    });
    if (existing) {
      return res.status(409).json({ message: "Bạn đã lưu voucher này rồi" });
    }

    // Kiểm tra usage limit toàn hệ thống
    if (
      promotion.usageLimit != null &&
      promotion.usedCount >= promotion.usageLimit
    ) {
      return res.status(409).json({ message: "Voucher đã hết lượt phát" });
    }

    await CustomerVoucher.create({
      promotionId,
      customerId: customer._id,
    });

    res.status(201).json({ message: "Thu thập voucher thành công" });
  } catch (error) {
    logger.logError("Lỗi khi gọi collectVoucher", error, {
      userId: req.user?._id,
      promotionId: req.params.promotionId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [GET] /api/v1/promotion/available
export const getAvailablePromotions = async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.user._id });
    if (!customer) {
      return res.status(400).json({
        message: "Không tìm thấy thông tin khách hàng",
      });
    }

    const now = new Date();

    // 1. Lấy OrderPromotions active + chưa dùng
    const orderPromotions = await OrderPromotion.find({})
      .populate({
        path: "promotionId",
        match: {
          deleted: false,
          status: "active",
          startDate: { $lte: now },
          endDate: { $gte: now },
        },
      })
      .lean();

    const validOrderPromotions = orderPromotions
      .filter((op) => op.promotionId !== null)
      .filter((op) => {
        const promo = op.promotionId;
        // Chưa dùng
        if (
          promo.customersUsed.some(
            (cid) => cid.toString() === customer._id.toString(),
          )
        ) {
          return false;
        }
        // Chưa hết lượt
        if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
          return false;
        }
        return true;
      })
      .map((op) => ({
        type: "orderPromotion",
        orderPromotionId: op._id,
        promotion: op.promotionId,
        minOrderValue: op.minOrderValue,
      }));

    // 2. Lấy CustomerVouchers chưa dùng
    const customerVouchers = await CustomerVoucher.find({
      customerId: customer._id,
      isUsed: false,
    })
      .populate({
        path: "promotionId",
        match: {
          deleted: false,
          status: "active",
          startDate: { $lte: now },
          endDate: { $gte: now },
        },
      })
      .lean();

    const validVouchers = customerVouchers
      .filter((v) => v.promotionId !== null)
      .map((v) => ({
        type: "customerVoucher",
        voucherId: v._id,
        promotion: v.promotionId,
      }));

    res.status(200).json({
      message: "Lấy danh sách khuyến mãi khả dụng thành công",
      data: {
        orderPromotions: validOrderPromotions,
        customerVouchers: validVouchers,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi getAvailablePromotions", error, {
      userId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [POST] /api/v1/promotion/calculate
export const calculateDiscount = async (req, res) => {
  try {
    const { orderValue, orderPromotionId, customerVoucherId } = req.body;

    if (!orderValue || orderValue <= 0) {
      return res.status(400).json({ message: "Giá trị đơn hàng không hợp lệ" });
    }

    const customer = await Customer.findOne({ userId: req.user._id });
    if (!customer) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy thông tin khách hàng" });
    }

    const now = new Date();
    let discountAmount = 0;
    let appliedPromo = null;

    if (orderPromotionId) {
      const orderPromo = await OrderPromotion.findOne({
        _id: orderPromotionId,
      }).populate("promotionId");
      if (!orderPromo || !orderPromo.promotionId) {
        return res.status(400).json({ message: "OrderPromotion không hợp lệ" });
      }

      const promo = orderPromo.promotionId;
      if (
        promo.deleted ||
        promo.status !== "active" ||
        promo.startDate > now ||
        promo.endDate < now
      ) {
        return res.status(400).json({ message: "Khuyến mãi không còn hợp lệ" });
      }

      if (
        promo.customersUsed.some(
          (cid) => cid.toString() === customer._id.toString(),
        )
      ) {
        return res
          .status(400)
          .json({ message: "Bạn đã sử dụng khuyến mãi này" });
      }

      if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
        return res.status(400).json({ message: "Khuyến mãi đã hết lượt" });
      }

      if (orderValue < orderPromo.minOrderValue) {
        return res.status(400).json({
          message: `Đơn hàng tối thiểu ${orderPromo.minOrderValue.toLocaleString("vi-VN")} VND`,
        });
      }

      if (promo.discountType === "percentage") {
        discountAmount = (orderValue * promo.discountValue) / 100;
        if (
          promo.maxDiscountAmount &&
          discountAmount > promo.maxDiscountAmount
        ) {
          discountAmount = promo.maxDiscountAmount;
        }
      } else {
        discountAmount = promo.discountValue;
      }

      // Giới hạn discount ≤ orderValue (không trừ vào tiền ship)
      discountAmount = Math.min(discountAmount, orderValue);

      appliedPromo = {
        type: "orderPromotion",
        code: promo.code,
        title: promo.title,
      };
    }

    if (customerVoucherId) {
      const voucher = await CustomerVoucher.findOne({
        _id: customerVoucherId,
        customerId: customer._id,
        isUsed: false,
      }).populate("promotionId");

      if (!voucher || !voucher.promotionId) {
        return res.status(400).json({ message: "Voucher không hợp lệ" });
      }

      const promo = voucher.promotionId;
      if (
        promo.deleted ||
        promo.status !== "active" ||
        promo.startDate > now ||
        promo.endDate < now
      ) {
        return res.status(400).json({ message: "Voucher không còn hợp lệ" });
      }

      let voucherDiscount = 0;
      if (promo.discountType === "percentage") {
        voucherDiscount = (orderValue * promo.discountValue) / 100;
        if (
          promo.maxDiscountAmount &&
          voucherDiscount > promo.maxDiscountAmount
        ) {
          voucherDiscount = promo.maxDiscountAmount;
        }
      } else {
        voucherDiscount = promo.discountValue;
      }

      // Giới hạn discount ≤ orderValue (không trừ vào tiền ship)
      voucherDiscount = Math.min(voucherDiscount, orderValue);

      if (voucherDiscount > discountAmount) {
        discountAmount = voucherDiscount;
        appliedPromo = {
          type: "customerVoucher",
          code: promo.code,
          title: promo.title,
        };
      }
    }

    discountAmount = Math.round(discountAmount);
    const finalAmount = Math.max(0, orderValue - discountAmount);

    res.status(200).json({
      message: "Tính toán giảm giá thành công",
      data: {
        orderValue,
        discountAmount,
        finalAmount,
        appliedPromo,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi calculateDiscount", error, {
      userId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
