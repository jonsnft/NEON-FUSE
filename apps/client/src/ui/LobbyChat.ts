import { GameObjects, Scene } from "phaser";
import { CHAT_MESSAGE_MAX_LENGTH, type ChatMessage } from "@neon-fuse/shared";

const MAX_VISIBLE_MESSAGES = 8;

export class LobbyChat {
  private readonly historyText: GameObjects.Text;
  private readonly inputText: GameObjects.Text;
  private readonly messages: ChatMessage[] = [];
  private enabled = false;
  private typing = false;
  private draft = "";

  constructor(
    private readonly scene: Scene,
    private readonly send: (text: string) => void,
    private readonly getSelfId: () => string | null
  ) {
    this.historyText = scene.add.text(10, 390, "", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#b9f7ff",
      wordWrap: { width: 700 }
    }).setDepth(20).setVisible(false);

    this.inputText = scene.add.text(10, 565, "", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#e9ff70"
    }).setDepth(20).setVisible(false);

    scene.input.keyboard?.on("keydown", this.onKeyDown, this);
  }

  get isTyping(): boolean {
    return this.enabled && this.typing;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.typing = false;
      this.draft = "";
    }
    this.historyText.setVisible(enabled);
    this.inputText.setVisible(enabled);
    this.render();
  }

  receive(message: ChatMessage): void {
    if (!this.enabled) return;
    this.messages.push(message);
    if (this.messages.length > MAX_VISIBLE_MESSAGES) {
      this.messages.splice(0, this.messages.length - MAX_VISIBLE_MESSAGES);
    }
    this.render();
  }

  destroy(): void {
    this.scene.input.keyboard?.off("keydown", this.onKeyDown, this);
    this.historyText.destroy();
    this.inputText.destroy();
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;

    if (!this.typing) {
      if (event.key.toLowerCase() === "t") {
        this.typing = true;
        this.draft = "";
        event.preventDefault();
        this.render();
      }
      return;
    }

    if (event.key === "Enter") {
      const text = this.draft.trim();
      if (text.length > 0) this.send(text);
      this.typing = false;
      this.draft = "";
      event.preventDefault();
      this.render();
      return;
    }

    if (event.key === "Escape") {
      this.typing = false;
      this.draft = "";
      event.preventDefault();
      this.render();
      return;
    }

    if (event.key === "Backspace") {
      this.draft = this.draft.slice(0, -1);
      event.preventDefault();
      this.render();
      return;
    }

    if (event.key.length === 1 && this.draft.length < CHAT_MESSAGE_MAX_LENGTH) {
      this.draft += event.key;
      event.preventDefault();
      this.render();
    }
  }

  private render(): void {
    if (!this.enabled) return;

    const selfId = this.getSelfId();
    this.historyText.setText(
      this.messages
        .map((message) => {
          const sender = message.senderId === selfId ? "YOU" : message.senderId.slice(0, 6);
          return `${sender}> ${message.text}`;
        })
        .join("\n")
    );

    this.inputText.setText(
      this.typing
        ? `CHAT> ${this.draft}_`
        : "T = CHAT"
    );
  }
}
