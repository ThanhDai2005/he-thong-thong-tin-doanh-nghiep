import Review from "../../../../models/review.model.js";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/review/stats
export const stats = async (req, res) => {
  try {
    const [total, hidden, ratingDist, avgResult] = await Promise.all([
      Review.countDocuments({}),
      Review.countDocuments({ isHidden: true }),
      Review.aggregate([
        { $group: { _id: "$rating", count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),
      Review.aggregate([{ $group: { _id: null, avg: { $avg: "$rating" } } }]),
    ]);

    const replied = await Review.countDocuments({
      "adminReply.content": { $ne: "" },
      "adminReply.repliedAt": { $ne: null },
    });

    res.status(200).json({
      message: "Lấy thống kê đánh giá thành công",
      data: {
        total,
        hidden,
        replied,
        visible: total - hidden,
        avgRating: parseFloat((avgResult[0]?.avg ?? 0).toFixed(1)),
        ratingDistribution: ratingDist,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi stats review (admin)", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [GET] /api/v1/admin/review
export const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { keyword, rating, visibility, sortKey, sortValue } = req.query;

    const filter = {};

    // Filter theo rating
    if (rating && rating !== "all") {
      filter.rating = parseInt(rating);
    }

    // Filter theo hiển thị / ẩn
    if (visibility === "hidden") filter.isHidden = true;
    else if (visibility === "visible") filter.isHidden = false;
    // "all" => không filter

    // Tìm kiếm trong comment hoặc adminReply
    if (keyword) {
      filter.$or = [
        { comment: { $regex: keyword, $options: "i" } },
        { "adminReply.content": { $regex: keyword, $options: "i" } },
      ];
    }

    const sort = {};
    if (sortKey && sortValue) {
      sort[sortKey] = Number(sortValue);
    } else {
      sort.createdAt = -1;
    }

    const [data, totalItems] = await Promise.all([
      Review.find(filter)
        .populate({ path: "productId", select: "name images slug" })
        .populate({
          path: "customerId",
          select: "userId",
          populate: {
            path: "userId",
            select: "displayName email phone avatarUrl",
          },
        })
        .populate("orderId", "_id createdAt")
        .populate({
          path: "adminReply.repliedBy",
          select: "userId roleId",
          populate: [
            { path: "userId", select: "displayName avatarUrl" },
            { path: "roleId", select: "title" },
          ],
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Lấy danh sách đánh giá thành công",
      data,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list review (admin)", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [GET] /api/v1/admin/review/detail/:reviewId
export const detail = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOne({ _id: reviewId })
      .populate({ path: "productId", select: "name images slug price" })
      .populate({
        path: "customerId",
        select: "userId address",
        populate: {
          path: "userId",
          select: "displayName email phone avatarUrl",
        },
      })
      .populate("orderId", "_id createdAt totalAmount status")
      .populate({
        path: "adminReply.repliedBy",
        select: "userId roleId",
        populate: [
          { path: "userId", select: "displayName avatarUrl" },
          { path: "roleId", select: "title" },
        ],
      })
      .lean();

    if (!review) {
      return res.status(404).json({ message: "Đánh giá không tồn tại" });
    }

    res.status(200).json({
      message: "Lấy chi tiết đánh giá thành công",
      data: review,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi detail review (admin)", error, {
      adminId: req.user?._id,
      reviewId: req.params?.reviewId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [PATCH] /api/v1/admin/review/reply/:reviewId
export const reply = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ message: "Nội dung phản hồi không được để trống" });
    }

    const review = await Review.findOne({ _id: reviewId });
    if (!review) {
      return res.status(404).json({ message: "Đánh giá không tồn tại" });
    }

    const staffId = req.staffId || null;

    review.adminReply = {
      content: content.trim(),
      repliedAt: new Date(),
      repliedBy: staffId,
    };

    await review.save();

    // Populate ĐẦY ĐỦ giống list — tránh FE mất product/customer khi merge
    const updated = await Review.findOne({ _id: reviewId })
      .populate({ path: "productId", select: "name images slug price" })
      .populate({
        path: "customerId",
        select: "userId address",
        populate: {
          path: "userId",
          select: "displayName email phone avatarUrl",
        },
      })
      .populate("orderId", "_id createdAt totalAmount status")
      .populate({
        path: "adminReply.repliedBy",
        select: "userId roleId",
        populate: [
          { path: "userId", select: "displayName avatarUrl" },
          { path: "roleId", select: "title" },
        ],
      })
      .lean();

    res.status(200).json({
      message: "Phản hồi đánh giá thành công",
      data: updated,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi reply review (admin)", error, {
      adminId: req.user?._id,
      reviewId: req.params?.reviewId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [PATCH] /api/v1/admin/review/delete-reply/:reviewId
export const deleteReply = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOne({ _id: reviewId });
    if (!review) {
      return res.status(404).json({ message: "Đánh giá không tồn tại" });
    }

    review.adminReply = { content: "", repliedAt: null, repliedBy: null };
    await review.save();

    const updated = await Review.findOne({ _id: reviewId })
      .populate({ path: "productId", select: "name images slug price" })
      .populate({
        path: "customerId",
        select: "userId address",
        populate: {
          path: "userId",
          select: "displayName email phone avatarUrl",
        },
      })
      .populate("orderId", "_id createdAt totalAmount status")
      .lean();

    res.status(200).json({
      message: "Đã xóa phản hồi thành công",
      data: updated,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi deleteReply review (admin)", error, {
      adminId: req.user?._id,
      reviewId: req.params?.reviewId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [PATCH] /api/v1/admin/review/toggle-hidden/:reviewId
// Ẩn / hiện đánh giá
export const toggleHidden = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOne({ _id: reviewId });
    if (!review) {
      return res.status(404).json({ message: "Đánh giá không tồn tại" });
    }

    const staffId = req.staffId || null;
    const nowHidden = !review.isHidden;

    review.isHidden = nowHidden;
    review.hiddenAt = nowHidden ? new Date() : null;
    review.hiddenBy = nowHidden ? staffId : null;

    await review.save();

    res.status(200).json({
      message: nowHidden ? "Đã ẩn đánh giá" : "Đã hiện đánh giá",
      data: { isHidden: review.isHidden },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi toggleHidden review (admin)", error, {
      adminId: req.user?._id,
      reviewId: req.params?.reviewId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
