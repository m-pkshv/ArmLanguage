import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/noto-sans-armenian/400.css";
import "@fontsource/noto-sans-armenian/500.css";
import "@fontsource/noto-sans-armenian/600.css";
import "@fontsource/noto-sans-armenian/700.css";
// Lora — заголовки темы «Дилиджан»; только кириллица и латиница (и в офлайн-кэше тоже)
import "@fontsource/lora/cyrillic-500.css";
import "@fontsource/lora/latin-500.css";
import "@fontsource/lora/cyrillic-600.css";
import "@fontsource/lora/latin-600.css";
import "./styles/palettes.css";
import "./styles/global.css";

import { mount } from "svelte";
import App from "./app/App.svelte";
import { pwa } from "./platform/pwa.svelte";

mount(App, { target: document.getElementById("app")! });
pwa.init();
