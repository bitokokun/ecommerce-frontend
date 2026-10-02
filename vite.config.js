import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
      // local product images are served by Django at /media
      "/media": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
