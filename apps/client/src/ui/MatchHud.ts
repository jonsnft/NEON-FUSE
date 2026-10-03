import { GameObjects, Scene } from "phaser";

const PANEL_BG = 0x02080d;
const PANEL_BORDER = 0x2bcfe3;
const CYAN = "#53f3ff";
const LIME = "#e9ff70";
const MUTED = "#7fa7ad";
const WHITE = "#f4fbff";

export type HudTone = "normal" | "danger" | "success";

export class MatchHud {
  private readonly panel: GameObjects.Rectangle;
  private readonly accent: GameObjects.Rectangle;
  private readonly eyebrow: GameObjects.Text;
  private readonly primary: GameObjects.Text;
  private readonly secondary: GameObjects.Text;
  private readonly controls: GameObjects.Text;
  private arenaWidth = 0;
  private sideRail = false;

  constructor(private readonly scene: Scene) {
    this.panel = scene.add.rectangle(0, 0, 100, 100, PANEL_BG, 0.94)
      .setOrigin(0, 0)
      .setStrokeStyle(1, PANEL_BORDER, 0.72)
      .setDepth(30);
    this.accent = scene.add.rectangle(0, 0, 3, 48, PANEL_BORDER, 0.95)
      .setOrigin(0, 0)
      .setDepth(31);
    this.eyebrow = scene.add.text(0, 0, "NEON FUSE", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: MUTED
    }).setDepth(32);
    this.primary = scene.add.text(0, 0, "", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: CYAN,
      fontStyle: "bold"
    }).setDepth(32);
    this.secondary = scene.add.text(0, 0, "", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: WHITE,
      lineSpacing: 5
    }).setDepth(32);
    this.controls = scene.add.text(0, 0, "", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: LIME,
      lineSpacing: 4
    }).setDepth(32);

    this.layout();
  }

  setArenaWidth(width: number): void {
    this.arenaWidth = Math.max(0, width);
    this.layout();
  }

  show(
    eyebrow: string,
    primary: string,
    secondary: string,
    controls: string,
    tone: HudTone = "normal"
  ): void {
    this.eyebrow.setText(eyebrow);
    this.primary.setText(primary);
    this.secondary.setText(secondary);
    this.controls.setText(controls);

    const color = tone === "danger" ? "#ff4fd8" : tone === "success" ? LIME : CYAN;
    const accent = tone === "danger" ? 0xff4fd8 : tone === "success" ? 0xe9ff70 : PANEL_BORDER;
    this.primary.setColor(color);
    this.accent.setFillStyle(accent, 0.95);
    this.panel.setStrokeStyle(1, accent, 0.72);
    this.layout();
  }

  destroy(): void {
    this.panel.destroy();
    this.accent.destroy();
    this.eyebrow.destroy();
    this.primary.destroy();
    this.secondary.destroy();
    this.controls.destroy();
  }

  private layout(): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const railX = this.arenaWidth + 14;
    const railWidth = width - railX - 12;
    this.sideRail = this.arenaWidth > 0 && railWidth >= 250;

    if (this.sideRail) {
      const x = railX;
      const y = 8;
      const w = railWidth;
      const h = Math.max(160, height - 16);
      this.panel.setPosition(x, y).setSize(w, h);
      this.accent.setPosition(x, y).setSize(3, h);
      this.eyebrow.setPosition(x + 16, y + 16).setWordWrapWidth(w - 32);
      this.primary.setPosition(x + 16, y + 42).setWordWrapWidth(w - 32);
      this.secondary.setPosition(x + 16, y + 86).setWordWrapWidth(w - 32);
      this.controls.setPosition(x + 16, y + h - 72).setWordWrapWidth(w - 32);
      return;
    }

    const x = 8;
    const y = 8;
    const w = Math.max(280, width - 16);
    const h = 94;
    this.panel.setPosition(x, y).setSize(w, h);
    this.accent.setPosition(x, y).setSize(3, h);
    this.eyebrow.setPosition(x + 14, y + 10).setWordWrapWidth(w - 28);
    this.primary.setPosition(x + 14, y + 28).setFontSize(16).setWordWrapWidth(w - 28);
    this.secondary.setPosition(x + 14, y + 52).setFontSize(11).setWordWrapWidth(w - 28);
    this.controls.setPosition(x + 14, y + 74).setFontSize(10).setWordWrapWidth(w - 28);
  }
}
