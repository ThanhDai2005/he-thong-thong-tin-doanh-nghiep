import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import type { AdminSocketState } from "@/types/store";

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useAdminSocketStore = create<AdminSocketState>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: (token) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected) {
      console.log("[Admin Socket] Already connected");
      return;
    }

    const socket: Socket = io(`${baseURL}/admin`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[Admin Socket] Connected:", socket.id);
      set({ isConnected: true });
    });

    socket.on("disconnect", (reason) => {
      console.log("[Admin Socket] Disconnected:", reason);
      set({ isConnected: false });
    });

    socket.on("connect_error", (error) => {
      console.error("[Admin Socket] Connection error:", error.message);
      set({ isConnected: false });
    });

    set({ socket, isConnected: socket.connected });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
      console.log("[Admin Socket] Disconnected manually");
    }
  },

  emit: (event, data?) => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.emit(event, data);
    } else {
      console.warn("[Admin Socket] Cannot emit, socket not connected");
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
