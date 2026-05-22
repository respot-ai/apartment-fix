// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Vercel deploy: skip the Cloudflare plugin and build TanStack Start in SPA mode
// so the output is a static dist/ folder Vercel serves directly.
export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    spa: { enabled: true },
  },
  vite: {
    server: {
      proxy: {
        "/api": {
          target: "https://handover-psi.vercel.app",
          changeOrigin: true,
          secure: true,
        },
      },
    },
  },
});
