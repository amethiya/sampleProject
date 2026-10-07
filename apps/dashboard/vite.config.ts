import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, proxy API + previews to `wrangler dev` (port 8787).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:8787", "/preview": "http://localhost:8787" } },
});
