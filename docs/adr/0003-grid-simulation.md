# ADR 0003: Deterministic grid simulation for MVP

Status: Accepted

## Decision
Use discrete grid rules rather than general-purpose rigid-body physics for core gameplay.

## Rationale
The game mechanics are tile-centric. Grid rules are easier to test, synchronize, reproduce and balance.

## Consequences
Matter.js or similar physics engines are not core MVP dependencies. They may be introduced later for purely visual or mode-specific mechanics through an explicit ADR.
