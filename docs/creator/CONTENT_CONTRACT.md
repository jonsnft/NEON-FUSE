# Creator Content Contract

## Principle
Creator content is untrusted declarative data.

NEON FUSE does not accept creator JavaScript, arbitrary Phaser scenes, arbitrary remote URLs, HTML, shaders, native binaries, workflow graphs or executable scripts.

## Creator maps
Version 1 maps contain only:
- id
- version
- displayName
- creatorId
- width / height
- tile array
- spawn points

Validation rules include:
- strict field allowlist;
- odd dimensions from 9 to 31;
- exact tile count;
- hard outer border;
- 2 to 8 unique interior floor spawns;
- at least one exit per spawn;
- spawn connectivity when soft blocks are treated as destructible;
- allowed tile values only.

The validated map can be converted to the same `GameState` used by official matches via `createArenaFromMap`.

## Creator cosmetics
Version 1 submissions contain only:
- id
- displayName
- description
- creatorId
- category
- visualToken
- requestedPriceShells

A creator cannot provide `gameplayEffect`, bonuses, scripts or arbitrary asset URLs.

After approval, conversion to a catalog item always sets:
- rarity: `CREATOR`
- price unit: `shells`
- gameplayEffect: `none`

## Moderation
Moderation state is server-owned:
- draft
- pending
- approved
- rejected

The local repository publishes only approved content.

A future external moderation/storage implementation must preserve the same interface and may not bypass shared validation.
