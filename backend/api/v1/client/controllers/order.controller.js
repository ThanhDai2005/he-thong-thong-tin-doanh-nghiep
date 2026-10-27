import Order from "../../../../models/order.model.js";
import Product from "../../../../models/product.model.js";
import OrderPromotion from "../../../../models/orderPromotion.model.js";
import CustomerVoucher from "../../../../models/customerVoucher.model.js";
import Promotion from "../../../../models/promotion.model.js";
import Customer from "../../../../models/customer.model.js";
import Cart from "../../../../models/cart.model.js";
import Review from "../../../../models/review.model.js";
import crypto from "crypto";
import { createMoMoPayment } from "../../../../helpers/momo.js";
import {
  createVNPAYPayment,
  verifyVNPAYCallback,
} from "../../../../helpers/vnpay.js";
import { sendEmail } from "../../../../helpers/mailer.js";
import { orderConfirmationTemplate } from "../../../../helpers/orderConfirmation.template.js";
import logger from "../../../../config/logger.js";

// [POST] /api/v1/order
export const create = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      orderPromotionId,
      customerVoucherId,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Danh sách sản phẩm không hợp lệ",
      });
    }

    if (
      !shippingAddress ||
      !shippingAddress.recipient ||
      !shippingAddress.phone ||
      !shippingAddress.address
    ) {
      return res.status(400).json({
        message: "Thông tin địa chỉ giao hàng không hợp lệ",
      });
    }

    const normalizedItems = [];
    let subtotal = 0;

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({
          message: "Dữ liệu sản phẩm trong đơn hàng không hợp lệ",
        });
      }

      const product = await Product.findOne({
        _id: item.productId,
        status: "active",
        deleted: false,
      });

      if (!product) {
        return res.status(404).json({
          message: `Sản phẩm không tồn tại hoặc đã ngừng kinh doanh`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Sản phẩm ${product.name} không đủ tồn kho`,
        });
      }

      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;

      normalizedItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: Number(product.price || 0),
      });
    }

    const shippingFeeValue = 30000;

    let discountAmountValue = 0;
    let validatedOrderPromotion = null;
    let validatedCustomerVoucher = null;

    const customer = await Customer.findOne({ userId: req.user._id });
    if (!customer) {
      return res.status(400).json({
        message: "Không tìm thấy thông tin khách hàng",
      });
    }

    // Validate OrderPromotion if applied
    if (orderPromotionId) {
      const orderPromotion = await OrderPromotion.findOne({
        _id: orderPromotionId,
      }).populate("promotionId");

      if (!orderPromotion || !orderPromotion.promotionId) {
        return res.status(400).json({
          message: "Mã khuyến mãi đơn hàng không tồn tại",
        });
      }

      const promotion = orderPromotion.promotionId;
      const now = new Date();

      // Kiểm tra promotion cha còn active và trong thời hạn
      if (
        promotion.deleted ||
        promotion.status !== "active" ||
        promotion.startDate > now ||
        promotion.endDate < now
      ) {
        return res.status(400).json({
          message: "Mã khuyến mãi đơn hàng không còn hợp lệ",
        });
      }

      // Check if customer already used this promotion
      if (
        promotion.customersUsed.some(
          (cid) => cid.toString() === customer._id.toString(),
        )
      ) {
        return res.status(400).json({
          message: "Bạn đã sử dụng mã khuyến mãi này rồi",
        });
      }

      // Check usage limit
      if (
        promotion.usageLimit != null &&
        promotion.usedCount >= promotion.usageLimit
      ) {
        return res.status(400).json({
          message: "Mã khuyến mãi đã hết lượt sử dụng",
        });
      }

      // Check minimum order value
      if (subtotal < orderPromotion.minOrderValue) {
        return res.status(400).json({
          message: `Đơn hàng tối thiểu ${orderPromotion.minOrderValue.toLocaleString("vi-VN")} VND để áp dụng mã này`,
        });
      }

      // Calculate discount
      if (promotion.discountType === "percentage") {
        discountAmountValue = (subtotal * promotion.discountValue) / 100;
        if (
          promotion.maxDiscountAmount &&
          discountAmountValue > promotion.maxDiscountAmount
        ) {
          discountAmountValue = promotion.maxDiscountAmount;
        }
      } else if (promotion.discountType === "fixed") {
        discountAmountValue = promotion.discountValue;
      }

      // Giới hạn discount ≤ subtotal (không trừ vào tiền ship)
      discountAmountValue = Math.min(discountAmountValue, subtotal);
      discountAmountValue = Math.round(discountAmountValue);
      validatedOrderPromotion = { orderPromotion, promotion };
    }

    // Validate CustomerVoucher if applied (override orderPromotion)
    if (customerVoucherId) {
      const customerVoucher = await CustomerVoucher.findOne({
        _id: customerVoucherId,
        customerId: customer._id,
        isUsed: false,
      }).populate("promotionId");

      if (!customerVoucher || !customerVoucher.promotionId) {
        return res.status(400).json({
          message: "Voucher không còn hợp lệ hoặc đã được sử dụng",
        });
      }

      const voucherPromotion = customerVoucher.promotionId;
      const now = new Date();

      // Kiểm tra promotion cha còn active
      if (
        voucherPromotion.deleted ||
        voucherPromotion.status !== "active" ||
        voucherPromotion.startDate > now ||
        voucherPromotion.endDate < now
      ) {
        return res.status(400).json({
          message: "Voucher không còn trong thời hạn sử dụng",
        });
      }

      // Calculate voucher discount (override previous discount)
      let voucherDiscount = 0;
      if (voucherPromotion.discountType === "percentage") {
        voucherDiscount = (subtotal * voucherPromotion.discountValue) / 100;
        if (
          voucherPromotion.maxDiscountAmount &&
          voucherDiscount > voucherPromotion.maxDiscountAmount
        ) {
          voucherDiscount = voucherPromotion.maxDiscountAmount;
        }
      } else if (voucherPromotion.discountType === "fixed") {
        voucherDiscount = voucherPromotion.discountValue;
      }

      // Giới hạn discount ≤ subtotal (không trừ vào tiền ship)
      voucherDiscount = Math.min(voucherDiscount, subtotal);
      voucherDiscount = Math.round(voucherDiscount);

      // Voucher overrides orderPromotion if higher
      if (voucherDiscount > discountAmountValue) {
        discountAmountValue = voucherDiscount;
        validatedOrderPromotion = null; // Clear order promotion
        validatedCustomerVoucher = customerVoucher;
      }
    }

    const totalAmount = subtotal + shippingFeeValue - discountAmountValue;

    // Atomic stock deduction - prevent race condition
    const stockUpdates = [];
    for (const item of normalizedItems) {
      const updateResult = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          stock: { $gte: item.quantity },
          deleted: false,
          status: "active",
        },
        { $inc: { stock: -item.quantity } },
        { new: true },
      );

      if (!updateResult) {
        // Rollback previous stock changes
        for (const rollbackItem of stockUpdates) {
          await Product.updateOne(
            { _id: rollbackItem.productId },
            { $inc: { stock: rollbackItem.quantity } },
          );
        }

        return res.status(409).json({
          message: `Sản phẩm không đủ tồn kho (có thể đã được mua bởi người khác)`,
        });
      }

      stockUpdates.push(item);
    }

    const createdOrder = await Order.create({
      customerId: customer._id,
      items: normalizedItems,
      shippingAddress: {
        recipient: shippingAddress.recipient,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
      },
      paymentMethod: paymentMethod || "COD",
      paymentStatus: "Pending", // Mặc định chờ xử lý
      orderStatus: "Pending", // Mặc định chờ xử lý
      shippingFee: shippingFeeValue,
      orderPromotionId: validatedOrderPromotion
        ? validatedOrderPromotion.orderPromotion._id
        : null,
      customerVoucherId: validatedCustomerVoucher
        ? validatedCustomerVoucher._id
        : null,
      discountAmount: discountAmountValue,
      totalAmount: totalAmount,
    });

    // Update promotion usage (chỉ Promotion cha)
    if (validatedOrderPromotion) {
      // Ghi nhận customer đã dùng promotion cha
      await Promotion.updateOne(
        { _id: validatedOrderPromotion.promotion._id },
        {
          $inc: { usedCount: 1 },
          $addToSet: { customersUsed: customer._id },
        },
      );
    }

    // Mark voucher as used
    if (validatedCustomerVoucher) {
      await CustomerVoucher.updateOne(
        { _id: validatedCustomerVoucher._id },
        {
          isUsed: true,
          usedAt: new Date(),
          orderId: createdOrder._id,
        },
      );
    }

    // Clear cart after successful order creation
    await Cart.updateOne({ customerId: customer._id }, { items: [] });

    const populatedOrder = await Order.findOne({ _id: createdOrder._id })
      .populate("customerId")
      .populate("items.productId", "name images price");

    // Send order confirmation email
    try {
      if (req.user.email) {
        await sendEmail(
          req.user.email,
          "Xác nhận đơn hàng - Đặc Sản Ba Miền",
          orderConfirmationTemplate(populatedOrder),
        );
      }
    } catch (error) {
      logger.logWarning("Lỗi gửi email xác nhận đơn hàng", {
        orderId: createdOrder._id,
        email: req.user.email,
        endpoint: req.originalUrl,
      });
    }

    if (paymentMethod === "MOMO") {
      const momoResponse = await createMoMoPayment(createdOrder, totalAmount);

      if (momoResponse) {
        return res.status(201).json({
          message: "Tạo đơn hàng thành công, đang chuyển hướng sang MoMo...",
          data: populatedOrder,
          paymentUrl: momoResponse.payUrl,
        });
      }
    } else if (paymentMethod === "VNPAY") {
      const vnpayResponse = await createVNPAYPayment(createdOrder, totalAmount);

      if (vnpayResponse) {
        return res.status(201).json({
          message: "Tạo đơn hàng thành công, đang chuyển hướng sang VNPAY...",
          data: populatedOrder,
          paymentUrl: vnpayResponse,
        });
      }
    }

    res.status(201).json({
      message: "Tạo đơn hàng thành công",
      data: populatedOrder,
    });
  } catch (error) {
    logger.logError("Lỗi khi tạo đơn hàng", error, {
      userId: req.user?._id,
      items: req.body?.items?.length,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/order/momo-callback
export const momoCallback = async (req, res) => {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = req.body;

    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretkey = process.env.MOMO_SECRET_KEY;

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const calculatedSignature = crypto
      .createHmac("sha256", secretkey)
      .update(rawSignature)
      .digest("hex");

    if (calculatedSignature !== signature) {
      return res.status(400).json({ message: "Sai chữ ký bảo mật" });
    }

    const realOrderId = orderId.split("_")[0];

    const order = await Order.findOne({ _id: realOrderId });
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (order.paymentStatus !== "Pending") {
      return res
        .status(200)
        .json({ message: "Đơn hàng đã được xử lý từ trước" });
    }

    if (resultCode === 0) {
      await Order.updateOne(
        { _id: realOrderId },
        {
          paymentStatus: "Paid",
          orderStatus: "Processing",
        },
      );
      logger.logInfo("MoMo IPN: Thanh toán thành công", {
        orderId: realOrderId,
        transId: transId,
        amount: amount,
        endpoint: req.originalUrl,
      });
    } else {
      await Order.updateOne(
        { _id: realOrderId },
        {
          paymentStatus: "Failed",
        },
      );
      logger.logWarning("MoMo IPN: Thanh toán thất bại", {
        orderId: realOrderId,
        resultCode: resultCode,
        endpoint: req.originalUrl,
      });
    }

    return res.status(200).json({ message: "Đã xác nhận IPN" });
  } catch (error) {
    logger.logError("Lỗi khi xử lý MoMo IPN Callback", error, {
      orderId: req.body?.orderId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống khi xử lý IPN" });
  }
};

// [GET] /api/v1/order/vnpay-ipn
export const vnpayIpn = async (req, res) => {
  try {
    const { isValid, responseCode, txnRef, amount } = verifyVNPAYCallback(
      req.query,
    );

    if (!isValid) {
      return res
        .status(200)
        .json({ RspCode: "97", Message: "Invalid signature" });
    }

    const realOrderId = txnRef.split("_")[0];

    const order = await Order.findOne({ _id: realOrderId });
    if (!order) {
      return res
        .status(200)
        .json({ RspCode: "01", Message: "Order not found" });
    }

    // So sánh amount với Math.round để tránh floating point
    if (Math.round(order.totalAmount) !== amount) {
      logger.logWarning("VNPAY: Amount mismatch", {
        orderId: realOrderId,
        expectedAmount: order.totalAmount,
        actualAmount: amount,
        endpoint: req.originalUrl,
      });
      return res.status(200).json({ RspCode: "04", Message: "Amount invalid" });
    }

    if (order.paymentStatus !== "Pending") {
      return res
        .status(200)
        .json({ RspCode: "02", Message: "Order already confirmed" });
    }

    if (responseCode === "00") {
      await Order.updateOne(
        { _id: realOrderId },
        { paymentStatus: "Paid", orderStatus: "Processing" },
      );
      logger.logInfo("VNPAY IPN: Thanh toán thành công", {
        orderId: realOrderId,
        responseCode: responseCode,
        amount: amount,
        endpoint: req.originalUrl,
      });
    } else {
      await Order.updateOne({ _id: realOrderId }, { paymentStatus: "Failed" });
      logger.logWarning("VNPAY IPN: Thanh toán thất bại", {
        orderId: realOrderId,
        responseCode: responseCode,
        endpoint: req.originalUrl,
      });
    }

    return res.status(200).json({ RspCode: "00", Message: "Confirm success" });
  } catch (error) {
    logger.logError("Lỗi khi xử lý VNPAY IPN Callback", error, {
      orderId: req.query?.vnp_TxnRef,
      endpoint: req.originalUrl,
    });
    return res.status(200).json({ RspCode: "99", Message: "Input error" });
  }
};

// [POST] /api/v1/order/:orderId/retry-payment
export const retryPayment = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.user._id;

    const customer = await Customer.findOne({ userId: userId });
    if (!customer) {
      return res.status(400).json({
        message: "Không tìm thấy thông tin khách hàng",
      });
    }

    // Kiểm tra đơn hàng tồn tại và thuộc về customer
    const order = await Order.findOne({
      _id: orderId,
      customerId: customer._id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Đơn hàng không tồn tại",
      });
    }

    // Chỉ cho phép retry payment với đơn hàng chưa thanh toán
    if (order.paymentStatus !== "Pending" && order.paymentStatus !== "Failed") {
      return res.status(400).json({
        message: "Đơn hàng đã được thanh toán hoặc không thể thanh toán",
      });
    }

    // Chỉ cho phép retry với đơn hàng chưa bị hủy
    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({
        message: "Đơn hàng đã bị hủy, không thể thanh toán",
      });
    }

    // Chỉ hỗ trợ MoMo và VNPAY payment retry
    if (order.paymentMethod !== "MOMO" && order.paymentMethod !== "VNPAY") {
      return res.status(400).json({
        message: "Phương thức thanh toán không hỗ trợ thanh toán lại",
      });
    }

    if (order.paymentMethod === "MOMO") {
      const momoResponse = await createMoMoPayment(order, order.totalAmount);

      if (momoResponse) {
        return res.status(200).json({
          message: "Tạo link thanh toán lại thành công",
          paymentUrl: momoResponse.payUrl,
        });
      } else {
        return res
          .status(500)
          .json({ message: "Không thể tạo link thanh toán MoMo" });
      }
    } else if (order.paymentMethod === "VNPAY") {
      const vnpayResponse = await createVNPAYPayment(order, order.totalAmount);

      if (vnpayResponse) {
        return res.status(200).json({
          message: "Tạo link thanh toán lại thành công",
          paymentUrl: vnpayResponse,
        });
      } else {
        return res
          .status(500)
          .json({ message: "Không thể tạo link thanh toán VNPAY" });
      }
    }
  } catch (error) {
    logger.logError("Lỗi khi thanh toán lại đơn hàng", error, {
      userId: req.user?._id,
      orderId: req.params?.orderId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/order/my
export const myOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const customer = await Customer.findOne({ userId: req.user._id });
    if (!customer) {
      return res.status(400).json({
        message: "Không tìm thấy thông tin khách hàng",
      });
    }

    const filter = { customerId: customer._id };

    if (req.query.orderStatus) {
      filter.orderStatus = req.query.orderStatus;
    }

    const [data, totalItems] = await Promise.all([
      Order.find(filter)
        .populate("items.productId", "name images price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Lấy danh sách đơn hàng thành công",
      data: data,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi lấy danh sách đơn hàng", error, {
      userId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/order/detail/:orderId
export const detail = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const customer = await Customer.findOne({ userId: req.user._id });
    if (!customer) {
      return res.status(400).json({
        message: "Không tìm thấy thông tin khách hàng",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      customerId: customer._id,
    }).populate("items.productId", "name images price");

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
    logger.logError("Lỗi khi lấy chi tiết đơn hàng", error, {
      userId: req.user?._id,
      orderId: req.params?.orderId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/order/:orderId/reviews
export const getOrderReviews = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const customer = await Customer.findOne({ userId: req.user._id });
    if (!customer) {
      return res.status(400).json({
        message: "Không tìm thấy thông tin khách hàng",
      });
    }

    // Kiểm tra đơn hàng tồn tại và thuộc về customer
    const order = await Order.findOne({
      _id: orderId,
      customerId: customer._id,
    }).populate("items.productId", "name images price");

    if (!order) {
      return res.status(404).json({
        message: "Đơn hàng không tồn tại",
      });
    }

    // Lấy danh sách productId trong đơn hàng
    const productIds = order.items.map((item) => item.productId._id);

    // Lấy tất cả reviews của customer cho các sản phẩm trong đơn hàng
    const reviews = await Review.find({
      customerId: customer._id,
      productId: { $in: productIds },
    }).populate({
      path: "customerId",
      select: "userId",
      populate: {
        path: "userId",
        select: "displayName avatarUrl",
      },
    });

    res.status(200).json({
      message: "Lấy danh sách đánh giá thành công",
      data: {
        order: order,
        reviews: reviews,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi lấy danh sách đánh giá đơn hàng", error, {
      userId: req.user?._id,
      orderId: req.params?.orderId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/order/cancel/:orderId
export const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const customer = await Customer.findOne({ userId: req.user._id });
    if (!customer) {
      return res.status(400).json({
        message: "Không tìm thấy thông tin khách hàng",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      customerId: customer._id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Đơn hàng không tồn tại",
      });
    }

    // Client chỉ được hủy đơn khi orderStatus là Pending
    if (order.orderStatus !== "Pending") {
      return res.status(400).json({
        message: "Chỉ có thể hủy đơn hàng đang chờ xử lý",
      });
    }

    // Đơn đã thanh toán online không cho phép tự hủy
    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        message:
          "Đơn hàng đã thanh toán không thể tự hủy. Vui lòng liên hệ hỗ trợ",
      });
    }

    // Restore inventory
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } },
      );
    }

    // Rollback OrderPromotion usage (chỉ rollback promotion cha)
    if (order.orderPromotionId) {
      const orderPromo = await OrderPromotion.findOne({
        _id: order.orderPromotionId,
      });
      if (orderPromo) {
        await Promotion.updateOne(
          { _id: orderPromo.promotionId },
          {
            $inc: { usedCount: -1 },
            $pull: { customersUsed: customer._id },
          },
        );
      }
    }

    // Rollback CustomerVoucher usage
    if (order.customerVoucherId) {
      await CustomerVoucher.updateOne(
        { _id: order.customerVoucherId },
        {
          isUsed: false,
          usedAt: null,
          orderId: null,
        },
      );
    }

    const cancelledOrder = await Order.findOneAndUpdate(
      { _id: orderId },
      { orderStatus: "Cancelled" },
      { new: true },
    ).populate("items.productId", "name images price");

    res.status(200).json({
      message: "Hủy đơn hàng thành công",
      data: cancelledOrder,
    });
  } catch (error) {
    logger.logError("Lỗi khi hủy đơn hàng", error, {
      userId: req.user?._id,
      orderId: req.params?.orderId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
