# Narrative — `narrative`

Normative: [`SPEC.md`](../SPEC.md) section 8.2. What the brand means.

## Facts: `semiotic.denotative`

- `categoryDescriptor` (required): what the brand makes or does, plainly.
- `specifications`: checkable facts about the product.
- `claims[]`: **the** list of approved claims, `{claim_id, claim, evidenceRequired, evidenceType, markets, surfaces}`. A `claim_must_be_approved` rule checks every product claim against it, so keep it complete and exact.

## Density

| Field | Holds |
|---|---|
| `semiotic.connotative.{meaningClusters, emotionalRegister}` | The meaning territory the brand owns |
| `myth.{culturalTension, mythStatement, protagonistRole, antagonist}` | The story the brand tells about the world (`mythStatement` required) |
| `mythEvolution.{principle, immutableCore, modernTensions[]}` | How the story meets current tensions; each tension can carry rails |
| `pillars[].{name, description, coreClaim, approvedArcs, surfaces, rails}` | The themes content returns to |
| `editorial.{openingPrinciple, structuralApproach, referencePool, timeScaleLanguage}` | How a piece is built |
| `guidance[].{question, applies_to}` | Test questions you cannot yet illustrate with examples. They guide writers and never produce a finding. |

Forbidden claims, meanings, framings, inversions, structures and references are rules.
