import net from "node:net";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const LOCAL_API = "http://127.0.0.1:8000";
const LIVE_API = "https://ecommerce-backend-quog.onrender.com";

function localBackendUp() {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port: 8000 });
    const finish = (up) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(up);
    };
    socket.setTimeout(400);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

export default defineConfig(async () => {
  // Use a Django server on port 8000 when it is running. Otherwise use the
  // public Souk API so the storefront still loads.
  const target = (await localBackendUp()) ? LOCAL_API : LIVE_API;
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": { target, changeOrigin: true },
        "/media": { target, changeOrigin: true },
      },
    },
  };
});
