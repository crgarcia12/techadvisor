import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base path is baked into the build so that, behind Liliput's path-stripping
// proxy, the browser requests correctly-prefixed asset/API/socket URLs. The
// proxy strips the prefix before the request reaches the server. For local dev
// it defaults to "/".
const base = process.env.PUBLIC_BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
      "/socket.io": { target: "http://localhost:3000", ws: true },
    },
  },
});
