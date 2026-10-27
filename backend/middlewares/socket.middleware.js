import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Customer from "../models/customer.model.js";
import Staff from "../models/staff.model.js";

// Verify token cho CLIENT (User + Customer)
const verifyTokenClient = async (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findOne({
      _id: decoded.userId,
      status: "active",
      deleted: false,
    })
      .select("-hashedPassword")
      .lean();

    if (!user) return null;

    // Tìm customer tương ứng (User là customer)
    const customer = await Customer.findOne({ userId: user._id }).lean();

    return customer ? { ...user, customerId: customer._id } : null;
  } catch (error) {
    return null;
  }
};

// Verify token cho ADMIN (User + Staff + Role)
const verifyTokenAdmin = async (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findOne({
      _id: decoded.userId,
      status: "active",
      deleted: false,
    })
      .select("-hashedPassword")
      .lean();

    if (!user) return null;

    // Tìm staff và populate roleId để lấy permissions
    const staff = await Staff.findOne({ userId: user._id })
      .populate("roleId")
      .lean();

    if (!staff) return null;

    return { ...user, staffId: staff._id, roleId: staff.roleId };
  } catch (error) {
    return null;
  }
};

// 1. MIDDLEWARE CHO CLIENT NAMESPACE (/)
export const clientSocketAuth = async (socket, next) => {
  const user = await verifyTokenClient(socket);

  if (user) {
    socket.user = user;
    socket.isGuest = false;
    return next();
  }

  const { guestName, guestPhone } = socket.handshake.query || {};

  if (!guestName || !guestPhone) {
    return next(
      new Error("Vui lòng nhập đầy đủ Tên và Số điện thoại trước khi chat"),
    );
  }

  socket.user = { displayName: guestName, phone: guestPhone };
  socket.isGuest = true;
  next();
};

// 2. MIDDLEWARE CHO ADMIN NAMESPACE (/admin)
export const adminSocketAuth = async (socket, next) => {
  const user = await verifyTokenAdmin(socket);

  if (!user) {
    return next(new Error("Unauthorized - Token không hợp lệ hoặc đã hết hạn"));
  }

  const permissions = user.roleId?.permissions || [];
  if (!permissions.includes("chats_view")) {
    return next(new Error("Forbidden - Không có quyền truy cập quản lý chat"));
  }

  socket.user = user;
  next();
};
