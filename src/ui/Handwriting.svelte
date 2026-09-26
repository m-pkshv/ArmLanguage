<script lang="ts" module>
  // SVG рукописных букв вставляются прямо в страницу, чтобы линии красились в цвет текста темы.
  // Файлы — наши (public/img/handwriting), кэшируем, чтобы не скачивать повторно.
  const cache = new Map<string, Promise<string>>();

  function load(url: string): Promise<string> {
    let p = cache.get(url);
    if (!p) {
      p = fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.statusText))));
      p.catch(() => cache.delete(url));
      cache.set(url, p);
    }
    return p;
  }
</script>

<script lang="ts">
  import { assetUrl } from "../core/content";

  // file — путь из контента (img/handwriting/tho-upper.svg), label — что прочитает экранный диктор.
  let { file, label, height = 64 }: { file: string; label: string; height?: number } = $props();
</script>

<span class="hw" role="img" aria-label={label} style:height="{height}px">
  {#await load(assetUrl(file)) then svg}
    {@html svg}
  {/await}
</span>

<style>
  .hw {
    display: inline-flex;
    align-items: center;
  }
  .hw :global(svg) {
    height: 100%;
    width: auto;
  }
</style>
