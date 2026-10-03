import type { EntitlementProvider } from "./EntitlementProvider";

export interface PlatformSubject {
  subjectId: string;
  displayName?: string;
}

export interface IdentityProvider {
  resolveSubject(sessionId: string): Promise<PlatformSubject>;
}

export interface MatchFinishedMetrics {
  durationMs: number;
  totalCorePlacements: number;
  totalPickupsCollected: number;
  chainDetonations: number;
  reachedSuddenDeath: boolean;
  eliminationTimesMs: Array<number | null>;
  spawnEliminations: Array<{ spawnIndex: number; eliminatedAtMs: number | null }>;
}

export type PlatformTelemetryEvent =
  | { type: "player.joined"; subjectId: string }
  | { type: "player.left"; subjectId: string }
  | { type: "match.started"; playerCount: number; rematch: boolean }
  | {
      type: "match.finished";
      winnerSubjectId: string | null;
      playerCount: number;
      metrics: MatchFinishedMetrics;
    };

export interface TelemetrySink {
  track(event: PlatformTelemetryEvent): Promise<void>;
}

export interface PlatformServices {
  identity: IdentityProvider;
  entitlements: EntitlementProvider;
  telemetry: TelemetrySink;
}
