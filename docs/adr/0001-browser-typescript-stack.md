# ADR 0001: Browser-first TypeScript stack

Status: Accepted

## Decision
Use TypeScript for client, server and shared packages. Use Phaser for client rendering/input and Colyseus for authoritative room/state multiplayer.

## Rationale
A single language lowers iteration cost, shared types reduce protocol drift, Phaser is specialized for browser games, and Colyseus provides room/state abstractions suited to multiplayer game servers.

## Consequences
- Shared types and pure rules can be reused client/server.
- Browser is the primary runtime target.
- Engine-specific APIs must stay out of core simulation where possible.
