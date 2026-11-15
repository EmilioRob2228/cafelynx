import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // El vigilante nativo de archivos se cuelga en algunos entornos; el polling es estable.
  server: { watch: { usePolling: true, interval: 500 } },
});
