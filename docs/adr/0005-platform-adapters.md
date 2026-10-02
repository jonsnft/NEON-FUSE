# ADR 0005: External platform integrations behind adapters

Status: Accepted

## Decision
PlayBay commerce, identity, entitlements and payout-related integration are isolated behind interfaces/adapters.

## Rationale
The external API contract may evolve and should not contaminate simulation code.

## Consequences
Core game can be developed/tested with local fake adapters. Platform-specific implementation can be added once verified.
