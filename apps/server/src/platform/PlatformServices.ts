import type { EntitlementProvider } from "./EntitlementProvider";

export interface PlatformSubject {
  subjectId: string;
  displayName?: string;
}

export interface IdentityProvider {
  resolveSubject(sessionId: string): Promise<PlatformSubject>;
}

export type PlatformTelemetryEvent =
  | { type: "player.joined"; subjectId: string }
  | { type: "player.left"; subjectId: string }
  | { type: "match.started"; playerCount: number; rematch: boolean }
  | { type: "match.finished"; winnerSubjectId: string | null; playerCount: number };

export interface TelemetrySink {
  track(event: PlatformTelemetryEvent): Promise<void>;
}

export interface PlatformServices {
  identity: IdentityProvider;
  entitlements: EntitlementProvider;
  telemetry: TelemetrySink;
}
