import StockReceipt from "../../../../models/stockReceipt.model.js";
import Product from "../../../../models/product.model.js";
import Supplier from "../../../../models/supplier.model.js";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/stock-receipt
export const list = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const status = req.query.status || "";
    const supplierId = req.query.supplierId || "";
    const startDate = req.query.startDate || "";
    const endDate = req.query.endDate || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (status && ["pending", "completed", "cancelled"].includes(status)) {
      filter.status = status;
    }

    if (supplierId) {
      filter.supplierId = supplierId;
    }

    if (keyword) {
      const sanitized = String(keyword)
        .normalize("NFC")
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$expr = {
        $regexMatch: {
          input: { $toString: "$_id" },
          regex: sanitized,
          options: "i",
        },
      };
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [data, total] = await Promise.all([
      StockReceipt.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("supplierId", "name phone email")
        .populate({
          path: "createdBy",
          select: "userId",
          populate: {
            path: "userId",
            select: "displayName",
          },
        })
        .lean(),
      StockReceipt.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Lấy danh sách phiếu nhập thành công",
      data,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list stockReceipt", error, {
      adminId: req.user?._id,
      query: req.query,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [GET] /api/v1/admin/stock-receipt/:receiptId
export const detail = async (req, res) => {
  try {
    const { receiptId } = req.params;

    if (!receiptId) {
      return res.status(400).json({ message: "ID phiếu nhập không hợp lệ" });
    }

    const receipt = await StockReceipt.findOne({ _id: receiptId })
      .populate("supplierId", "name phone email address taxCode")
      .populate({
        path: "createdBy",
        select: "userId",
        populate: {
          path: "userId",
          select: "displayName",
        },
      })
      .populate("items.productId", "name images price stock")
      .lean();

    if (!receipt) {
      return res.status(404).json({ message: "Phiếu nhập không tồn tại" });
    }

    res.status(200).json({
      message: "Lấy chi tiết phiếu nhập thành công",
      data: receipt,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi detail stockReceipt", error, {
      adminId: req.user?._id,
      receiptId: req.params?.receiptId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [POST] /api/v1/admin/stock-receipt
export const create = async (req, res) => {
  try {
    const { supplierId, items } = req.body;

    if (!supplierId) {
      return res.status(400).json({ message: "Vui lòng chọn nhà cung cấp" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng thêm ít nhất một sản phẩm" });
    }

    for (const item of items) {
      const product = await Product.findOne({
        _id: item.productId,
        status: "active",
        deleted: false,
      });
      if (!product) {
        return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
      }
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({ message: "Số lượng phải lớn hơn 0" });
      }
    }

    const supplier = await Supplier.findOne({
      _id: supplierId,
      deleted: false,
      status: "active",
    }).lean();

    if (!supplier) {
      return res
        .status(404)
        .json({ message: "Nhà cung cấp không tồn tại hoặc không hoạt động" });
    }

    // Tính totalAmount
    const totalAmount = items.reduce(
      (sum, i) => sum + i.quantity * i.importPrice,
      0,
    );

    const receipt = await StockReceipt.create({
      supplierId,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        importPrice: Number(i.importPrice),
      })),
      totalAmount,
      status: "pending",
      createdBy: req.staffId,
    });

    const populated = await StockReceipt.findOne({ _id: receipt._id })
      .populate("supplierId", "name phone email")
      .populate({
        path: "createdBy",
        select: "userId",
        populate: {
          path: "userId",
          select: "displayName",
        },
      })
      .populate("items.productId", "name images price stock")
      .lean();

    res.status(201).json({
      message: "Tạo phiếu nhập thành công",
      data: populated,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi create stockReceipt", error, {
      adminId: req.user?._id,
      supplierId: req.body?.supplierId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [PATCH] /api/v1/admin/stock-receipt/confirm/:receiptId
export const confirm = async (req, res) => {
  try {
    const { receiptId } = req.params;

    if (!receiptId) {
      return res.status(400).json({ message: "ID phiếu nhập không hợp lệ" });
    }

    const receipt = await StockReceipt.findOne({ _id: receiptId });

    if (!receipt) {
      return res.status(404).json({ message: "Phiếu nhập không tồn tại" });
    }

    if (receipt.status !== "pending") {
      return res.status(409).json({
        message: `Không thể xác nhận phiếu đang ở trạng thái "${receipt.status}"`,
      });
    }

    for (const item of receipt.items) {
      await Product.findOneAndUpdate(
        { _id: item.productId, status: "active", deleted: false },
        { $inc: { stock: item.quantity } },
        { new: true },
      );
    }

    receipt.status = "completed";
    await receipt.save();

    const populated = await StockReceipt.findOne({ _id: receipt._id })
      .populate("supplierId", "name phone email")
      .populate({
        path: "createdBy",
        select: "userId",
        populate: {
          path: "userId",
          select: "displayName",
        },
      })
      .populate("items.productId", "name images price stock")
      .lean();

    res.status(200).json({
      message: "Xác nhận phiếu nhập thành công. Kho đã được cập nhật.",
      data: populated,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi confirm stockReceipt", error, {
      adminId: req.user?._id,
      receiptId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// [PATCH] /api/v1/admin/stock-receipt/cancel/:receiptId
export const cancel = async (req, res) => {
  try {
    const { receiptId } = req.params;

    if (!receiptId) {
      return res.status(400).json({ message: "ID phiếu nhập không hợp lệ" });
    }

    const receipt = await StockReceipt.findOne({ _id: receiptId });

    if (!receipt) {
      return res.status(404).json({ message: "Phiếu nhập không tồn tại" });
    }

    if (receipt.status !== "pending") {
      return res.status(409).json({
        message: `Không thể hủy phiếu đang ở trạng thái "${receipt.status}"`,
      });
    }

    receipt.status = "cancelled";
    await receipt.save();

    res.status(200).json({
      message: "Hủy phiếu nhập thành công",
      data: receipt,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi cancel stockReceipt", error, {
      adminId: req.user?._id,
      receiptId: req.params?.receiptId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
