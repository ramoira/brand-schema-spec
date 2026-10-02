# Voice Component (Layer 3)

Normative source: [`SPEC.md`](../SPEC.md) and [`SPEC.schema.json`](../SPEC.schema.json). This page is a reading guide.

Voice is the **surface-sensitive** layer: how the brand writes, and how that writing shifts by surface without drifting into category norms.

## Top-level shape

- `voice._component`: `'voice'`
- `voice._version`: string
- `voice.base`: base VoiceParameters
- `voice.forbiddenTones`: string[] (absolute, across all surfaces)
- `voice.approvedTones`: string[] (tones the brand can occupy)
- `voice.examples`: VoiceExample[] (approved + rejected)
- `voice.contextVariants`: VoiceVariant[] (per-surface deltas)
- `voice.rails`: PositiveRailSystem (what to do *instead* of forbidden territory)

## Base voice parameters

- `base.sentenceLength`: `short | varied | long | fragments_permitted`
- `base.vocabularyLevel`: Score (1–10)
- `base.humourPermitted`: boolean
- `base.humourStyle`: `dry | self_deprecating | absurdist | warm | irreverent | none`
- `base.permittedDevices`: string[]
- `base.forbiddenDevices`: string[]
- `base.structuralRules`: string[]

## Worked examples

Examples are a high-signal training input.

- `examples[].context`: OutputSurface | string
- `examples[].text`: string
- `examples[].verdict`: `approved | rejected`
- `examples[].reason`: string

## Context variants (surface deltas)

Each variant is a **delta** from base — only specify what changes.

- `contextVariants[].surface`: OutputSurface
- `contextVariants[].formalityDelta`: number
- `contextVariants[].warmthDelta`: number
- `contextVariants[].sentenceLength?`: SentenceLength
- `contextVariants[].openingInstruction`: string
- `contextVariants[].closingInstruction`: string
- `contextVariants[].rails`: Rail[]
- `contextVariants[].additionalForbidden`: string[]
- `contextVariants[].fallbackInstruction`: string

## Positive rails

Rails ensure systems don’t “freeze” when many tactics are forbidden.

- `rails.global`: Rail[]
- `rails.alternatives`: grouped rail sets used when major commercial patterns are disallowed
  - `whenPricingForbidden`
  - `whenUrgencyForbidden`
  - `whenComparativeForbidden`
  - `whenTrendLanguageForbidden`
  - `whenAccessibilityForbidden`
  - `whenPromotionForbidden`

A `Rail` has:

- `context`: when it applies
- `instruction`: what to do
- `example?`: compliant example
- `antiExample?`: non-compliant example
