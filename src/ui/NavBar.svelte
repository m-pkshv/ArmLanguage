<script lang="ts">
  import type { Tab } from "../app/routes";
  import { t } from "../i18n";
  import Icon from "./Icon.svelte";

  let { active }: { active: Tab | null } = $props();

  const tabs: { id: Tab; href: string }[] = [
    { id: "learn", href: "#/" },
    { id: "alphabet", href: "#/alphabet" },
    { id: "practice", href: "#/practice" },
    { id: "profile", href: "#/profile" },
  ];
</script>

<!-- На телефоне — нижняя панель, на широком экране — верхняя (см. docs/05-ui-mobile.md, 5.3) -->
<nav class="nav" aria-label="Разделы приложения">
  <a class="brand hy" href="#/">{t("app.name")}</a>
  <ul>
    {#each tabs as tab (tab.id)}
      <li>
        <a href={tab.href} class:active={active === tab.id} aria-current={active === tab.id ? "page" : undefined}>
          <span class="pill"><Icon name={tab.id} size={22} /></span>
          <span>{t(`tabs.${tab.id}`)}</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .nav {
    position: fixed;
    inset: auto 0 0 0;
    z-index: 10;
    background: var(--surface);
    border-top: 1px solid var(--line);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .brand {
    display: none;
  }
  ul {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    margin: 0 auto;
    padding: 0;
    list-style: none;
    max-width: 600px;
  }
  li a {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    height: var(--nav-h);
    color: var(--muted);
    text-decoration: none;
    font-size: 12px;
    font-weight: 500;
  }
  li a.active {
    color: var(--accent);
    font-weight: 600;
  }
  /* «Таблетка» под иконкой активной вкладки (docs/11-design.md) */
  .pill {
    display: grid;
    place-items: center;
    width: 56px;
    height: 30px;
    border-radius: 999px;
  }
  .active .pill {
    background: var(--accent-soft);
  }

  @media (min-width: 1024px) {
    .nav {
      position: sticky;
      inset: 0 0 auto 0;
      display: flex;
      align-items: center;
      gap: 32px;
      padding: 0 24px;
      border-top: 0;
      border-bottom: 1px solid var(--line);
    }
    .brand {
      display: block;
      font-size: 20px;
      font-weight: 600;
      color: var(--accent);
      text-decoration: none;
    }
    ul {
      display: flex;
      gap: 4px;
      margin: 0;
    }
    li a {
      flex-direction: row;
      gap: 8px;
      height: 56px;
      padding: 0 14px;
      font-size: 15px;
    }
    li a.active {
      box-shadow: inset 0 -3px 0 var(--accent);
    }
    .pill,
    .active .pill {
      width: auto;
      height: auto;
      background: none;
    }
  }
</style>
