import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// Адрес, по которому приложение открывается на GitHub Pages.
// Пока идёт разработка V1, новое приложение живёт в /ArmLanguage/next/, а прототип — в корне сайта.
// Задаётся при сборке переменной BASE_PATH (см. .github/workflows/deploy.yml).
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [svelte()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "dev"),
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
});
