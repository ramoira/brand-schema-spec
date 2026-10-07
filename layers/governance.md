# Governance — `governance`

Normative: [`SPEC.md`](../SPEC.md) sections 8.5 and 9. How the brand operates its schema. Excluded from the public summary unless the brand opts in.

| Field | Holds |
|---|---|
| `conflictResolution.{componentPriority, knownConflicts, defaultResolution}` | What wins when two layers pull apart |
| `situations[]` | Circumstances the brand responds to (below) |
| `surfaces[].{surface, objective, primaryRail, rails, fallback, fallbackContent, intentRules, suspended_rule_ids}` | Per-surface behaviour. `suspended_rule_ids` may name only contextual rules. |
| `override.{authorisedRoles, requiredFields, maxDurationDays, overrideProcess, judgmentBounds}` | Who may clear a strong finding, and how. Overrides are recorded in the verification record. |
| `reviewTopics` | Topics that always go to a human |

## Situations: when, not where

A surface is *where* content appears. A situation is *when*: a recall, an accusation, a competitor's claim, unexpected praise, a partner's request.

```json
{ "situation_id": "sit_…", "trigger": "…", "category": "crisis",
  "posture": "…", "surfaces": ["press_release"],
  "voice": { "persona": "restrained", "formalityDelta": 2 },
  "rails": [], "suspended_rule_ids": [] }
```

Rules can be scoped to situations (`"situations": ["sit_…"]`). The brand activates a situation for a period; a producer never declares one per item.

## Not here any more

The severity registry (each rule carries its severity), webhooks and routing (integration configuration), preflight questions (rules or guidance), and per-component versions.
