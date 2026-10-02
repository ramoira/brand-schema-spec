# Narrative Component (Layer 2)

Normative source: [`SPEC.md`](../SPEC.md) and [`SPEC.schema.json`](../SPEC.schema.json). This page is a reading guide.

Narrative encodes **meaning**: what the brand literally does and what it stands for, plus the brand story and the rails that protect it.

## Top-level shape

- `narrative._component`: `'narrative'`
- `narrative._version`: string
- `narrative.semiotic`: literal meaning + associative meaning layers
- `narrative.myth`: brand story layer (tension → statement + constraints)
- `narrative.mythEvolution`: how the myth absorbs modern tensions
- `narrative.pillars`: NarrativePillar[]
- `narrative.editorial`: long-form storytelling rules
- `narrative.contentTest`: quick pass/fail questions

## Semiotic layer

- `semiotic.denotative`
  - `categoryDescriptor`: string
  - `functionalClaims`: string[]
  - `specifications`: string[]
  - `forbiddenClaims`: string[]

- `semiotic.connotative`
  - `meaningClusters`: string[]
  - `forbiddenMeanings`: string[]
  - `emotionalRegister`: string
  - `minimumConnotativeTest`: string

- `semiotic.layerHierarchy`: `'connotative_first' | 'balanced' | 'denotative_first'`

## Myth

- `myth.culturalTension`: string
- `myth.mythStatement`: string
- `myth.protagonistRole`: string
- `myth.antagonist`: string
- `myth.mythTest`: string
- `myth.constraints`: MythConstraint[]
  - `constraint`: string
  - `severity`: `ConstraintSeverity` (`absolute` | `strong` | `contextual`)
  - `rationale`: string
  - `example`: string

## Myth evolution

`mythEvolution` allows a stable myth to address new pressures without “trend-chasing”.

- `mythEvolution.principle`: string
- `mythEvolution.modernTensions`: ModernTension[]
  - `tension`: string
  - `mythResolution`: string
  - `permittedFraming`: string[]
  - `forbiddenFraming`: string[]
  - `rails`: Rail[]
- `mythEvolution.immutableCore`: string

## Pillars

Each pillar is a reusable narrative module with surface scoping.

- `pillars[].name`: string
- `pillars[].description`: string
- `pillars[].coreClaim`: string
- `pillars[].approvedArcs`: string[]
- `pillars[].forbiddenInversions`: string[]
- `pillars[].surfaces`: string[]
- `pillars[].rails`: Rail[]

## Editorial guidelines

- `editorial.openingPrinciple`: string
- `editorial.structuralApproach`: string
- `editorial.forbiddenStructures`: string[]
- `editorial.referencePool`: string[]
- `editorial.forbiddenReferences`: string[]
- `editorial.timeScaleLanguage`: string

## Content test

- `contentTest.mythTest`: string
- `contentTest.connotativeTest`: string
- `contentTest.toneTest`: string
