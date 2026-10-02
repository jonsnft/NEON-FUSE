# Phase 9 Preflight Audit — 2026-10-02

## Scope
Create reproducible release packaging for the already verified client/server architecture.

## Current gap
The repository builds successfully, but deployment still depends on manually reconstructing the runtime:
- browser client requires a Vite production build;
- authoritative server currently runs from TypeScript via `tsx`;
- no versioned container definitions exist;
- no compose-level full-stack smoke topology exists.

## External capability verification
Current Colyseus source applies default CORS headers to matchmaking HTTP routes, so serving the browser client and authoritative game server on different origins/ports is a supported topology.

## Architecture verdict
**No ADR change required.**

Packaging preserves the existing topology:
```
static browser client -> authoritative Colyseus server
```

It does not combine client and server responsibilities and does not introduce a hosting provider.

## Packaging decisions
- separate client and server images;
- client game-server URL remains a Vite build argument;
- server image runs the existing `@neon-fuse/server start` command;
- Compose is a local/reproducible release smoke environment, not production infrastructure;
- PlayBay mode remains disabled/fail-closed.

## Constraints
- no credentials in images;
- no hard-coded production hostnames;
- no payment/platform endpoints;
- container build must be exercised by CI.
