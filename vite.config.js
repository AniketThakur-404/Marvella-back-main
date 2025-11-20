import path from "path"
import { exec } from "node:child_process"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

function autoStartBackend() {
  let backendProcess = null

  const cleanup = () => {
    if (backendProcess) {
      backendProcess.kill()
      backendProcess = null
    }
  }

  return {
    name: "auto-start-backend",
    apply: "serve",
    configureServer() {
      if (process.env.DISABLE_AUTO_API === "1" || backendProcess) {
        return
      }

      const command = process.platform === "win32" ? "npm.cmd run dev:backend" : "npm run dev:backend"
      backendProcess = exec(command, { cwd: process.cwd(), env: process.env, windowsHide: false }, (error) => {
        if (error) {
          console.error("[auto-start-backend] failed to start API:", error.message)
        }
      })

      backendProcess.stdout?.pipe(process.stdout)
      backendProcess.stderr?.pipe(process.stderr)

      const signals = ["exit", "SIGTERM", "SIGINT"]
      signals.forEach((signal) => {
        process.once(signal, cleanup)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), autoStartBackend()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
