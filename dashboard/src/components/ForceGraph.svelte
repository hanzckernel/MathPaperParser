<script>
  import { onDestroy, onMount } from "svelte";
  import * as d3 from "d3";

  import { evidenceColorVar, kindColorVar } from "../lib/colors.js";
  import { clamp } from "../lib/graph-utils.js";
  import { graphView } from "../stores/graph.js";
  import { clearSelection, searchQuery, selectedEdgeKey, selectedNodeId } from "../stores/ui.js";

  let hostEl;
  let svgEl;
  let viewport;
  let linkLayer;
  let nodeLayer;

  let width = 800;
  let height = 600;

  let simulation = null;
  let zoom = null;
  let resizeObserver = null;

  let nodeIndex = new Map();
  const lastPosById = new Map();
  let hoveredNodeId = null;

  function nodeRadius(n) {
    return clamp(8, 4 + (Number(n.in_degree ?? 0) + Number(n.out_degree ?? 0)) * 2, 30);
  }

  function nodeStrokeWidth(n) {
    return n.is_main_result ? 2.5 : 1.5;
  }

  function extractId(x) {
    return typeof x === "string" ? x : x?.id;
  }

  function isConnectedToNode(e, nodeId) {
    const s = extractId(e.source);
    const t = extractId(e.target);
    return s === nodeId || t === nodeId;
  }

  function updateHighlight() {
    if (!linkLayer || !nodeLayer) return;

    const selNode = $selectedNodeId;
    const selEdge = $selectedEdgeKey;
    const hover = hoveredNodeId;

    const links = linkLayer.selectAll("line");
    links
      .attr("stroke-width", (d) => {
        if (selEdge && d.key === selEdge) return 2.5;
        if (selNode && isConnectedToNode(d, selNode)) return 2.5;
        if (hover && isConnectedToNode(d, hover)) return 2.5;
        return 1.5;
      })
      .attr("opacity", (d) => {
        if (selEdge && d.key === selEdge) return 1.0;
        if (selNode && isConnectedToNode(d, selNode)) return 1.0;
        if (hover && isConnectedToNode(d, hover)) return 1.0;
        return 0.6;
      });

    const nodes = nodeLayer.selectAll("g.node");
    nodes.classed("selected", (d) => d.id === selNode);
  }

  function centerOnNodeId(nodeId) {
    if (!zoom || !svgEl) return;
    const node = nodeIndex.get(nodeId);
    if (!node) return;

    const current = d3.zoomTransform(svgEl);
    const scale = current.k || 1;
    const tx = width / 2 - node.x * scale;
    const ty = height / 2 - node.y * scale;
    d3.select(svgEl).transition().duration(250).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }

  function ensureSimulation() {
    if (simulation) return;
    simulation = d3
      .forceSimulation()
      .force("link", d3.forceLink().id((d) => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => nodeRadius(d) + 4)
      )
      .alphaDecay(0.02);

    simulation.on("tick", () => {
      linkLayer
        ?.selectAll("line")
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      nodeLayer?.selectAll("g.node").attr("transform", (d) => `translate(${d.x},${d.y})`);

      for (const n of simulation.nodes()) {
        lastPosById.set(n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy });
      }
    });
  }

  function updateGraph(view) {
    ensureSimulation();

    const nodes = (view.nodes ?? []).map((n) => {
      const copy = { ...n };
      const last = lastPosById.get(copy.id);
      if (last) {
        copy.x = last.x;
        copy.y = last.y;
        copy.vx = last.vx;
        copy.vy = last.vy;
      }
      return copy;
    });

    const edges = (view.edges ?? []).map((e) => ({ ...e }));

    nodeIndex = new Map(nodes.map((n) => [n.id, n]));

    const linkForce = simulation.force("link");
    linkForce.links(edges);
    simulation.nodes(nodes);
    simulation.alpha(0.3).restart();

    // --- D3 joins
    const linkSel = linkLayer.selectAll("line").data(edges, (d) => d.key);
    linkSel.exit().remove();
    linkSel
      .enter()
      .append("line")
      .attr("stroke", (d) => evidenceColorVar(d.evidence))
      .attr("marker-end", "url(#arrow)")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.6)
      .on("click", (event, d) => {
        event.stopPropagation();
        selectedEdgeKey.set(d.key);
        selectedNodeId.set(null);
        updateHighlight();
      });

    const nodeSel = nodeLayer.selectAll("g.node").data(nodes, (d) => d.id);
    nodeSel.exit().remove();

    const nodeEnter = nodeSel
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(
        d3
          .drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("mouseenter", (event, d) => {
        hoveredNodeId = d.id;
        const g = d3.select(event.currentTarget);
        g.select("circle.body").attr("r", nodeRadius(d) * 1.5);
        g.select("circle.ring").attr("r", nodeRadius(d) * 1.5 + (d.is_main_result ? 4 : 0));
        if (!d.is_main_result) g.select("text").attr("opacity", 1);
        updateHighlight();
      })
      .on("mouseleave", (event, d) => {
        hoveredNodeId = null;
        const g = d3.select(event.currentTarget);
        g.select("circle.body").attr("r", nodeRadius(d));
        g.select("circle.ring").attr("r", nodeRadius(d) + (d.is_main_result ? 4 : 0));
        if (!d.is_main_result) g.select("text").attr("opacity", 0);
        updateHighlight();
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        selectedNodeId.set(d.id);
        selectedEdgeKey.set(null);
        centerOnNodeId(d.id);
        updateHighlight();
      });

    nodeEnter
      .append("circle")
      .attr("class", "ring")
      .attr("r", (d) => nodeRadius(d) + (d.is_main_result ? 4 : 0))
      .attr("fill", "none")
      .attr("stroke", (d) => (d.is_main_result ? kindColorVar(d.kind) : "transparent"))
      .attr("stroke-width", (d) => (d.is_main_result ? 3 : 0));

    nodeEnter
      .append("circle")
      .attr("class", "body")
      .attr("r", (d) => nodeRadius(d))
      .attr("fill", (d) => kindColorVar(d.kind))
      .attr("stroke", "var(--border)")
      .attr("stroke-width", (d) => nodeStrokeWidth(d));

    nodeEnter
      .append("text")
      .attr("y", (d) => nodeRadius(d) + 14)
      .attr("text-anchor", "middle")
      .attr("font-family", "var(--font-mono)")
      .attr("font-size", 11)
      .attr("fill", "var(--text-primary)")
      .attr("opacity", (d) => (d.is_main_result ? 1 : 0))
      .text((d) => d.label);

    // Update node appearance on every update.
    nodeLayer
      .selectAll("g.node")
      .data(nodes, (d) => d.id)
      .select("circle.body")
      .attr("r", (d) => nodeRadius(d))
      .attr("fill", (d) => kindColorVar(d.kind))
      .attr("opacity", (d) => d.opacity ?? 1.0)
      .attr("filter", (d) => (d.matches_search && ($searchQuery ?? "").trim().length > 0 ? "url(#glow)" : null));

    nodeLayer
      .selectAll("g.node")
      .data(nodes, (d) => d.id)
      .select("circle.ring")
      .attr("stroke", (d) => (d.is_main_result ? kindColorVar(d.kind) : "transparent"))
      .attr("r", (d) => nodeRadius(d) + (d.is_main_result ? 4 : 0));

    nodeLayer
      .selectAll("g.node")
      .data(nodes, (d) => d.id)
      .select("text")
      .attr("y", (d) => nodeRadius(d) + 14);

    updateHighlight();
  }

  onMount(() => {
    const svg = d3.select(svgEl);
    svg.attr("width", "100%").attr("height", "100%");

    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 14)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "var(--border)");

    const filter = defs.append("filter").attr("id", "glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    filter.append("feDropShadow").attr("dx", 0).attr("dy", 0).attr("stdDeviation", 3).attr("flood-color", "var(--accent)").attr("flood-opacity", 0.8);

    viewport = svg.append("g").attr("class", "viewport");
    linkLayer = viewport.append("g").attr("class", "links");
    nodeLayer = viewport.append("g").attr("class", "nodes");

    zoom = d3
      .zoom()
      .scaleExtent([0.1, 5])
      .on("zoom", (event) => {
        viewport.attr("transform", event.transform);
      });
    svg.call(zoom);

    svg.on("click", () => {
      clearSelection();
      updateHighlight();
    });

    resizeObserver = new ResizeObserver((entries) => {
      for (const e of entries) {
        width = Math.max(200, Math.floor(e.contentRect.width));
        height = Math.max(200, Math.floor(e.contentRect.height));
        simulation?.force("center", d3.forceCenter(width / 2, height / 2));
        simulation?.alpha(0.3).restart();
      }
    });
    if (hostEl) resizeObserver.observe(hostEl);

    return () => {};
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
    simulation?.stop();
  });

  $: if (simulation) updateGraph($graphView);
  $: updateHighlight();
  $: if ($selectedNodeId) centerOnNodeId($selectedNodeId);
</script>

<div class="host" bind:this={hostEl}>
  <svg bind:this={svgEl} />
</div>

<style>
  .host {
    width: 100%;
    height: 100%;
    min-height: 520px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    overflow: hidden;
  }

  :global(g.node.selected circle.body) {
    stroke: var(--accent);
    stroke-width: 3px;
  }
</style>
