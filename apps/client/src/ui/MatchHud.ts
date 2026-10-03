export type HudTone = "normal" | "danger" | "success";

export interface HudItemInfo {
  name: string;
  glyph: string;
  description: string;
  current?: string;
}

export interface HudDetails {
  objective?: string;
  items?: HudItemInfo[];
  telemetry?: string[];
}

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
  private readonly objectiveModule = requiredElement<HTMLElement>("match-hud-objective-module");
  private readonly objective = requiredElement<HTMLElement>("match-hud-objective");
  private readonly itemsModule = requiredElement<HTMLElement>("match-hud-items-module");
  private readonly items = requiredElement<HTMLElement>("match-hud-items");
  private readonly telemetryModule = requiredElement<HTMLElement>("match-hud-telemetry-module");
  private readonly telemetry = requiredElement<HTMLElement>("match-hud-telemetry");

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
    tone: HudTone = "normal",
    details: HudDetails = {}
  ): void {
    this.root.hidden = false;
    this.root.dataset.tone = tone;
    this.eyebrow.textContent = eyebrow;
    this.primary.textContent = primary;
    this.secondary.textContent = secondary;
    this.controls.textContent = controls;
    this.renderObjective(details.objective);
    this.renderItems(details.items ?? []);
    this.renderTelemetry(details.telemetry ?? []);
  }

  destroy(): void {
    this.root.hidden = true;
    this.root.dataset.tone = "normal";
    this.eyebrow.textContent = "NEON FUSE";
    this.primary.textContent = "";
    this.secondary.textContent = "";
    this.controls.textContent = "";
    this.renderObjective(undefined);
    this.renderItems([]);
    this.renderTelemetry([]);
  }

  private renderObjective(value?: string): void {
    this.objectiveModule.hidden = !value;
    this.objective.textContent = value ?? "";
  }

  private renderItems(items: HudItemInfo[]): void {
    this.items.replaceChildren();
    this.itemsModule.hidden = items.length === 0;

    for (const item of items) {
      const row = document.createElement("div");
      row.className = "match-hud__item";

      const glyph = document.createElement("span");
      glyph.className = "match-hud__item-glyph";
      glyph.textContent = item.glyph;

      const copy = document.createElement("span");
      copy.className = "match-hud__item-copy";

      const title = document.createElement("strong");
      title.textContent = item.current ? `${item.name}  ${item.current}` : item.name;

      const description = document.createElement("span");
      description.textContent = item.description;

      copy.append(title, description);
      row.append(glyph, copy);
      this.items.append(row);
    }
  }

  private renderTelemetry(lines: string[]): void {
    this.telemetry.replaceChildren();
    this.telemetryModule.hidden = lines.length === 0;

    for (const line of lines) {
      const value = document.createElement("div");
      value.className = "match-hud__telemetry-line";
      value.textContent = line;
      this.telemetry.append(value);
    }
  }
}
