import { LocalEntitlementProvider } from "./LocalEntitlementProvider";
import type {
  IdentityProvider,
  PlatformServices,
  PlatformSubject,
  PlatformTelemetryEvent,
  TelemetrySink
} from "./PlatformServices";

class LocalIdentityProvider implements IdentityProvider {
  async resolveSubject(sessionId: string): Promise<PlatformSubject> {
    return { subjectId: sessionId };
  }
}

class NoopTelemetrySink implements TelemetrySink {
  async track(_event: PlatformTelemetryEvent): Promise<void> {
    // Intentionally empty in local development mode.
  }
}

export const createLocalPlatformServices = (): PlatformServices => ({
  identity: new LocalIdentityProvider(),
  entitlements: new LocalEntitlementProvider(),
  telemetry: new NoopTelemetrySink()
});
