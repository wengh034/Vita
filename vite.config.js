import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],

  base: "/Vita/",

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },

    host: "0.0.0.0",

    port: 5173,

    allowedHosts: [
      "qty-horn-diy-percent.trycloudflare.com",
      "microwave-logs-hands-beef.trycloudflare.com",
    ],
  },
});