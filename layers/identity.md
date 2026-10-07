# Identity — `identity`

Normative: [`SPEC.md`](../SPEC.md) section 8.1. Who the brand is.

## `prism` (density)

The six facets of Kapferer's brand identity prism, used as a layout.

| Facet | Fields |
|---|---|
| `physique` | `permitted`, `posture`, `referenceURL` |
| `personality` | `characterBrief`: one sentence a writer can picture |
| `culture` | `coreValues`, `originNarrative`, `sacredBoundary` (private unless you opt it into the summary) |
| `relationship` | `formality`, `warmth`: integers on the shared anchored scales |
| `reflection` | `depictedCustomer`, `ageSignal` |
| `selfImage` | `feelingDescriptors`, `identityStatement` |

Things the prism must never be or show are rules (usually `judged_bounded`), not lists here.

## `distinctiveAssets` (facts)

| Asset | Fields | Checked by |
|---|---|---|
| `visual` | `primaryColor`, `secondaryColors`, `logoUsage.minimumClearSpace`, `iconography`, `characterAssets`, `photographyStyle.{permitted, lightingMood}` | `modality: visual` rules (forbidden colours, logo misuse) |
| `sonic` | `sonicLogoURL`, `permittedGenres`, `instrumentalMood` | `modality: audio` rules (tempo, forbidden genres) |
| `linguistic` | `ownedPhrases`, `ownedWords`, `typographicVoice.{sentenceStructure, punctuationStyle, numeralStyle}` | exact rules on misquoted phrases; structural rules on punctuation and numerals |

## Removed in 3.0.0

Personality dimension scores, `relationship.mode`, `pronoun` (now a rule), `powerDynamic`, `aspirationalDelta`, and `identity.summary`.
