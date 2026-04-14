import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2023',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes("@azure/msal")) return "vendor-msal";
          if (id.includes("@microsoft/microsoft-graph")) return "vendor-graph";
          if (id.includes("@tanstack/react-query")) return "vendor-query";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (
            id.includes("react-dom") ||
            id.includes("react-router") ||
            (id.includes("node_modules/react/") && !id.includes("react-dom"))
          ) {
            return "vendor-react";
          }
          return undefined;
        },
      },
    },
  },
})
