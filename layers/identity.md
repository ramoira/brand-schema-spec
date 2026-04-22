# Identity Component (Layer 1)

Canonical source: `platform/lib/brand-schema/components/identity.ts`

Identity is the **foundational constraint layer**: how the brand *is*, what it *looks like*, and the assets it *owns*.

## Top-level shape

- `identity._component`: `'identity'`
- `identity._version`: string
- `identity.prism`: brand character structure (physique/personality/culture/relationship/reflection/selfImage)
- `identity.distinctiveAssets`: brand-owned assets (visual/sonic/linguistic)
- `identity.summary`: quick-access generation summary

## Key substructures

## Prism

- `prism.physique`
  - `permitted`: string[]
  - `forbidden`: string[]
  - `referenceURL?`: URL
  - `posture`: string

- `prism.personality` (five scored dimensions, 0–10)
  - `sincerity`, `excitement`, `competence`, `sophistication`, `ruggedness`: Score (0–10)
  - `characterBrief`: string

- `prism.culture`
  - `coreValues`: string[]
  - `originNarrative`: string
  - `forbidden`: string[]
  - `sacredBoundary`: string

- `prism.relationship`
  - `mode`: `RelationshipMode`
  - `formality`: Score
  - `pronoun`: `'we' | 'I' | 'brand_name_only'`
  - `warmth`: Score
  - `powerDynamic`: `'brand_leads' | 'equal' | 'customer_leads'`

- `prism.reflection`
  - `depictedArchetype`: string
  - `aspirationalDelta`: Score
  - `forbiddenArchetypes`: string[]
  - `ageSignal`: string

- `prism.selfImage`
  - `feelingDescriptors`: string[]
  - `identityStatement`: string
  - `forbidden`: string[]

## Distinctive assets

Distinctive assets are intended to be **machine-enforceable** (exact colors/phrases, etc.).

- `distinctiveAssets.visual`
  - `primaryColor`: `Constrained<HexColor>`
  - `secondaryColors`: HexColor[]
  - `forbiddenColors`: HexColor[]
  - `logoUsage`: minimum clear space + forbidden backgrounds + forbidden modifications
  - `iconography`: string[]
  - `characterAssets`: string[]
  - `photographyStyle`: permitted/forbidden + lighting mood

- `distinctiveAssets.sonic`
  - `sonicLogoURL?`: URL
  - `permittedGenres`: string[]
  - `forbiddenGenres`: string[]
  - `tempoRange`: `[BPM, BPM]`
  - `instrumentalMood`: string

- `distinctiveAssets.linguistic`
  - `ownedPhrases`: `Constrained<string>[]`
  - `ownedWords`: string[]
  - `forbiddenWords`: `Constrained<string>[]`
  - `typographicVoice`: sentence structure + punctuation style + numeral style

## Summary

`identity.summary` is the “fast path” for generation systems:

- `oneLineBrief`: string
- `threeAdjectives`: string[]
- `neverDo`: string[]

## RelationshipMode enum

Identity defines a relationship-mode enum used for generation posture:

- `peer`
- `kind_friend`
- `coach`
- `mentor`
- `servant_to_exceptional`
- `fellow_activist`
- `entertainer`
- `challenger`
