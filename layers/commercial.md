# Commercial Component (Layer 4)

Canonical source: `platform/lib/brand-schema/components/commercial.ts`

Commercial makes conversion constraints explicit: what pricing/claims/offers/proof patterns are allowed, and how to handle high-risk surfaces.

## Top-level shape

- `commercial._component`: `'commercial'`
- `commercial._version`: string
- `commercial.pricing`: PricingRules
- `commercial.claims`: ClaimsRules
- `commercial.offers`: OfferRules
- `commercial.socialProof`: SocialProofRules
- `commercial.surfaceRules`: SurfaceCommercialRule[]
- `commercial.globalForbiddenTerms`: `Constrained<string>[]`

## Pricing rules

- `pricing.style`: `opaque | transparent | anchored | value_led | simple`
- `pricing.priceDisplayPermitted`: boolean
- `pricing.displayFormat?`: string
- `pricing.surfaceOverrides?`: per-surface overrides
- `pricing.urgencyLanguagePermitted`: boolean
- `pricing.scarcityLanguagePermitted`: boolean
- `pricing.discountPermitted`: boolean
- `pricing.maxDiscountPercent?`: number
- `pricing.permittedLanguage`: string[]
- `pricing.forbiddenLanguage`: `Constrained<string>[]`

## Claims rules

- `claims.approved`: ApprovedClaim[]
  - `claim`: string
  - `evidenceRequired`: boolean
  - `evidenceType?`: string
  - `geographicScope`: string[]
  - `surfaces`: OutputSurface[] | `all`

- `claims.forbidden`: `Constrained<string>[]`

- `claims.comparative`
  - `competitorMentionPermitted`: boolean
  - `comparativeClaimsPermitted`: boolean
  - `permittedCompetitors?`: string[]
  - `forbiddenFramings`: string[]

- `claims.superlatives`
  - `permitted`: boolean
  - `approved`: string[]
  - `forbidden`: string[]

## Offer rules

- `offers.permittedTypes`: OfferType[]
- `offers.forbiddenTypes`: `Constrained<OfferType>[]`
- `offers.communicationRules`: urgency/scarcity + value-framing

## Social proof rules

- `socialProof.starRatingsPermitted`: boolean
- `socialProof.reviewCountsPermitted`: boolean
- `socialProof.customerTestimonialsPermitted`: boolean
- `socialProof.celebrityEndorsementStyle?`: string
- `socialProof.permittedAuthoritySignals`: string[]
- `socialProof.forbiddenSocialProof`: string[]

## Surface commercial rules

`surfaceRules[]` override base commercial settings for specific surfaces.

- `surface`: OutputSurface
- `pricing`: Partial<PricingRules>
- `fallback`: FallbackBehaviour
- `alternativeApproach`: string
- `rails`: Rail[]
