<script>
  import Badge from "../components/Badge.svelte";
  import Card from "../components/Card.svelte";
  import MathText from "../components/MathText.svelte";
  import SectionTree from "../components/SectionTree.svelte";

  import { evidenceColorVar, kindColorVar } from "../lib/colors.js";
  import { inEdges, nodeMap, outEdges, proofStrategyMap, sections } from "../stores/graph.js";
  import { navigateToNode, selectedNodeId, selectedSectionId } from "../stores/ui.js";
</script>

<h1>Theorem Explorer</h1>

<div class="layout">
  <div class="left">
    <SectionTree sections={$sections} />
  </div>

  <div class="right">
    {#if $selectedNodeId}
      {@const node = $nodeMap.get($selectedNodeId)}
      {#if node}
        <Card>
          <div class="header">
            <div class="title">{node.label}</div>
            <div class="badges">
              <Badge text={node.kind} color={kindColorVar(node.kind)} />
              <Badge text={node.novelty} color="var(--accent)" subtle />
              <Badge text={node.proof_status} color="var(--text-secondary)" subtle />
            </div>
          </div>
          <div class="statement">
            <MathText text={node.statement} />
          </div>

          {@const ps = $proofStrategyMap.get(node.id)}
          {#if ps}
            <div class="ps">
              <div class="ps-title">Proof strategy</div>
              <div class="ps-body">{ps.strategy_summary}</div>
              {#if ps.key_steps?.length}
                <ol class="steps">
                  {#each ps.key_steps as step (step.step)}
                    <li>
                      <div class="step-desc">{step.description}</div>
                      {#if step.uses?.length}
                        <div class="chips">
                          {#each step.uses as u (u)}
                            <button class="chip" type="button" on:click={() => navigateToNode(u)}>{u}</button>
                          {/each}
                        </div>
                      {/if}
                    </li>
                  {/each}
                </ol>
              {/if}
              {#if ps.noise_removed}
                <div class="noise">Noise removed: {ps.noise_removed}</div>
              {/if}
            </div>
          {/if}

          {@const outs = $outEdges.get(node.id) ?? []}
          {@const ins = $inEdges.get(node.id) ?? []}

          <div class="deps">
            <div class="dep-col">
              <div class="dep-title">Uses</div>
              {#if outs.length === 0}
                <div class="muted">(none)</div>
              {:else}
                <ul class="elist">
                  {#each outs as e (e.source + e.target + e.kind + e.evidence)}
                    <li>
                      <button class="dep" type="button" on:click={() => navigateToNode(e.target)}>
                        <span class="arrow">→</span>
                        <span class="txt">{($nodeMap.get(e.target)?.label ?? e.target)}</span>
                        <span class="spacer"></span>
                        <Badge text={e.evidence} color={evidenceColorVar(e.evidence)} />
                      </button>
                    </li>
                  {/each}
                </ul>
              {/if}
            </div>

            <div class="dep-col">
              <div class="dep-title">Used by</div>
              {#if ins.length === 0}
                <div class="muted">(none)</div>
              {:else}
                <ul class="elist">
                  {#each ins as e (e.source + e.target + e.kind + e.evidence)}
                    <li>
                      <button class="dep" type="button" on:click={() => navigateToNode(e.source)}>
                        <span class="arrow">←</span>
                        <span class="txt">{($nodeMap.get(e.source)?.label ?? e.source)}</span>
                        <span class="spacer"></span>
                        <Badge text={e.evidence} color={evidenceColorVar(e.evidence)} />
                      </button>
                    </li>
                  {/each}
                </ul>
              {/if}
            </div>
          </div>

          <button class="view" type="button" on:click={() => navigateToNode(node.id)}>View in graph →</button>
        </Card>
      {:else}
        <Card>
          <div class="muted">Selected node not found.</div>
        </Card>
      {/if}
    {:else if $selectedSectionId}
      {@const sec = $sections.find((s) => s.section === $selectedSectionId)}
      {#if sec}
        <Card>
          <div class="header">
            <div class="title">Section {sec.section}: {sec.title || "(untitled)"}</div>
            <div class="muted">{sec.count} nodes</div>
          </div>
          <div class="muted">{sec.summary || "(no summary provided in index.json)"}</div>
        </Card>

        <div class="results">
          {#each sec.nodes as n (n.id)}
            <button class="result" type="button" on:click={() => selectedNodeId.set(n.id)}>
              <div class="row">
                <span class="dot" style={`--dot-color: ${kindColorVar(n.kind)}`}></span>
                <div class="rlabel">{n.label}</div>
                <span class="spacer"></span>
                <Badge text={n.kind} color={kindColorVar(n.kind)} />
              </div>
              <div class="snippet">
                <MathText text={n.statement} />
              </div>
            </button>
          {/each}
        </div>
      {:else}
        <Card>
          <div class="muted">Selected section not found.</div>
        </Card>
      {/if}
    {:else}
      <Card>
        <div class="muted">Select a section or result from the tree.</div>
      </Card>
    {/if}
  </div>
</div>

<style>
  h1 {
    margin: 0 0 var(--gap-lg);
    font-size: 22px;
  }

  .layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: var(--gap-lg);
    align-items: start;
    min-height: 0;
  }

  .left {
    min-height: 0;
  }

  .right {
    min-height: 0;
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: var(--gap-md);
  }

  .title {
    font-size: 18px;
    font-weight: 800;
  }

  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .statement {
    border: 1px solid var(--border);
    background: var(--bg-primary);
    border-radius: var(--radius-sm);
    padding: var(--gap-md);
    margin-bottom: var(--gap-lg);
    overflow: auto;
    max-height: 280px;
  }

  .muted {
    color: var(--text-secondary);
  }

  .ps {
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: var(--gap-lg);
    margin-bottom: var(--gap-lg);
  }

  .ps-title {
    font-weight: 800;
    margin-bottom: var(--gap-sm);
  }

  .ps-body {
    margin-bottom: var(--gap-md);
  }

  .steps {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }

  .chip {
    border: 1px solid var(--border);
    background: var(--bg-primary);
    color: var(--text-primary);
    padding: 4px 8px;
    border-radius: 999px;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 11px;
  }

  .chip:hover {
    border-color: var(--accent);
  }

  .noise {
    margin-top: var(--gap-md);
    color: var(--text-secondary);
    font-style: italic;
  }

  .deps {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--gap-lg);
    margin-bottom: var(--gap-lg);
  }

  .dep-title {
    font-weight: 800;
    margin-bottom: var(--gap-sm);
  }

  .elist {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .dep {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--border);
    background: var(--bg-primary);
    color: var(--text-primary);
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    text-align: left;
  }

  .dep:hover {
    border-color: var(--accent);
  }

  .arrow {
    font-family: var(--font-mono);
    color: var(--text-secondary);
  }

  .txt {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .spacer {
    flex: 1;
  }

  .view {
    border: none;
    background: transparent;
    color: var(--accent);
    cursor: pointer;
    font-weight: 700;
  }

  .view:hover {
    text-decoration: underline;
  }

  .results {
    margin-top: var(--gap-lg);
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--gap-md);
  }

  .result {
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: var(--gap-lg);
    cursor: pointer;
    text-align: left;
  }

  .result:hover {
    border-color: var(--accent);
    background: var(--bg-surface);
  }

  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    min-width: 0;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: var(--dot-color);
    flex: 0 0 auto;
  }

  .rlabel {
    font-weight: 800;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .snippet {
    color: var(--text-secondary);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }

  @media (max-width: 1100px) {
    .layout {
      grid-template-columns: 1fr;
    }
    .deps {
      grid-template-columns: 1fr;
    }
  }
</style>
