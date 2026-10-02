> **SUPERSEDED — 2026-10-02.** This roadmap describes the pre-v3 plan (April 2026) and is kept for history only. Its premises — platform v2.0.0 as ground truth, Studio certification, `certified`/`confidence`, the v2 tier model, Rolex as the reference implementation — no longer apply. Ramoira is moving to Brand Schema Spec 3.0.0, and a new roadmap will replace this one. Do not take tasks, priorities or "ground truth" from this file.

# brand-schema-spec — Roadmap

> Goal: the open standard reflects what the platform actually implements. Rolex schema is the reference implementation.
> Cross-repo context: [cli/ROADMAP.md](../cli/ROADMAP.md)

**Last updated:** 2026-04-24

---

## Progress

| Task | Status |
|:---|:---|
| 1.1 Rewrite SPEC.md | ✅ Done |
| 1.2 Rebuild SPEC.schema.json | ✅ Done |
| 1.3 Rebuild SPEC.summary.schema.json | ✅ Done |
| 1.4 Rewrite blank templates | ✅ Done |
| 1.5 Fix Little Rituals example | ✅ Done |
| 1.6 Populate minimal example | ✅ Done |
| 1.7 Add llms.txt to each example | ✅ Done |

---

## Ground truth sources

Read these, don't invent:
- `platform/lib/brand-schema/components/` — all 5 component type definitions
- `platform/lib/brand-schema/types.ts` — OutputSurface (17), UserIntent (8), ConstraintSeverity, FallbackBehaviour, Constrained<T>, Rail
- `platform/lib/brand-schema/rolex/schema.v2.ts` — reference implementation

---

## 1.1 — Rewrite SPEC.md ✅

**File:** `SPEC.md`

Replace the v1.0 flat-field documentation with the v2.0.0 component architecture. Completed.

---

## 1.2 — Rebuild SPEC.schema.json ✅

**File:** `SPEC.schema.json`

Replaced the v1.0 schema with full v2.0.0 component validation. Enforces:

- Required top-level keys: `meta`, `identity`, `narrative`, `voice`, `commercial`, `governance`
- `_component` constant and `_version` string on each component
- `RelationshipMode` enum (8 values) on `identity.prism.relationship.mode`
- `PricingStyle` enum (5 values) on `commercial.pricing.style`
- `ConstraintSeverity` enum (`absolute | strong | contextual`) on all Constrained fields
- `FallbackBehaviour` enum (4 values) on governance and commercial surface rules
- `OutputSurface` enum (17 values) on `contextVariants[].surface`, `surfaceRules[].surface`
- `SentenceLength` enum (4 values) on `voice.base.sentenceLength`
- `HumourStyle` enum (6 values) on `voice.base.humourStyle`
- `VoiceExample.verdict` enum (`approved | rejected`)
- `LayerHierarchy` enum (`connotative_first | balanced | denotative_first`)
- `UserIntent` enum (8 values) on `governance.surfaceRules[].intentRules[].intent`

---

## 1.3 — Rebuild SPEC.summary.schema.json ✅

**File:** `SPEC.summary.schema.json`

Policy: the summary contains what the brand **stands for**. Operational fields (colors, context variants, rails, commercial, governance) are excluded.

Uses `additionalProperties: false` throughout — a document containing operational fields fails validation.

**Included:**
- `meta`: brandId, brandName, schemaVersion, schemaType (const `"summary"`), canonicalURL, certified, confidence
- `identity.summary`: oneLineBrief, threeAdjectives (exactly 3), neverDo
- `identity.prism.relationship`: mode (RelationshipMode enum), formality, warmth
- `narrative.semiotic.denotative`: categoryDescriptor only
- `narrative.semiotic.connotative`: meaningClusters, emotionalRegister
- `narrative.myth`: mythStatement, mythTest
- `narrative.contentTest`: mythTest, connotativeTest, toneTest
- `voice.base`: sentenceLength, vocabularyLevel, humourPermitted, humourStyle
- `voice.approvedTones`, `voice.forbiddenTones`
- `voice.examples`: min 4 items, min 2 approved + min 2 rejected (enforced via `minContains`)

**Explicitly excluded:** `distinctiveAssets`, `layerHierarchy`, `minimumConnotativeTest`, `structuralRules`, `contextVariants`, `rails`, `commercial`, `governance`, all operational sub-fields.

---

## 1.4 — Rewrite blank templates ✅

**Files:** `schemas/brand.schema.json`, `schemas/brand.schema.summary.json`

Full template: all 5 components with `_component`/`_version`, empty/zero placeholder values. Structure matches SPEC.schema.json.

Summary template: only the fields included in the summary schema. Operational fields removed. Matches SPEC.summary.schema.json structure exactly.

---

## 1.5 — Fix Little Rituals example

**Files:** `examples/little-rituals/brand.schema.json`, `examples/little-rituals/brand.schema.summary.json`

Already has good content depth. Needs:
- Add `_version: "2.0.0"` to all 5 components
- Update `meta` to v2.0.0 structure (add effectiveDate, previousVersion, changelog; move or drop v1.0 meta fields)
- Add `governance.surfaceRules[].intentRules` (gap vs. Rolex reference)
- Add `governance.compliance.geographicOverrides` if applicable
- Expand `contextVariants` to cover `paid_landing_page` and `product_detail_page`
- Update summary to pass SPEC.summary.schema.json (strip operational fields, add `prism.relationship`, add `meta.certified`/`confidence`)

---

## 1.6 — Populate minimal example

**Files:** `examples/minimal/`

Currently empty. Add the smallest valid v2.0.0 schema that passes SPEC.schema.json validation. Every required field present, no optional fields, no placeholder empty strings.

---

## 1.7 — Add llms.txt to each example

**Directories:** `examples/little-rituals/`, `examples/minimal/`, `examples/rolex/`

Each example directory gets an `llms.txt` describing how an LLM should load and use the schema.
