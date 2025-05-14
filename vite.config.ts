
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['date-fns', 'react-day-picker']
  },
  optimizeDeps: {
    include: ['date-fns', 'react-day-picker'],
    esbuildOptions: {
      // Force react-day-picker and date-fns to be processed correctly
      mainFields: ['module', 'main'],
      resolveExtensions: ['.js', '.jsx', '.ts', '.tsx']
    }
  },
  // Add proper base configuration for production
  base: '/',
}));
