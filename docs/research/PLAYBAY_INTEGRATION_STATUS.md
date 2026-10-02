# PlayBay Integration Status — 2026-10-02

## What is established
Public product messaging describes PlayBay games, creator-sold items, Shells as the in-game spending unit, and creator payouts.

## What is not yet established
No public, verifiable technical contract was found for:
- game identity/authentication handed to an embedded game
- player subject/account identifier
- item catalog registration API
- purchase initiation API
- purchase verification/receipt API
- inventory/entitlement lookup API
- webhook/event signature format
- sandbox/test-mode purchase flow
- game publish/package contract

## Engineering consequence
NEON FUSE must not invent these interfaces.

The game currently exposes:
- a typed cosmetic catalog
- a typed entitlement provider interface
- a local development provider
- presentation metadata separate from deterministic gameplay state

A future PlayBay adapter may implement the provider and purchase UI once the actual contract is available. It must not be imported by `packages/shared/src/sim`.

## Public references checked
- https://playbay.games
- https://openmayhem.ai/
- https://openmayhem.ai/docs

The public OpenMayhem API documentation currently documents inference/media APIs, not a PlayBay game-commerce SDK.
