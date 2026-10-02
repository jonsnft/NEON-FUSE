import { createLocalPlatformServices } from "./LocalPlatformServices";
import type { PlatformServices } from "./PlatformServices";

export type PlatformMode = "local" | "playbay";

export function createPlatformServices(
  mode: PlatformMode = (process.env.NEON_FUSE_PLATFORM_MODE as PlatformMode | undefined) ?? "local"
): PlatformServices {
  if (mode === "local") return createLocalPlatformServices();

  if (mode === "playbay") {
    throw new Error(
      "PlayBay platform mode is not available: no verified public integration contract is present. " +
      "See docs/integrations/PLAYBAY_VERIFICATION.md."
    );
  }

  throw new Error(`Unsupported NEON_FUSE_PLATFORM_MODE: ${String(mode)}`);
}
