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
  build: {
    // Increase chunk size warning limit (we'll optimize properly)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and smaller initial load
        manualChunks: {
          // React core - rarely changes
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI libraries
          'ui-vendor': ['framer-motion', 'lucide-react', '@headlessui/react'],
          // Rich text editor (large, lazy load recommended)
          'editor': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-link',
            '@tiptap/extension-image',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-highlight',
            '@tiptap/extension-underline',
          ],
          // Charts library
          'charts': ['recharts'],
          // Calendar library
          'calendar': ['react-big-calendar', 'date-fns'],
          // Data fetching
          'data': ['axios', '@tanstack/react-query'],
          // State management
          'state': ['zustand'],
        },
      },
    },
    // Enable source maps for production debugging
    sourcemap: false,
    // Minification settings
    minify: 'esbuild',
    target: 'es2020',
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
      // Proxy requests starting with /api/ai to the AI service (centralized)
      '/api/ai': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      // Proxy requests starting with /api/assistant to the AI service
      '/api/assistant': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      // Proxy requests starting with /api/personalization to the AI service
      '/api/personalization': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      // Proxy requests starting with /api/agents to the AI service
      '/api/agents': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      // Proxy requests starting with /api/search to the AI service
      '/api/search': {
        target: 'http://localhost:8088',
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
      // Proxy requests starting with /api/journal to the notes service (merged)
      '/api/journal': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/journals': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/templates': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      // Proxy requests starting with /api/chat to the social service (merged)
      '/api/chat': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      // Proxy WebSocket requests to the social service
      '/ws-chat': {
        target: 'http://localhost:8083',
        ws: true,
        changeOrigin: true,
      },
      // Proxy requests starting with /api/feed to the feed service
      '/api/feed': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      // Proxy requests starting with /api/quantum to the quantum service
      '/api/quantum': {
        target: 'http://localhost:8092',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      // Proxy requests starting with /api/calendar to the notes service (merged)
      '/api/calendar': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      // Proxy requests starting with /api/assignments to the academic service (merged)
      '/api/assignments': {
        target: 'http://localhost:8087',
        changeOrigin: true,
      },
      // Proxy requests starting with /api/clubs to the academic service
      '/api/clubs': {
        target: 'http://localhost:8087',
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
