import { GameObjects, Input, Scene } from "phaser";
import { COSMETIC_CATALOG } from "@neon-fuse/shared";

export class StorePreviewScene extends Scene {
  private text!: GameObjects.Text;
  private back!: Input.Keyboard.Key;

  constructor() {
    super("store-preview");
  }

  create(): void {
    this.add.text(28, 24, "NEON FUSE // ITEM CATALOG", {
      fontFamily: "monospace",
      fontSize: "24px",
      color: "#ff4fd8"
    });

    this.add.text(28, 56, "PREVIEW ONLY — PURCHASE ADAPTER NOT CONNECTED", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#e9ff70"
    });

    const rows = COSMETIC_CATALOG.map((item) => {
      const price = item.price ? `${item.price.amount} SHELLS` : "STARTER";
      return `${item.rarity.padEnd(10)} ${item.displayName.padEnd(20)} ${item.category.padEnd(8)} ${price}`;
    });

    this.text = this.add.text(28, 100, rows.join("\n"), {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#dff",
      lineSpacing: 8
    });

    this.add.text(28, 570, "ESC = RETURN TO LOBBY", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#53f3ff"
    });

    if (!this.input.keyboard) throw new Error("Keyboard input unavailable");
    this.back = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.ESC);
  }

  update(): void {
    if (Input.Keyboard.JustDown(this.back)) {
      this.scene.start("lobby");
    }
  }
}
