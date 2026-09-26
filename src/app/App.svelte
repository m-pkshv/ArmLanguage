<script lang="ts">
  import { t } from "../i18n";
  import Icon from "../ui/Icon.svelte";
  import NavBar from "../ui/NavBar.svelte";
  import Toast from "../ui/Toast.svelte";
  import { router } from "./router.svelte";
  import { tabOf } from "./routes";
  import About from "./screens/About.svelte";
  import Alphabet from "./screens/Alphabet.svelte";
  import Backup from "./screens/Backup.svelte";
  import Credits from "./screens/Credits.svelte";
  import Home from "./screens/Home.svelte";
  import Letter from "./screens/Letter.svelte";
  import NotFound from "./screens/NotFound.svelte";
  import Practice from "./screens/Practice.svelte";
  import Profile from "./screens/Profile.svelte";
  import Settings from "./screens/Settings.svelte";
  import { app } from "./state.svelte";

  const route = $derived(router.current);

  // Тема и размер букв применяются к <html>, чтобы работали CSS-переменные (src/styles/global.css).
  $effect(() => {
    const root = document.documentElement;
    const { theme, letterSize } = app.progress.settings;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
    root.dataset.letterSize = letterSize;
  });
</script>

<NavBar active={tabOf(route)} />

<main>
  {#if !app.storagePersistent}
    <div class="banner" role="alert">
      <Icon name="warning" size={20} />
      <span>{t("storage.unavailable")}</span>
    </div>
  {/if}

  {#if route.name === "home"}
    <Home />
  {:else if route.name === "alphabet"}
    <Alphabet />
  {:else if route.name === "letter"}
    {#key route.id}<Letter id={route.id} />{/key}
  {:else if route.name === "practice"}
    <Practice />
  {:else if route.name === "profile"}
    <Profile />
  {:else if route.name === "settings"}
    <Settings />
  {:else if route.name === "backup"}
    <Backup />
  {:else if route.name === "about"}
    <About />
  {:else if route.name === "credits"}
    <Credits />
  {:else}
    <NotFound />
  {/if}
</main>

<Toast />

<style>
  main {
    max-width: 640px;
    margin: 0 auto;
    padding: calc(12px + env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
      calc(var(--nav-h) + env(safe-area-inset-bottom) + 24px) max(16px, env(safe-area-inset-left));
  }
  @media (min-width: 1024px) {
    main {
      max-width: 960px;
      padding: 24px 24px 48px;
    }
  }
  .banner {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin-bottom: 16px;
    padding: 12px 14px;
    border-radius: var(--radius);
    background: var(--warn-soft);
    color: var(--text);
    font-size: 14px;
  }
  .banner :global(svg) {
    flex: none;
    color: var(--warn);
  }
</style>
