import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/noto-sans-armenian/400.css";
import "@fontsource/noto-sans-armenian/600.css";
import "./styles/global.css";

import { mount } from "svelte";
import App from "./app/App.svelte";

mount(App, { target: document.getElementById("app")! });
