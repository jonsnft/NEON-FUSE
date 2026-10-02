# Repository Rules

## Source of truth
GitHub is the durable project memory. Decisions that constrain future implementation belong in `docs/adr/`.

## Branching
- `main`: stable, reviewed state.
- `feature/*`: implementation work.
- `fix/*`: defect work.
- `foundation/*`: architecture/bootstrap changes.

## Commit discipline
Commits should explain one coherent change. Do not commit generated secrets, local credentials, `.env` files or API tokens.

## Pull requests
Every architecture-affecting PR should answer:
- What invariant changes?
- Does this alter server authority?
- Does this alter monetization/fairness?
- Does this create migration risk?
- Is an ADR required?

## Definition of done
- builds
- typechecks
- relevant tests pass
- architecture docs updated if behavior changed
- no secrets committed
