# Economy & Item Rules

## Principle
Monetization sells identity, expression and prestige — not competitive power.

## Sellable cosmetic categories
- Avatar skins
- Energy Core skins
- Blast / explosion visual effects
- Movement trails
- Emotes
- Victory animations
- Profile frames / titles
- Arena visual themes where they do not alter collision/readability

## Never sell
- Blast range
- Extra core capacity
- Movement speed
- Shields
- Spawn advantages
- Better matchmaking placement
- Hidden information
- Any stat that affects match outcome

## Item catalog model
Every item should eventually have:
- stable item ID
- category
- display name
- description
- rarity label (display only)
- asset references
- price in platform spending units
- creator attribution
- availability window
- compatibility/version
- moderation state

## Initial rarity vocabulary
COMMON / RARE / EPIC / LEGENDARY / CREATOR / EVENT

Rarity must not imply gameplay advantage.

## Platform boundary
PlayBay/Shells/TNK/TAP/Stripe integration must live behind a platform adapter. No game simulation code may depend directly on a payment rail.

The exact external commerce API contract must be verified before implementation.
