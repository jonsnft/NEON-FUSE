import { describe, expect, it } from "vitest";
import {
  CHAT_MESSAGE_MAX_LENGTH,
  PROTOCOL_VERSION,
  isChatSend,
  normalizeChatText
} from "../src";

describe("lobby chat protocol", () => {
  it("trims accepted chat text", () => {
    expect(normalizeChatText("  hello fuse  ")).toBe("hello fuse");
  });

  it("rejects empty and oversized text", () => {
    expect(normalizeChatText("   ")).toBeNull();
    expect(normalizeChatText("x".repeat(CHAT_MESSAGE_MAX_LENGTH + 1))).toBeNull();
  });

  it("accepts only the versioned chat.send envelope", () => {
    expect(isChatSend({
      type: "chat.send",
      version: PROTOCOL_VERSION,
      text: "ready when you are"
    })).toBe(true);

    expect(isChatSend({
      type: "match.ready",
      version: PROTOCOL_VERSION,
      text: "nope"
    })).toBe(false);
  });
});
