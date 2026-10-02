# PlayBay integration verification

Status: **BLOCKED ON VERIFIED CONTRACT**

## Known product claims supplied by the project context
The announced PlayBay product uses Shells for in-game spending and describes creator item sales/payouts. These product claims are not sufficient to define an API contract.

## Public contract search — 2026-10-02
No authoritative public developer documentation was found for the OpenMayhem-associated `playbay.games` integration surface.

A separate `playbay.com` service appears in public search results. It is not treated as the same service and must not be used to infer endpoints, authentication, currency semantics or item APIs.

## Integration gate
A production PlayBay adapter may only be implemented after obtaining an authoritative source that specifies at minimum:

1. game/app identity and registration;
2. player identity/authentication token validation;
3. entitlement lookup;
4. item/catalog publication or item identifiers;
5. purchase completion/receipt verification;
6. webhook/event signing, if any;
7. replay/idempotency rules;
8. environment/base URLs;
9. rate limits/error codes;
10. Shell denomination and pricing representation.

## Current behavior
`NEON_FUSE_PLATFORM_MODE=local` uses deterministic local development services.

`NEON_FUSE_PLATFORM_MODE=playbay` fails closed at server startup with an explicit error. This is intentional; it prevents an undocumented platform contract from silently entering production.

## Architecture mapping
PlayBay-specific implementation belongs in `apps/server/src/platform/`.
The shared gameplay simulation must remain unaware of payment rails, balances, purchases, identities and platform HTTP APIs.
