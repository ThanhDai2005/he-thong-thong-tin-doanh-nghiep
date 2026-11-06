import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Customer from "../models/customer.model.js";
import Staff from "../models/staff.model.js";
import StockReceipt from "../models/stockReceipt.model.js";

// [5b] Tính doanh thu theo Tháng trong năm hiện tại
export const calculateRevenueByMonth = async (year) => {
  const result = [];

  for (let month = 1; month <= 12; month++) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const orders = await Order.find({
      paymentStatus: "Paid",
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    // Tính tổng chi từ phiếu nhập hàng (StockReceipt) đã hoàn thành
    const stockReceipts = await StockReceipt.find({
      status: "completed",
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    const totalCost = stockReceipts.reduce(
      (sum, receipt) => sum + receipt.totalAmount,
      0,
    );

    const profit = totalRevenue - totalCost;

    result.push({
      month: `T${month}`,
      revenue: totalRevenue,
      cost: totalCost,
      profit: profit,
    });
  }

  return result;
};

// [5b] Tính doanh thu theo Quý trong năm hiện tại
export const calculateRevenueByQuarter = async (year) => {
  const quarters = [
    { label: "Q1", months: [0, 1, 2] },
    { label: "Q2", months: [3, 4, 5] },
    { label: "Q3", months: [6, 7, 8] },
    { label: "Q4", months: [9, 10, 11] },
  ];

  const result = [];

  for (const quarter of quarters) {
    const startOfQuarter = new Date(year, quarter.months[0], 1);
    const endOfQuarter = new Date(
      year,
      quarter.months[2] + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const orders = await Order.find({
      paymentStatus: "Paid",
      createdAt: {
        $gte: startOfQuarter,
        $lte: endOfQuarter,
      },
    });

    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    // Tính tổng chi từ phiếu nhập hàng (StockReceipt) đã hoàn thành
    const stockReceipts = await StockReceipt.find({
      status: "completed",
      createdAt: {
        $gte: startOfQuarter,
        $lte: endOfQuarter,
      },
    });

    const totalCost = stockReceipts.reduce(
      (sum, receipt) => sum + receipt.totalAmount,
      0,
    );

    const profit = totalRevenue - totalCost;

    result.push({
      quarter: quarter.label,
      revenue: totalRevenue,
      cost: totalCost,
      profit: profit,
    });
  }

  return result;
};

// [5b] Tính doanh thu theo Năm (2024, 2025, 2026)
export const calculateRevenueByYear = async () => {
  const years = [2024, 2025, 2026];
  const result = [];

  for (const year of years) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const orders = await Order.find({
      paymentStatus: "Paid",
      createdAt: {
        $gte: startOfYear,
        $lte: endOfYear,
      },
    });

    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    // Tính tổng chi từ phiếu nhập hàng (StockReceipt) đã hoàn thành
    const stockReceipts = await StockReceipt.find({
      status: "completed",
      createdAt: {
        $gte: startOfYear,
        $lte: endOfYear,
      },
    });

    const totalCost = stockReceipts.reduce(
      (sum, receipt) => sum + receipt.totalAmount,
      0,
    );

    const profit = totalRevenue - totalCost;

    result.push({
      year: year.toString(),
      revenue: totalRevenue,
      cost: totalCost,
      profit: profit,
    });
  }

  return result;
};

// [5c] Doanh thu theo Nhân viên (Staff) - 3 năm gần nhất
export const calculateRevenueByStaff = async () => {
  const years = [2024, 2025, 2026];
  const staffList = await Staff.find({})
    .populate({
      path: "userId",
      select: "displayName",
    })
    .lean();

  const result = [];

  for (const staff of staffList) {
    const staffData = {
      staffId: staff._id.toString(),
      staffName: staff.userId?.displayName || "Nhân viên",
      years: {},
    };

    for (const year of years) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      const orders = await Order.find({
        updatedBy: staff._id,
        paymentStatus: "Paid",
        createdAt: {
          $gte: startOfYear,
          $lte: endOfYear,
        },
      });

      const totalRevenue = orders.reduce(
        (sum, order) => sum + order.totalAmount,
        0,
      );

      staffData.years[year] = totalRevenue;
    }

    result.push(staffData);
  }

  return result;
};

// [5d] Tính % đơn hàng theo trạng thái
export const calculateOrderStatusPercentage = (orderStatusData) => {
  const total =
    orderStatusData.pending +
    orderStatusData.processing +
    orderStatusData.shipped +
    orderStatusData.delivered +
    orderStatusData.cancelled;

  if (total === 0) {
    return {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
  }

  return {
    pending: ((orderStatusData.pending / total) * 100).toFixed(2),
    processing: ((orderStatusData.processing / total) * 100).toFixed(2),
    shipped: ((orderStatusData.shipped / total) * 100).toFixed(2),
    delivered: ((orderStatusData.delivered / total) * 100).toFixed(2),
    cancelled: ((orderStatusData.cancelled / total) * 100).toFixed(2),
  };
};

// [5e] Doanh thu theo Sản phẩm theo Quý (Top 5 sản phẩm)
export const calculateRevenueByProductQuarter = async (year) => {
  const quarters = [
    { label: "Q1", months: [0, 1, 2] },
    { label: "Q2", months: [3, 4, 5] },
    { label: "Q3", months: [6, 7, 8] },
    { label: "Q4", months: [9, 10, 11] },
  ];

  // Lấy top 5 sản phẩm bán chạy nhất
  const topProductsAgg = await Order.aggregate([
    { $match: { orderStatus: { $in: ["Delivered"] } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        totalSold: { $sum: "$items.quantity" },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
  ]);

  const topProductIds = topProductsAgg.map((item) => item._id);
  const productsDetails = await Product.find({ _id: { $in: topProductIds } })
    .select("name")
    .lean();

  const productMap = {};
  productsDetails.forEach((product) => {
    productMap[product._id.toString()] = product.name;
  });

  const result = [];

  for (const product of topProductsAgg) {
    const productData = {
      productId: product._id.toString(),
      productName:
        productMap[product._id.toString()] || "Sản phẩm không xác định",
      quarters: {},
    };

    for (const quarter of quarters) {
      const startOfQuarter = new Date(year, quarter.months[0], 1);
      const endOfQuarter = new Date(
        year,
        quarter.months[2] + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const orders = await Order.aggregate([
        {
          $match: {
            orderStatus: "Delivered",
            createdAt: {
              $gte: startOfQuarter,
              $lte: endOfQuarter,
            },
          },
        },
        { $unwind: "$items" },
        {
          $match: {
            "items.productId": product._id,
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: { $multiply: ["$items.quantity", "$items.price"] },
            },
          },
        },
      ]);

      const revenue = orders.length > 0 ? orders[0].totalRevenue : 0;
      productData.quarters[quarter.label] = revenue;
    }

    result.push(productData);
  }

  return result;
};

// [5d] Doanh thu theo Khách hàng theo Năm
export const calculateRevenueByCustomerYear = async () => {
  const years = [2024, 2025, 2026];

  // Lấy top 10 khách hàng có tổng chi tiêu cao nhất (chỉ đơn đã giao)
  const topCustomersAgg = await Order.aggregate([
    {
      $match: {
        orderStatus: "Delivered",
        paymentStatus: "Paid",
      },
    },
    {
      $group: {
        _id: "$customerId",
        totalSpent: { $sum: "$totalAmount" },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 },
  ]);

  const topCustomerIds = topCustomersAgg.map((item) => item._id);
  const customersDetails = await Customer.find({
    _id: { $in: topCustomerIds },
  })
    .populate("userId", "displayName")
    .select("userId")
    .lean();

  const customerMap = {};
  customersDetails.forEach((customer) => {
    customerMap[customer._id.toString()] =
      customer.userId?.displayName || "Khách hàng";
  });

  const result = [];

  for (const customer of topCustomersAgg) {
    const customerData = {
      customerId: customer._id.toString(),
      customerName:
        customerMap[customer._id.toString()] || "Khách hàng không xác định",
      years: {},
    };

    for (const year of years) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      const orders = await Order.find({
        customerId: customer._id,
        orderStatus: "Delivered",
        paymentStatus: "Paid",
        createdAt: {
          $gte: startOfYear,
          $lte: endOfYear,
        },
      });

      const totalRevenue = orders.reduce(
        (sum, order) => sum + order.totalAmount,
        0,
      );

      customerData.years[year] = totalRevenue;
    }

    result.push(customerData);
  }

  return result;
};

// [5d] Doanh thu theo Khách hàng theo Quý
export const calculateRevenueByCustomerQuarter = async (year) => {
  const quarters = [
    { label: "Q1", months: [0, 1, 2] },
    { label: "Q2", months: [3, 4, 5] },
    { label: "Q3", months: [6, 7, 8] },
    { label: "Q4", months: [9, 10, 11] },
  ];

  // Lấy top 10 khách hàng có tổng chi tiêu cao nhất trong năm (chỉ đơn đã giao)
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

  const topCustomersAgg = await Order.aggregate([
    {
      $match: {
        orderStatus: "Delivered",
        paymentStatus: "Paid",
        createdAt: {
          $gte: startOfYear,
          $lte: endOfYear,
        },
      },
    },
    {
      $group: {
        _id: "$customerId",
        totalSpent: { $sum: "$totalAmount" },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 },
  ]);

  const topCustomerIds = topCustomersAgg.map((item) => item._id);
  const customersDetails = await Customer.find({
    _id: { $in: topCustomerIds },
  })
    .populate("userId", "displayName")
    .select("userId")
    .lean();

  const customerMap = {};
  customersDetails.forEach((customer) => {
    customerMap[customer._id.toString()] =
      customer.userId?.displayName || "Khách hàng";
  });

  const result = [];

  for (const customer of topCustomersAgg) {
    const customerData = {
      customerId: customer._id.toString(),
      customerName:
        customerMap[customer._id.toString()] || "Khách hàng không xác định",
      quarters: {},
    };

    for (const quarter of quarters) {
      const startOfQuarter = new Date(year, quarter.months[0], 1);
      const endOfQuarter = new Date(
        year,
        quarter.months[2] + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const orders = await Order.find({
        customerId: customer._id,
        orderStatus: "Delivered",
        paymentStatus: "Paid",
        createdAt: {
          $gte: startOfQuarter,
          $lte: endOfQuarter,
        },
      });

      const totalRevenue = orders.reduce(
        (sum, order) => sum + order.totalAmount,
        0,
      );

      customerData.quarters[quarter.label] = totalRevenue;
    }

    result.push(customerData);
  }

  return result;
};
