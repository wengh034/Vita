import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   allowedHosts: [
//       'loved-macintosh-lions-debut.trycloudflare.com'
//     ]
// })
export default defineConfig({
  plugins: [react()],
  base: "/Vita/",
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      }
    },
    host: '0.0.0.0', // para que escuche conexiones externas
    port: 5173,       // tu puerto
    // Agregar allowedHosts
    allowedHosts: [
      'qty-horn-diy-percent.trycloudflare.com',
      'microwave-logs-hands-beef.trycloudflare.com'
    ]
  }
})