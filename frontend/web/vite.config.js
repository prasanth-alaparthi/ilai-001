import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      "libsignal-protocol": path.resolve(process.cwd(), "node_modules/libsignal-protocol/dist/libsignal-protocol.js"),
    },
  },
  optimizeDeps: {
    include: ['long'], // Explicitly include 'long' for optimization
    exclude: ["libsignal-protocol"],
  },
  server: {
    proxy: {
      // Proxy requests starting with /api/auth to the authentication service
      '/api/auth': {
        target: 'http://localhost:8081', // Your muse-auth-service port
        changeOrigin: true,
      },
      '/api/users': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      // Proxy requests starting with /api/notebooks to the notes service
      '/api/notebooks': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      // Proxy requests starting with /api/ai to the notes service
      '/api/ai': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      // Proxy requests starting with /api/sections to the notes service
      '/api/sections': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      // Proxy requests starting with /api/notes to the notes service
      '/api/notes': {
        target: 'http://localhost:8082', // Your muse_notes_service port
        changeOrigin: true,
      },
      // Proxy requests starting with /api/parental to the parental service
      '/api/parental': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      // Proxy requests starting with /api/parents to the auth service
      '/api/parents': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      // Proxy requests starting with /api/academic to the academic service
      '/api/academic': {
        target: 'http://localhost:8087',
        changeOrigin: true,
      },
      // Proxy WebSocket requests to the academic service
      '/ws-academic': {
        target: 'http://localhost:8087',
        ws: true,
        changeOrigin: true,
      },
      // Proxy requests starting with /api/journal to the journal service
      '/api/journal': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/api/journals': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/api/templates': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      // Proxy requests starting with /api/chat to the chat service
      '/api/chat': {
        target: 'http://localhost:8086',
        changeOrigin: true,
      },
      // Proxy WebSocket requests to the chat service
      '/ws-chat': {
        target: 'http://localhost:8086',
        ws: true,
        changeOrigin: true,
      },
      // Proxy requests starting with /api/feed to the feed service
      '/api/feed': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      // Proxy requests starting with /api/calendar to the calendar service
      '/api/calendar': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      // Proxy all other /api requests to the main backend service
      '/api': {
        target: 'http://localhost:8080', // Your muse-backend port
        changeOrigin: true,
      },
    },
  },
});