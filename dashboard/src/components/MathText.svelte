<script>
  import katex from "katex";

  export let text = "";

  function parseMathSegments(input) {
    const segments = [];
    let i = 0;

    while (i < input.length) {
      const start = input.indexOf("$", i);
      if (start === -1) {
        segments.push({ type: "text", value: input.slice(i) });
        break;
      }

      if (start > i) segments.push({ type: "text", value: input.slice(i, start) });

      if (input[start + 1] === "$") {
        const end = input.indexOf("$$", start + 2);
        if (end === -1) {
          segments.push({ type: "text", value: input.slice(start) });
          break;
        }
        segments.push({ type: "math", value: input.slice(start + 2, end), displayMode: true });
        i = end + 2;
        continue;
      }

      const end = input.indexOf("$", start + 1);
      if (end === -1) {
        segments.push({ type: "text", value: input.slice(start) });
        break;
      }
      segments.push({ type: "math", value: input.slice(start + 1, end), displayMode: false });
      i = end + 1;
    }

    return segments;
  }

  function renderMath(latex, displayMode) {
    const trimmed = latex.trim();
    if (trimmed.length === 0) return "";
    return katex.renderToString(trimmed, {
      throwOnError: false,
      displayMode,
      strict: false,
      trust: false,
    });
  }

  $: segments = parseMathSegments(text ?? "");
</script>

<div class="mathtext">
  {#each segments as seg, i (i)}
    {#if seg.type === "text"}
      {seg.value}
    {:else}
      <span class:display={seg.displayMode}>
        {@html renderMath(seg.value, seg.displayMode)}
      </span>
    {/if}
  {/each}
</div>

<style>
  .mathtext {
    white-space: pre-wrap;
    line-height: 1.45;
  }
  .display {
    display: block;
    margin: 10px 0;
  }
</style>
