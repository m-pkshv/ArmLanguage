import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";
import pkg from "./package.json";

// Адрес, по которому приложение открывается на GitHub Pages (/ArmLanguage/).
// Задаётся при сборке переменной BASE_PATH (см. .github/workflows/deploy.yml).
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [
    svelte(),
    // Работа без интернета и установка на телефон (docs/02-features.md, 2.10).
    VitePWA({
      registerType: "prompt", // новая версия ставится по кнопке «Обновить», не посреди урока
      injectRegister: false,
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Այբուբեն — армянский алфавит",
        short_name: "Այբուբեն",
        description: "Армянский алфавит для русскоговорящих: уроки, задания, повторение.",
        lang: "ru",
        start_url: base,
        scope: base,
        display: "standalone",
        orientation: "portrait",
        background_color: "#faf7f2",
        theme_color: "#c2410c",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Всё нужное для занятий — в кэш при первом открытии: код, картинки, рукописные буквы, шрифты.
        globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
});
