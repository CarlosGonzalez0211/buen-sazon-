import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use the port assigned by the preview tool (PORT env var) when present.
  server: { port: Number(process.env.PORT) || 5173, strictPort: Boolean(process.env.PORT) },
})
