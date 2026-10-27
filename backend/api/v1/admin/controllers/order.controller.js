import Order from "../../../../models/order.model.js";
import Product from "../../../../models/product.model.js";
import OrderPromotion from "../../../../models/orderPromotion.model.js";
import CustomerVoucher from "../../../../models/customerVoucher.model.js";
import Promotion from "../../../../models/promotion.model.js";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/order
export const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.orderStatus) {
      filter.orderStatus = req.query.orderStatus;
    }

    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    if (req.query.search) {
      const sanitizedSearch = String(req.query.search)
        .normalize("NFC")
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const searchRegex = new RegExp(sanitizedSearch, "i");

      filter.$or = [
        // 2. Tìm kiếm theo mã đơn hàng (_id): Phải convert ObjectId thành String mới dùng Regex được
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: sanitizedSearch,
              options: "i",
            },
          },
        },
        { "shippingAddress.recipient": searchRegex },
        { "shippingAddress.phone": searchRegex },
      ];
    }

    const [data, totalItems] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "customerId",
          select: "userId address",
          populate: {
            path: "userId",
            select: "displayName email phone",
          },
        })
        .populate({
          path: "updatedBy",
          select: "userId",
          populate: {
            path: "userId",
            select: "displayName",
          },
        }),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Lấy danh sách đơn hàng thành công",
      data: data,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi lấy danh sách đơn hàng (admin)", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/admin/order/detail/:orderId
export const detail = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findOne({ _id: orderId })
      .populate({
        path: "customerId",
        select: "userId address",
        populate: {
          path: "userId",
          select: "displayName email phone avatarUrl",
        },
      })
      .populate("items.productId", "name images price")
      .populate({
        path: "orderPromotionId",
        populate: {
          path: "promotionId",
          select: "title code discountType discountValue",
        },
      })
      .populate({
        path: "customerVoucherId",
        populate: {
          path: "promotionId",
          select: "title code discountType discountValue",
        },
      })
      .populate({
        path: "updatedBy",
        select: "userId",
        populate: {
          path: "userId",
          select: "displayName",
        },
      });

    if (!order) {
      return res.status(404).json({
        message: "Đơn hàng không tồn tại",
      });
    }

    res.status(200).json({
      message: "Lấy chi tiết đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    logger.logError("Lỗi khi lấy chi tiết đơn hàng (admin)", error, {
      adminId: req.user?._id,
      orderId: req.params?.orderId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/order/update/:orderId
export const updateStatus = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { orderStatus, paymentStatus } = req.body;

    if (!orderStatus && !paymentStatus) {
      return res.status(400).json({
        message: "Không có dữ liệu để cập nhật",
      });
    }

    if (
      paymentStatus &&
      !["Pending", "Paid", "Failed", "Refunded"].includes(paymentStatus)
    ) {
      return res.status(400).json({
        message: "Trạng thái thanh toán không hợp lệ",
      });
    }

    const existedOrder = await Order.findOne({ _id: orderId });
    if (!existedOrder) {
      return res.status(404).json({
        message: "Đơn hàng không tồn tại",
      });
    }

    if (
      existedOrder.orderStatus == "Delivered" ||
      existedOrder.orderStatus == "Cancelled"
    ) {
      return res.status(409).json({
        message: `Không thể cập nhật đơn hàng đã ${existedOrder.orderStatus == "Delivered" ? "giao thành công" : "hủy"}`,
      });
    }

    // Validate logic chuyển trạng thái
    const validTransitions = {
      Pending: ["Processing", "Cancelled"],
      Processing: ["Shipped", "Cancelled"],
      Shipped: ["Delivered"],
    };

    if (orderStatus && orderStatus != existedOrder.orderStatus) {
      const allowedStatuses = validTransitions[existedOrder.orderStatus];
      if (!allowedStatuses || !allowedStatuses.includes(orderStatus)) {
        return res.status(409).json({
          message: `Không thể chuyển từ trạng thái ${existedOrder.orderStatus} sang ${orderStatus}`,
        });
      }
    }

    // Khi hủy đơn: hoàn trả stock + rollback promotion
    if (
      orderStatus === "Cancelled" &&
      existedOrder.orderStatus !== "Cancelled"
    ) {
      // Hoàn trả stock (chỉ với Pending)
      if (existedOrder.orderStatus === "Pending") {
        for (const item of existedOrder.items) {
          await Product.updateOne(
            { _id: item.productId },
            { $inc: { stock: item.quantity } },
          );
        }
      }

      // Rollback OrderPromotion usage
      if (existedOrder.orderPromotionId) {
        const orderPromo = await OrderPromotion.findOne({
          _id: existedOrder.orderPromotionId,
        });
        if (orderPromo) {
          // Rollback promotion cha
          await Promotion.updateOne(
            { _id: orderPromo.promotionId },
            {
              $inc: { usedCount: -1 },
              $pull: { customersUsed: existedOrder.customerId },
            },
          );
        }
      }

      // Rollback CustomerVoucher usage
      if (existedOrder.customerVoucherId) {
        await CustomerVoucher.updateOne(
          { _id: existedOrder.customerVoucherId },
          {
            isUsed: false,
            usedAt: null,
            orderId: null,
          },
        );
      }
    }

    const updatePayload = {
      updatedBy: req.staffId || null,
    };

    if (orderStatus) {
      updatePayload.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      updatePayload.paymentStatus = paymentStatus;
    }

    // Auto: COD + Delivered → Paid
    if (
      orderStatus === "Delivered" &&
      existedOrder.paymentMethod === "COD" &&
      existedOrder.paymentStatus === "Pending"
    ) {
      updatePayload.paymentStatus = "Paid";
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId },
      updatePayload,
      { new: true },
    )
      .populate({
        path: "customerId",
        select: "userId address",
        populate: {
          path: "userId",
          select: "displayName email",
        },
      })
      .populate("items.productId", "name images price");

    res.status(200).json({
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: updatedOrder,
    });
  } catch (error) {
    logger.logError("Lỗi khi cập nhật trạng thái đơn hàng (admin)", error, {
      adminId: req.user?._id,
      orderId: req.params?.orderId,
      orderStatus: req.body?.orderStatus,
      paymentStatus: req.body?.paymentStatus,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
