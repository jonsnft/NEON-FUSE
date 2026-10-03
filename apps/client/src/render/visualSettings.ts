export type VisualQuality = "low" | "medium" | "high";

export interface VisualPreferences {
  quality: VisualQuality;
  reducedMotion: boolean;
  transientFxCap: number;
  trailsEnabled: boolean;
  cameraShakeEnabled: boolean;
  ambientMotionEnabled: boolean;
}

const STORAGE_KEY = "neon-fuse.visual-quality";
const QUALITY_ORDER: VisualQuality[] = ["low", "medium", "high"];
let quality: VisualQuality = "medium";
let reducedMotion = false;
let initialized = false;

const readStoredQuality = (): VisualQuality | null => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "low" || value === "medium" || value === "high" ? value : null;
  } catch {
    return null;
  }
};

const writeStoredQuality = (value: VisualQuality): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Persistence is optional; rendering must continue if storage is unavailable.
  }
};

const applyDocumentState = (): void => {
  document.documentElement.dataset.visualQuality = quality;
  document.documentElement.dataset.reducedMotion = reducedMotion ? "true" : "false";
  const label = document.querySelector<HTMLElement>("#visual-quality");
  if (label) {
    label.textContent = `VISUAL ${quality.toUpperCase()}${reducedMotion ? " // REDUCED MOTION" : ""}`;
  }
};

export const initVisualPreferences = (): void => {
  if (initialized) return;
  initialized = true;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  reducedMotion = motionQuery.matches;
  quality = readStoredQuality() ?? "medium";
  applyDocumentState();

  motionQuery.addEventListener?.("change", (event) => {
    reducedMotion = event.matches;
    applyDocumentState();
  });

  window.addEventListener("keydown", (event) => {
    if (event.code !== "KeyV" || event.repeat) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    cycleVisualQuality();
  });
};

export const cycleVisualQuality = (): VisualQuality => {
  const index = QUALITY_ORDER.indexOf(quality);
  quality = QUALITY_ORDER[(index + 1) % QUALITY_ORDER.length];
  writeStoredQuality(quality);
  applyDocumentState();
  return quality;
};

export const getVisualPreferences = (): VisualPreferences => {
  const cap = quality === "low" ? 60 : quality === "medium" ? 120 : 180;
  return {
    quality,
    reducedMotion,
    transientFxCap: reducedMotion ? Math.min(cap, 60) : cap,
    trailsEnabled: !reducedMotion && quality !== "low",
    cameraShakeEnabled: !reducedMotion && quality === "high",
    ambientMotionEnabled: !reducedMotion
  };
};
