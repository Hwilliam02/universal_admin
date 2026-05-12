import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths'; // ✅ Import plugin

// https://vite.dev/config/
export default defineConfig({
  base: '/superadmin/',
  plugins: [
    react(),
    tsconfigPaths() // ✅ Add this
  ],
  server: {
    port: 5174,
    host:"0.0.0.0",
    // Optional: Exit if the port is already in use
    strictPort: true,
    allowedHosts: ['localhost', '127.0.0.1']
  },
});
