<script lang="ts">
  // Простые линейные иконки (24×24), цвет наследуется от текста.
  export type IconName = "learn" | "alphabet" | "practice" | "profile" | "back" | "chevron" | "warning";

  let { name, size = 24 }: { name: IconName; size?: number } = $props();

  const paths: Record<IconName, string> = {
    learn: "M4 19V6a2 2 0 0 1 2-2h13v13H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h13v-4M8 8h7M8 12h5",
    alphabet: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    practice: "M12 3v4M12 17v4M3 12h4M17 12h4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
    profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
    back: "M15 5l-7 7 7 7",
    chevron: "M9 5l7 7-7 7",
    warning: "M12 4 2.5 20h19L12 4Zm0 6v4m0 3h.01",
  };
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d={paths[name]} />
</svg>
