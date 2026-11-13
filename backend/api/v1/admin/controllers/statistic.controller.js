import Customer from "../../../../models/customer.model.js";
import Order from "../../../../models/order.model.js";
import Product from "../../../../models/product.model.js";
import logger from "../../../../config/logger.js";
import {
  calculateRevenueByMonth,
  calculateRevenueByQuarter,
  calculateRevenueByYear,
  calculateRevenueByStaff,
  calculateRevenueByProductQuarter,
  calculateRevenueByCustomerYear,
  calculateRevenueByCustomerQuarter,
} from "../../../../helpers/dashboard.helper.js";

// [GET] /api/v1/admin/statistic
export const statistic = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // 1. Thống kê Thu/Chi/Lợi nhuận theo Tháng/Quý/Năm
    const revenueByMonth = await calculateRevenueByMonth(currentYear);
    const revenueByQuarter = await calculateRevenueByQuarter(currentYear);
    const revenueByYear = await calculateRevenueByYear();

    // 2. Doanh thu theo Nhân viên
    const revenueByStaff = await calculateRevenueByStaff();

    // 3. Doanh thu theo Sản phẩm theo Quý
    const revenueByProductQuarter =
      await calculateRevenueByProductQuarter(currentYear);

    // 4. Doanh thu theo Khách hàng (Year/Quarter)
    const revenueByCustomerYear = await calculateRevenueByCustomerYear();
    const customerQuarterYear = req.query.customerYear
      ? parseInt(req.query.customerYear)
      : currentYear;
    const revenueByCustomerQuarter =
      await calculateRevenueByCustomerQuarter(customerQuarterYear);

    res.status(200).json({
      message: "Lấy thống kê thành công",
      data: {
        revenueByMonth,
        revenueByQuarter,
        revenueByYear,
        revenueByStaff,
        revenueByProductQuarter,
        revenueByCustomerYear,
        revenueByCustomerQuarter,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi statistic", error, {
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

// [GET] /api/v1/admin/statistic/customer-report
export const report = async (req, res) => {
  try {
    // Lấy tất cả customers với user info
    const customers = await Customer.find({})
      .populate({
        path: "userId",
        match: { deleted: false },
        select: "displayName email phone status createdAt",
      })
      .lean();

    // Lọc những customer có userId hợp lệ
    const validCustomers = customers.filter((c) => c.userId);

    const totalCustomers = validCustomers.length;

    // 1. Thống kê trạng thái
    const activeCount = validCustomers.filter(
      (c) => c.userId.status === "active",
    ).length;
    const inactiveCount = validCustomers.filter(
      (c) => c.userId.status === "inactive",
    ).length;

    // 2. Thống kê độ tuổi (từ birthday)
    const currentYear = new Date().getFullYear();
    const ageGroups = {
      "Dưới 18": 0,
      "18-25": 0,
      "26-35": 0,
      "36-45": 0,
      "46-55": 0,
      "Trên 55": 0,
      "Không rõ": 0,
    };

    validCustomers.forEach((customer) => {
      if (customer.birthday) {
        const birthYear = new Date(customer.birthday).getFullYear();
        const age = currentYear - birthYear;

        if (age < 18) ageGroups["Dưới 18"]++;
        else if (age >= 18 && age <= 25) ageGroups["18-25"]++;
        else if (age >= 26 && age <= 35) ageGroups["26-35"]++;
        else if (age >= 36 && age <= 45) ageGroups["36-45"]++;
        else if (age >= 46 && age <= 55) ageGroups["46-55"]++;
        else if (age > 55) ageGroups["Trên 55"]++;
      } else {
        ageGroups["Không rõ"]++;
      }
    });

    // 3. Thống kê theo tháng đăng ký (6 tháng gần nhất)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRegistrations = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
      monthlyRegistrations[monthKey] = 0;
    }

    validCustomers.forEach((customer) => {
      const createdAt = new Date(customer.userId.createdAt);
      if (createdAt >= sixMonthsAgo) {
        const monthKey = `${createdAt.getMonth() + 1}/${createdAt.getFullYear()}`;
        if (monthlyRegistrations[monthKey] !== undefined) {
          monthlyRegistrations[monthKey]++;
        }
      }
    });

    // 4. Thống kê đơn hàng và sở thích sản phẩm
    const customerIds = validCustomers.map((c) => c._id);

    // Lấy chỉ đơn hàng đã hoàn thành (Delivered)
    const orders = await Order.find({
      customerId: { $in: customerIds },
      orderStatus: "Delivered",
    })
      .select("customerId items totalAmount createdAt")
      .lean();

    // Thống kê tổng số đơn hàng, tổng doanh thu từ khách hàng
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    // Thống kê sản phẩm được mua nhiều nhất (top 10)
    const productCounts = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.productId.toString();
        if (!productCounts[productId]) {
          productCounts[productId] = { count: 0, quantity: 0 };
        }
        productCounts[productId].count++;
        productCounts[productId].quantity += item.quantity;
      });
    });

    const sortedProducts = Object.entries(productCounts)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 10);

    const topProductIds = sortedProducts.map(([id]) => id);
    const products = await Product.find({ _id: { $in: topProductIds } })
      .select("name images categoryId")
      .populate("categoryId", "name")
      .lean();

    const productMap = {};
    products.forEach((p) => {
      productMap[p._id.toString()] = p;
    });

    const topProducts = sortedProducts.map(([productId, data]) => {
      const product = productMap[productId];
      return {
        productId,
        name: product?.name || "Sản phẩm không tồn tại",
        thumbnail: product?.images?.[0] || "",
        category: product?.categoryId?.name || "N/A",
        orderCount: data.count,
        totalQuantity: data.quantity,
      };
    });

    // 5. Khách hàng mới trong 30 ngày
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newCustomersCount = validCustomers.filter((c) => {
      return new Date(c.userId.createdAt) >= thirtyDaysAgo;
    }).length;

    res.status(200).json({
      message: "Lấy báo cáo khách hàng thành công",
      data: {
        summary: {
          totalCustomers,
          activeCount,
          inactiveCount,
          newCustomersLast30Days: newCustomersCount,
          totalOrders,
          totalRevenue,
        },
        ageDistribution: ageGroups,
        monthlyRegistrations,
        topProducts,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi report customer", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
