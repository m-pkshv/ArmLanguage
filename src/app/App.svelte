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
  import Custom from "./screens/Custom.svelte";
  import Lesson from "./screens/Lesson.svelte";
  import Lessons from "./screens/Lessons.svelte";
  import Match from "./screens/Match.svelte";
  import Pairs from "./screens/Pairs.svelte";
  import Stats from "./screens/Stats.svelte";
  import FirstWords from "./screens/FirstWords.svelte";
  import ThemeScreen from "./screens/Theme.svelte";
  import MyWords from "./screens/MyWords.svelte";
  import Session from "./screens/Session.svelte";
  import Credits from "./screens/Credits.svelte";
  import Home from "./screens/Home.svelte";
  import Letter from "./screens/Letter.svelte";
  import NotFound from "./screens/NotFound.svelte";
  import Practice from "./screens/Practice.svelte";
  import Profile from "./screens/Profile.svelte";
  import Settings from "./screens/Settings.svelte";
  import { pwa } from "../platform/pwa.svelte";
  import { trackScreen } from "../platform/analytics";
  import { app } from "./state.svelte";
  import { isFirstRun } from "../session/next";
  import { releaseToShow, SEEN_KEY, shortVersion } from "./whatsNew";
  import WhatsNew from "./screens/WhatsNew.svelte";

  const route = $derived(router.current);

  // «Что нового» — один раз после обновления, только тем, кто уже занимался (docs/09-navigation.md, 9.16).
  const readSeen = () => {
    try {
      return localStorage.getItem(SEEN_KEY);
    } catch {
      return null;
    }
  };
  const markSeen = () => {
    try {
      localStorage.setItem(SEEN_KEY, shortVersion(__APP_VERSION__));
    } catch {
      /* ignore */
    }
  };
  const initial = releaseToShow(readSeen(), __APP_VERSION__, !isFirstRun(app.progress));
  if (!initial) markSeen();
  let release = $state(initial);
  function closeNew() {
    release = undefined;
    markSeen();
  }

  // Статистика экранов — только название экрана, без id букв и уроков.
  $effect(() => trackScreen(route.name));

  // Тема и размер букв применяются к <html>, чтобы работали CSS-переменные (src/styles/global.css).
  $effect(() => {
    const root = document.documentElement;
    const { theme, letterSize } = app.progress.settings;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
    root.dataset.letterSize = letterSize;
  });
</script>

{#if route.name !== "session"}<NavBar active={tabOf(route)} />{/if}
{#if release && route.name !== "session"}<WhatsNew {release} onclose={closeNew} />{/if}

<main class:session={route.name === "session"}>
  {#if !app.storagePersistent}
    <div class="banner" role="alert">
      <Icon name="warning" size={20} />
      <span>{t("storage.unavailable")}</span>
    </div>
  {/if}

  {#if pwa.needRefresh && route.name !== "session"}
    <div class="banner update">
      <span>{t("update.available")}</span>
      <button onclick={() => pwa.apply()}>{t("update.button")}</button>
    </div>
  {/if}

  {#if route.name === "home"}
    <Home />
  {:else if route.name === "lessons"}
    <Lessons />
  {:else if route.name === "lesson"}
    {#key route.id}<Lesson id={route.id} />{/key}
  {:else if route.name === "session"}
    <Session />
  {:else if route.name === "custom"}
    <Custom />
  {:else if route.name === "pairs"}
    <Pairs />
  {:else if route.name === "match"}
    <Match />
  {:else if route.name === "stats"}
    <Stats />
  {:else if route.name === "words"}
    <FirstWords />
  {:else if route.name === "my-words"}
    <MyWords />
  {:else if route.name === "theme"}
    <ThemeScreen id={route.id} />
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
  /* Занятие — без нижней панели, узкая колонка по центру */
  main.session {
    max-width: 640px;
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
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
  .update {
    align-items: center;
    justify-content: space-between;
    background: var(--accent-soft);
  }
  .update button {
    min-height: 40px;
    padding: 0 14px;
    border: 0;
    border-radius: 10px;
    background: var(--accent);
    color: var(--accent-text);
    font-weight: 600;
  }
  .banner :global(svg) {
    flex: none;
    color: var(--warn);
  }
</style>
