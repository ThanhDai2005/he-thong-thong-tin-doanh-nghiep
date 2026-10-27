import Customer from "../../../../models/customer.model.js";
import Product from "../../../../models/product.model.js";
import Order from "../../../../models/order.model.js";
import Category from "../../../../models/category.model.js";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/dashboard
export const dashboard = async (req, res) => {
  try {
    // 1. Thống kê tổng quan (4 cards trên cùng)
    const [totalCustomers, totalProducts, totalOrders, totalCategories] =
      await Promise.all([
        Customer.countDocuments({}),
        Product.countDocuments({ deleted: false, status: "active" }),
        Order.countDocuments({}),
        Category.countDocuments({ deleted: false, status: "active" }),
      ]);

    // 2. Thống kê hóa đơn theo trạng thái (biểu đồ tròn)
    // Lấy tham số tháng từ query (month=1 đến 12)
    const { month } = req.query;

    let orderStatusQuery = {};

    if (month && month !== "all") {
      const monthNum = parseInt(month);
      const currentYear = new Date().getFullYear();
      const startOfMonth = new Date(currentYear, monthNum - 1, 1);
      const endOfMonth = new Date(currentYear, monthNum, 0, 23, 59, 59, 999);

      orderStatusQuery = {
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      };
    }

    const [
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      Order.countDocuments({ orderStatus: "Pending", ...orderStatusQuery }),
      Order.countDocuments({ orderStatus: "Processing", ...orderStatusQuery }),
      Order.countDocuments({ orderStatus: "Shipped", ...orderStatusQuery }),
      Order.countDocuments({ orderStatus: "Delivered", ...orderStatusQuery }),
      Order.countDocuments({ orderStatus: "Cancelled", ...orderStatusQuery }),
    ]);

    const orderStatusData = {
      pending: pendingOrders,
      processing: processingOrders,
      shipped: shippedOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders,
    };

    // 3. Thống kê doanh thu theo khoảng thời gian (filter)
    const { startDate, endDate } = req.query;

    let revenueStats = {
      totalRevenue: 0,
      totalOrders: 0,
    };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const orders = await Order.find({
        paymentStatus: "Paid",
        createdAt: {
          $gte: start,
          $lte: end,
        },
      });

      const totalRevenue = orders.reduce(
        (total, item) => total + item.totalAmount,
        0,
      );

      revenueStats = {
        totalRevenue: totalRevenue,
        totalOrders: orders.length,
      };
    }

    // 4. Thống kê doanh thu theo tháng (12 tháng trong năm hiện tại - line chart)
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = [];

    for (let month = 1; month <= 12; month++) {
      const startOfMonth = new Date(currentYear, month - 1, 1);
      const endOfMonth = new Date(currentYear, month, 0, 23, 59, 59, 999);

      const orders = await Order.find({
        paymentStatus: "Paid",
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      });

      const revenue = orders.reduce(
        (total, item) => total + item.totalAmount,
        0,
      );

      monthlyRevenue.push({
        month: `Tháng ${month}`,
        revenue: revenue,
      });
    }

    // 5. Đơn hàng mới nhất (Recent Orders) - Lấy 4 đơn gần nhất
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(4)
      .populate({
        path: "customerId",
        select: "userId",
        populate: {
          path: "userId",
          select: "displayName",
        },
      })
      .select("_id totalAmount orderStatus createdAt customerId")
      .lean();

    // 6. Top 3 sản phẩm bán chạy nhất (Top Products) - Query thông thường
    const formattedRecentOrders = recentOrders.map((order) => ({
      ...order,
      customerName: order.customerId?.userId?.displayName || "Khách",
    }));

    // 6. Top 3 sản phẩm bán chạy nhất
    const topProductsAggregation = await Order.aggregate([
      { $match: { orderStatus: { $in: ["Delivered"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.quantity", "$items.price"] },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 3 },
    ]);

    const topProductIds = topProductsAggregation.map((item) => item._id);
    const productsDetails = await Product.find({ _id: { $in: topProductIds } })
      .select("name")
      .lean();

    const productMap = {};
    productsDetails.forEach((product) => {
      productMap[product._id.toString()] = product.name;
    });

    const topProducts = topProductsAggregation.map((item) => ({
      name: productMap[item._id.toString()] || "Sản phẩm không xác định",
      sold: item.totalSold,
      revenue: item.totalRevenue,
    }));

    res.status(200).json({
      message: "Lấy thống kê dashboard thành công",
      data: {
        overview: {
          totalCustomers,
          totalProducts,
          totalOrders,
          totalCategories,
        },
        orderStatus: orderStatusData,
        revenueByDateRange: revenueStats,
        monthlyRevenue: monthlyRevenue,
        recentOrders: formattedRecentOrders,
        topProducts: topProducts,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi dashboard", error, {
      adminId: req.user?._id,
      roleId: req.user?.roleId,
      query: req.query,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
