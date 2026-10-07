# Voice — `voice`

Normative: [`SPEC.md`](../SPEC.md) section 8.3. How the brand writes.

## Base

- `base.vocabularyLevel` (required): shared anchored scale, 0–10.
- `base.humourStyle` (required): `{style, frequency?}`. `style: "none"` means no humour.
- `base.permittedDevices`.
- `approvedTones` (at least one).

Forbidden tones and devices, sentence length and structural rules are rules.

## Examples — your judgment, on the record

```json
{ "example_id": "ex_…", "surface": "social_organic", "text": "…",
  "verdict": "approved | rejected", "reason": "…",
  "judged_by": "brand_owner", "source": "authored", "captured_at": "2026-10-05" }
```

Examples are what judged rules cite. Write the `reason` for the writer who will read it: what makes this one right or wrong. `judged_by` records who actually made the call. Only `brand_owner` and `brand_team` examples can ground a finding once the schema is ratified; a producer's or a template's examples can guide, but not decide.

## Context variants

One per surface, each a delta from the base: `formalityDelta`, `warmthDelta` (the result must stay within 0–10), `sentenceLength`, `openingInstruction`, `closingInstruction`, `rails`, `fallbackInstruction`.

## Rails

`{rail_id, context, instruction, example?, antiExample?}`: what to do *instead* when much is forbidden. `rails.global` applies everywhere; `rails.alternatives.when…Forbidden` (e.g. `whenUrgencyForbidden`) gives the alternative when a tactic is ruled out. A rail with both an example and an anti-example is rubric material a judged rule can cite.
