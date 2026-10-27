import Review from "../../../../models/review.model.js";
import Product from "../../../../models/product.model.js";
import Order from "../../../../models/order.model.js";
import Customer from "../../../../models/customer.model.js";
import logger from "../../../../config/logger.js";

// [POST] /api/v1/review
export const create = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, orderId, rating, comment, images } = req.body;

    if (!productId || !orderId || !rating) {
      return res
        .status(400)
        .json({ message: "Thiếu productId, orderId hoặc rating" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating phải từ 1 đến 5" });
    }

    // Validate images array if provided
    if (images && Array.isArray(images) && images.length > 5) {
      return res.status(400).json({ message: "Tối đa 5 ảnh cho mỗi đánh giá" });
    }

    // Get customer from userId
    const customer = await Customer.findOne({ userId: userId });
    if (!customer) {
      return res.status(400).json({
        message: "Không tìm thấy thông tin khách hàng",
      });
    }

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findOne({
      _id: productId,
      deleted: false,
      status: "active",
    });
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    // Kiểm tra đơn hàng tồn tại, thuộc về customer, đã giao và chứa sản phẩm này
    const order = await Order.findOne({
      _id: orderId,
      customerId: customer._id,
      orderStatus: "Delivered",
      "items.productId": productId,
    });
    if (!order) {
      return res.status(403).json({
        message: "Đơn hàng không tồn tại hoặc chưa được giao thành công",
      });
    }

    // Kiểm tra customer đã review sản phẩm này trong đơn hàng này chưa
    const existingReview = await Review.findOne({
      customerId: customer._id,
      productId: productId,
      orderId: orderId,
    });
    if (existingReview) {
      return res.status(409).json({
        message: "Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi",
      });
    }

    const review = await Review.create({
      productId,
      customerId: customer._id,
      orderId,
      rating: Number(rating),
      comment: comment ? comment.trim() : "",
      images: images || [],
    });

    // Cập nhật averageRating và numReviews trên Product (chỉ tính review không bị ẩn)
    const allReviews = await Review.find({
      productId: productId,
      isHidden: false,
    });
    const numReviews = allReviews.length;
    const averageRating =
      numReviews > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / numReviews
        : 0;

    await Product.updateOne(
      { _id: productId },
      {
        averageRating: Math.round(averageRating * 10) / 10,
        numReviews: numReviews,
      },
    );

    // Kiểm tra xem customer đã review hết tất cả sản phẩm trong đơn hàng chưa
    // Nếu có thì cập nhật hasReviewed = true cho đơn hàng đó
    const productIdsInOrder = order.items.map((item) =>
      item.productId.toString(),
    );
    const reviewedProductsInOrder = await Review.find({
      customerId: customer._id,
      orderId: orderId,
      productId: { $in: productIdsInOrder },
    });

    // Nếu số lượng review bằng số lượng sản phẩm trong đơn thì đánh dấu đã review
    if (reviewedProductsInOrder.length === productIdsInOrder.length) {
      await Order.updateOne({ _id: orderId }, { hasReviewed: true });
    }

    const populatedReview = await Review.findOne({ _id: review._id })
      .populate({
        path: "customerId",
        select: "userId",
        populate: {
          path: "userId",
          select: "displayName avatarUrl",
        },
      })
      .lean();

    res.status(201).json({
      message: "Đánh giá sản phẩm thành công",
      data: populatedReview,
    });
  } catch (error) {
    logger.logError("Lỗi khi tạo review", error, {
      userId: req.user?._id,
      productId: req.body?.productId,
      orderId: req.body?.orderId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [GET] /api/v1/review/:productId
export const listByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findOne({
      _id: productId,
      status: "active",
      deleted: false,
    });
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    const [data, totalItems] = await Promise.all([
      Review.find({ productId: productId, isHidden: false })
        .populate({
          path: "customerId",
          select: "userId",
          populate: {
            path: "userId",
            select: "displayName avatarUrl",
          },
        })
        .populate({
          path: "adminReply.repliedBy",
          select: "userId roleId",
          populate: [
            { path: "userId", select: "displayName avatarUrl" },
            { path: "roleId", select: "title" },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ productId: productId, isHidden: false }),
    ]);

    res.status(200).json({
      message: "Lấy danh sách đánh giá thành công",
      data: data,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi lấy danh sách review", error, {
      productId: req.params?.productId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
