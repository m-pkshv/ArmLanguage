<script lang="ts">
  import { content, letterById } from "../../core/content";
  import { knownLetters } from "../../core/course";
  import { availableGroups, confusionCount, frequentConfusions, groupConfidence, pairGroups, type PairGroup } from "../../core/pairs";
  import { t } from "../../i18n";
  import ScreenHeader from "../../ui/ScreenHeader.svelte";
  import { startPairs } from "../../session/start";
  import { app } from "../state.svelte";

  // Тренажёр пар-ловушек (docs/02-features.md, 2.8): список пар, уверенность, частые путаницы.
  const all = pairGroups(content);
  const groups = $derived(availableGroups(all, knownLetters(app.progress, content)));
  const frequent = $derived(frequentConfusions(app.progress, groups));
  const sound = $derived(groups.filter((g) => g.kind === "sound"));
  const shape = $derived(groups.filter((g) => g.kind === "shape"));

  const glyphs = (g: PairGroup) => g.letters.map((id) => letterById(id)!.lower).join(" / ");
  const sounds = (g: PairGroup) => g.letters.map((id) => letterById(id)!.sound.canonical).join(" / ");
</script>

<ScreenHeader title={t("pairs.title")} backTo="#/practice" />
<p class="muted intro">{t("pairs.intro")}</p>

{#if !groups.length}
  <p class="muted">{t("pairs.none")}</p>
{:else}
  {#if frequent.length}
    <button class="mine" onclick={() => startPairs(frequent.slice(0, 3).map((f) => f.group))}>
      <span class="tt">{t("pairs.mine")}</span>
      <span class="hy" lang="hy">{frequent.slice(0, 3).map((f) => glyphs(f.group)).join(" · ")}</span>
    </button>
  {/if}

  {#each [{ title: t("pairs.bySound"), list: sound }, { title: t("pairs.byShape"), list: shape }] as block (block.title)}
    {#if block.list.length}
      <h2>{block.title}</h2>
      <ul class="list">
        {#each block.list as g (g.id)}
          {@const conf = groupConfidence(app.progress, g)}
          {@const errors = confusionCount(app.progress, g)}
          <li>
            <button class="pair" onclick={() => startPairs([g])}>
              <span class="glyphs hy" lang="hy">{glyphs(g)}</span>
              <span class="info">
                <span class="muted">{sounds(g)}</span>
                {#if errors}<span class="err">{t("pairs.errors", { n: errors })}</span>{/if}
              </span>
              <span class="conf" aria-label={t("pairs.confidence")}>
                {#if conf === null}<span class="muted small">{t("pairs.new")}</span>{:else}<span class="bar"><span style:width="{conf * 100}%"></span></span>{/if}
              </span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {/each}
{/if}

<style>
  .intro {
    margin: 0 4px 16px;
    font-size: 14px;
  }
  .mine {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    margin-bottom: 8px;
    padding: 16px;
    border: 2px solid var(--accent);
    border-radius: var(--radius-lg);
    background: var(--accent-soft);
    color: var(--text);
    font: inherit;
    text-align: left;
  }
  .mine .tt {
    font-weight: 600;
  }
  .mine .hy {
    font-size: 22px;
  }
  h2 {
    margin: 20px 4px 8px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .list {
    margin: 0;
    padding: 0;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
    list-style: none;
  }
  .list li + li {
    border-top: 1px solid var(--line);
  }
  .pair {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 60px;
    padding: 8px 16px;
    border: 0;
    background: none;
    color: var(--text);
    font: inherit;
    text-align: left;
  }
  .glyphs {
    min-width: 86px;
    font-size: calc(26px * var(--glyph-scale));
  }
  .info {
    display: flex;
    flex: 1;
    flex-direction: column;
    font-size: 14px;
  }
  .err {
    color: var(--bad);
    font-size: 13px;
  }
  .conf {
    width: 64px;
    text-align: right;
  }
  .small {
    font-size: 12px;
  }
  .bar {
    display: block;
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--line);
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--good);
  }
</style>
