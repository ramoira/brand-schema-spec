# Layer / Component Reference

This folder documents the **canonical Ramoira brand schema** as implemented in `platform/lib/brand-schema`.

## Components

A full schema is composed of five components plus `meta`:

- `meta` — brand identity + versioning metadata
- `identity` — brand character structure + distinctive assets (hard constraints)
- `narrative` — meaning layers + brand story + pillars (meaning constraints)
- `voice` — base voice parameters + examples + surface variants + positive rails
- `commercial` — pricing/claims/offers/social-proof rules (conversion constraints)
- `governance` — severity registry + conflict resolution + surface rules + compliance

## How to use these docs

- For **field-level types**, treat the TypeScript sources as the source of truth:
  - `platform/lib/brand-schema/components/identity.ts`
  - `platform/lib/brand-schema/components/narrative.ts`
  - `platform/lib/brand-schema/components/voice.ts`
  - `platform/lib/brand-schema/components/commercial.ts`
  - `platform/lib/brand-schema/components/governance.ts`
  - Shared primitives: `platform/lib/brand-schema/types.ts`
- For **which sections to load per surface**, see the surface manifest:
  - `platform/lib/brand-schema/surfaces/manifest.ts`

## Files

- `identity.md`
- `narrative.md`
- `voice.md`
- `commercial.md`
- `governance.md`
