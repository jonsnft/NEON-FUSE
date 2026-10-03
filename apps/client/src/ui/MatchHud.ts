export type HudTone = "normal" | "danger" | "success";

const requiredElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing HUD element #${id}`);
  return element as T;
};

export class MatchHud {
  private readonly root = requiredElement<HTMLElement>("match-hud");
  private readonly eyebrow = requiredElement<HTMLElement>("match-hud-eyebrow");
  private readonly primary = requiredElement<HTMLElement>("match-hud-primary");
  private readonly secondary = requiredElement<HTMLElement>("match-hud-secondary");
  private readonly controls = requiredElement<HTMLElement>("match-hud-controls");

  constructor(_scene?: unknown) {
    this.root.hidden = false;
    this.root.dataset.tone = "normal";
  }

  setArenaWidth(_width: number): void {
    // DOM layout owns HUD placement; retained while scenes migrate off canvas sizing.
  }

  show(
    eyebrow: string,
    primary: string,
    secondary: string,
    controls: string,
    tone: HudTone = "normal"
  ): void {
    this.root.hidden = false;
    this.root.dataset.tone = tone;
    this.eyebrow.textContent = eyebrow;
    this.primary.textContent = primary;
    this.secondary.textContent = secondary;
    this.controls.textContent = controls;
  }

  destroy(): void {
    this.root.hidden = true;
    this.root.dataset.tone = "normal";
    this.eyebrow.textContent = "NEON FUSE";
    this.primary.textContent = "";
    this.secondary.textContent = "";
    this.controls.textContent = "";
  }
}
