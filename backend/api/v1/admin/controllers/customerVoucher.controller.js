import Promotion from "../../../../models/promotion.model.js";
import CustomerVoucher from "../../../../models/customerVoucher.model.js";
import Customer from "../../../../models/customer.model.js";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/customer-vouchers
export const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const keyword = req.query.keyword;

    // Bước 1: Lấy danh sách promotionId duy nhất từ CustomerVoucher
    const voucherPromotionIds = await CustomerVoucher.distinct("promotionId");

    if (voucherPromotionIds.length === 0) {
      return res.status(200).json({
        message: "Lấy danh sách voucher khách hàng thành công",
        data: [],
        totalItems: 0,
        totalPages: 0,
      });
    }

    // Bước 2: Tạo filter cho Promotion
    const promotionFilter = {
      _id: { $in: voucherPromotionIds },
      deleted: false,
    };
    if (req.query.status) {
      promotionFilter.status = req.query.status;
    }
    if (keyword) {
      promotionFilter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { code: { $regex: keyword, $options: "i" } },
      ];
    }

    // Bước 3: Aggregate để đếm số voucher đã phát hành và đã sử dụng
    const aggregateData = await CustomerVoucher.aggregate([
      { $match: { promotionId: { $in: voucherPromotionIds } } },
      {
        $group: {
          _id: "$promotionId",
          totalIssued: { $sum: 1 },
          totalUsed: { $sum: { $cond: ["$isUsed", 1, 0] } },
        },
      },
    ]);

    const statsMap = {};
    aggregateData.forEach((item) => {
      statsMap[item._id.toString()] = {
        totalIssued: item.totalIssued,
        totalUsed: item.totalUsed,
      };
    });

    // Bước 4: Lấy danh sách promotions với thông tin
    const [data, totalItems] = await Promise.all([
      Promotion.find(promotionFilter)
        .select("-customersUsed")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Promotion.countDocuments(promotionFilter),
    ]);

    // Bước 5: Gắn stats vào mỗi promotion
    const result = data.map((promo) => ({
      _id: promo._id,
      promotionId: promo,
      totalIssued: statsMap[promo._id.toString()]?.totalIssued || 0,
      totalUsed: statsMap[promo._id.toString()]?.totalUsed || 0,
    }));

    res.status(200).json({
      message: "Lấy danh sách voucher khách hàng thành công",
      data: result,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list customerVoucher", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [GET] /api/v1/admin/customer-vouchers/:promotionId
export const detail = async (req, res) => {
  try {
    const promotion = await Promotion.findOne({
      _id: req.params.promotionId,
      deleted: false,
    });

    if (!promotion) {
      return res.status(404).json({ message: "Voucher không tồn tại" });
    }

    // Đếm số voucher đã phát hành và đã sử dụng
    const [totalIssued, totalUsed] = await Promise.all([
      CustomerVoucher.countDocuments({ promotionId: promotion._id }),
      CustomerVoucher.countDocuments({
        promotionId: promotion._id,
        isUsed: true,
      }),
    ]);

    res.status(200).json({
      message: "Lấy chi tiết voucher khách hàng thành công",
      data: {
        promotionId: promotion,
        totalIssued,
        totalUsed,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi detail customerVoucher", error, {
      adminId: req.user?._id,
      promotionId: req.params?.promotionId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [POST] /api/v1/admin/customer-vouchers
// Tạo Promotion + Phát voucher cho danh sách khách hàng
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
      customerIds, // Mảng userId từ bảng users
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

    // Validate customerIds
    if (!customerIds || !Array.isArray(customerIds)) {
      return res
        .status(400)
        .json({ message: "Danh sách khách hàng không hợp lệ" });
    }

    if (customerIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng chọn ít nhất một khách hàng" });
    }

    // Tìm Customer bằng userId (customerIds là mảng userId)
    const existingCustomers = await Customer.find({
      userId: { $in: customerIds },
    }).select("_id userId");

    if (existingCustomers.length !== customerIds.length) {
      return res
        .status(404)
        .json({ message: "Một số khách hàng không tồn tại" });
    }

    // Tạo promotion
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

    // Tạo voucher cho từng khách hàng (dùng Customer._id, không phải userId)
    const voucherDocs = existingCustomers.map((customer) => ({
      promotionId: promotion._id,
      customerId: customer._id, // Dùng Customer._id
      isUsed: false,
    }));

    await CustomerVoucher.insertMany(voucherDocs);

    res.status(201).json({
      message: `Tạo voucher thành công và phát cho ${customerIds.length} khách hàng`,
      data: {
        promotionId: promotion,
        totalIssued: customerIds.length,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi create customerVoucher", error, {
      adminId: req.user?._id,
      code: req.body?.code,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [POST] /api/v1/admin/customer-vouchers/issue/:promotionId
// Phát thêm voucher cho khách hàng
export const issueVoucher = async (req, res) => {
  try {
    const { promotionId } = req.params;
    const { customerIds } = req.body; // Mảng userId từ bảng users

    if (
      !customerIds ||
      !Array.isArray(customerIds) ||
      customerIds.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Vui lòng chọn ít nhất một khách hàng" });
    }

    const existedPromotion = await Promotion.findOne({
      _id: promotionId,
      deleted: false,
    });
    if (!existedPromotion) {
      return res.status(404).json({ message: "Voucher không tồn tại" });
    }

    // Tìm Customer bằng userId (customerIds là mảng userId)
    const existingCustomers = await Customer.find({
      userId: { $in: customerIds },
    }).select("_id userId");

    if (existingCustomers.length !== customerIds.length) {
      return res
        .status(404)
        .json({ message: "Một số khách hàng không tồn tại" });
    }

    // Lấy danh sách Customer._id
    const customerObjectIds = existingCustomers.map((c) => c._id);

    // Kiểm tra voucher đã được phát chưa (tránh trùng) - dùng Customer._id
    const existingVouchers = await CustomerVoucher.find({
      promotionId,
      customerId: { $in: customerObjectIds },
    }).select("customerId");

    const alreadyIssuedIds = existingVouchers.map((v) =>
      v.customerId.toString(),
    );
    const newCustomerObjectIds = customerObjectIds.filter(
      (id) => !alreadyIssuedIds.includes(id.toString()),
    );

    if (newCustomerObjectIds.length === 0) {
      return res
        .status(409)
        .json({ message: "Tất cả khách hàng đã nhận voucher này rồi" });
    }

    // Tạo voucher cho khách hàng mới (dùng Customer._id)
    const voucherDocs = newCustomerObjectIds.map((customerId) => ({
      promotionId,
      customerId,
      isUsed: false,
    }));

    await CustomerVoucher.insertMany(voucherDocs);

    res.status(200).json({
      message: `Phát thêm voucher cho ${newCustomerObjectIds.length} khách hàng`,
      data: {
        issued: newCustomerObjectIds.length,
        skipped: customerIds.length - newCustomerObjectIds.length,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi issueVoucher", error, {
      adminId: req.user?._id,
      promotionId: req.params?.promotionId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
