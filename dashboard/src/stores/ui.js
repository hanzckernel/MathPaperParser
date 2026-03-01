import { writable } from "svelte/store";

const DEFAULT_ROUTE = "overview";
const ROUTES = new Set(["overview", "graph", "explorer", "innovation", "unknowns"]);

function parseHash(hash) {
  const cleaned = (hash ?? "").replace(/^#\/?/, "");
  const [first] = cleaned.split("/", 1);
  if (ROUTES.has(first)) return first;
  return DEFAULT_ROUTE;
}

export const route = writable(DEFAULT_ROUTE);
export const selectedNodeId = writable(null);
export const selectedSectionId = writable(null);

export function syncRouteFromLocation() {
  if (typeof window === "undefined") return () => {};

  const apply = () => route.set(parseHash(window.location.hash));
  apply();
  window.addEventListener("hashchange", apply);
  return () => window.removeEventListener("hashchange", apply);
}

export function navigateTo(nextRoute) {
  if (!ROUTES.has(nextRoute)) return;
  if (typeof window === "undefined") {
    route.set(nextRoute);
    return;
  }
  window.location.hash = `#/${nextRoute}`;
}

export function navigateToNode(nodeId) {
  selectedNodeId.set(nodeId);
  navigateTo("graph");
}

export function navigateToSection(sectionId) {
  selectedSectionId.set(sectionId);
  navigateTo("graph");
}

