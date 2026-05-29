import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "react-flow": ["@xyflow/react"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
