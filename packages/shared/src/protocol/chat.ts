import { PROTOCOL_VERSION } from "./messages";

export const CHAT_MESSAGE_MAX_LENGTH = 160;
export const CHAT_MIN_INTERVAL_MS = 750;

export interface ChatSend {
  type: "chat.send";
  version: 1;
  text: string;
}

export interface ChatMessage {
  type: "chat.message";
  version: 1;
  senderId: string;
  text: string;
  sentAtMs: number;
}

export function normalizeChatText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text.length === 0 || text.length > CHAT_MESSAGE_MAX_LENGTH) return null;
  return text;
}

export function isChatSend(value: unknown): value is ChatSend {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.type === "chat.send" &&
    candidate.version === PROTOCOL_VERSION &&
    normalizeChatText(candidate.text) !== null
  );
}
