import { Server } from "socket.io";
import {
  adminSocketAuth,
  clientSocketAuth,
} from "../middlewares/socket.middleware.js";
import { handleClientChat, handleAdminChat } from "./chat.handler.js";
import logger from "../config/logger.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  // 1. Phân luồng cho Admin Namespace (/admin)
  const adminNamespace = io.of("/admin");
  adminNamespace.use(adminSocketAuth);
  adminNamespace.on("connection", (socket) => {
    const user = socket.user;
    logger.logInfo(`[ADMIN] ${user.displayName} online: ${socket.id}`, {
      adminId: user._id?.toString(),
      socketId: socket.id,
    });

    // Xử lý chat admin
    handleAdminChat(io, socket);

    socket.on("disconnect", () => {
      logger.logInfo(`[ADMIN] ${user.displayName} disconnected`, {
        adminId: user._id?.toString(),
        socketId: socket.id,
      });
    });
  });

  // 2. Phân luồng cho Client Namespace (Mặc định /)
  const clientNamespace = io.of("/");
  clientNamespace.use(clientSocketAuth);
  clientNamespace.on("connection", (socket) => {
    const user = socket.user;
    const isGuest = socket.isGuest ? "(Khách vãng lai)" : "(Thành viên)";
    logger.logInfo(
      `[CLIENT] ${user.displayName} ${isGuest} online: ${socket.id}`,
      {
        userId: user._id?.toString(),
        socketId: socket.id,
        role: isGuest,
      },
    );

    // Xử lý chat client
    handleClientChat(io, socket);

    socket.on("disconnect", () => {
      logger.logInfo(`[CLIENT] ${user.displayName} disconnected`, {
        userId: user._id?.toString(),
        socketId: socket.id,
      });
    });
  });

  return io;
};

export { io };
