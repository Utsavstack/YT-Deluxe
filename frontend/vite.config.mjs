import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tagger from "@dhiwise/component-tagger";
import { readFileSync } from 'fs';

// Read version from package.json at build time
const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'));

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  define: {
    // Exposes package.json version to the app as import.meta.env.VITE_APP_VERSION
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
  },
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 2000,
  },
  plugins: [tsconfigPaths(), react(), tagger()],
  server: {
    port: 5848,
    host: "0.0.0.0",
    strictPort: false,
    allowedHosts: ['.amazonaws.com', '.vercel.app', '.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
});