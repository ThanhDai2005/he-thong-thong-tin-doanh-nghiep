import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import type { SocketState } from "@/types/store";

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: (token?, guestInfo?) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected) {
      console.log("[Socket] Already connected");
      return;
    }

    let socket: Socket;

    if (token) {
      // User đã đăng nhập
      socket = io(baseURL, {
        auth: { token },
        transports: ["websocket", "polling"],
      });
    } else if (guestInfo) {
      // Guest chưa đăng nhập
      socket = io(baseURL, {
        query: {
          guestName: guestInfo.name,
          guestPhone: guestInfo.phone,
        },
        transports: ["websocket", "polling"],
      });
    } else {
      console.error("[Socket] Missing token or guestInfo");
      return;
    }

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
      set({ isConnected: true });
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
      set({ isConnected: false });
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error.message);
      set({ isConnected: false });
    });

    set({ socket, isConnected: socket.connected });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
      console.log("[Socket] Disconnected manually");
    }
  },

  emit: (event, data?) => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.emit(event, data);
    } else {
      console.warn("[Socket] Cannot emit, socket not connected");
    }
  },

  on: (event, handler) => {
    const socket = get().socket;
    if (socket) {
      socket.on(event, handler);
    }
  },

  off: (event, handler?) => {
    const socket = get().socket;
    if (socket) {
      socket.off(event, handler);
    }
  },
}));
