# Ramoira Brand Schema Specification

**Version 3.0.0**

3.0.0 is a breaking release. Upgrading from 2.0.0: see [`migrations/2.0.0-to-3.0.0.md`](migrations/2.0.0-to-3.0.0.md).

---

## 1. What this is

A Ramoira brand schema is a structured, versioned, agent-readable statement of what a brand means and what it will not say. Producers (agencies, freelancers, in-house teams and AI systems) read it to write on-brand content. A verifier reads it to check content against it.

A schema has two halves:

- **Rules** (the `rules` registry): what can be checked. Each rule has an id, a check class and a severity, so a finding can cite it. Only rules can produce a verdict.
- **Layers** (`identity`, `narrative`, `voice`, `commercial`, `governance`): the facts rules check against (approved claims, specifications, owned phrases) and the density producers write from (myth, tone, examples, rails). Nothing in a layer produces a verdict.

Three principles hold throughout:

1. **A schema carries meaning, never results.** No field anywhere holds a certification, a confidence or trust score, a conformance rate, an expiry or a density score. Results about content live in a verification record, kept by the verifier, never in a file the checked party can edit. `certified` and `confidence` are removed in 3.0.0.
2. **A generated schema is a candidate until the brand ratifies it.** Drafting tools, Ramoira's included, propose; the brand decides. Publishing a summary does not ratify a schema.
3. **Open and identical at every tier.** Every field exists in every tier. What a brand chooses to *publish* can vary; what it can *hold* cannot.

---

## 2. Normative sources

This document and the JSON Schemas in this repository define the format:

| File | Defines |
|---|---|
| [`SPEC.schema.json`](SPEC.schema.json) | Full schemas (`schema_type: full`) and archetype templates (`schema_type: archetype`) |
| [`SPEC.summary.schema.json`](SPEC.summary.schema.json) | Public summaries (`schema_type: summary`) |
| [`record.schema.json`](record.schema.json) | The verification record: verdict events and adoption records (section 13) |
| [`validation/`](validation/) | The reference validator, which enforces the invariants JSON Schema cannot express (section 12) |

Implementations, Ramoira's own included, conform to the spec. Where an implementation disagrees with it, the implementation is wrong; report the discrepancy as an issue on this repository.

---

## 3. Document kinds

| `schema_type` | What it is | Where it lives |
|---|---|---|
| `full` | The brand's own schema: every rule, all five layers, and how it was drafted | The brand's project (`ramoira/brand.schema.json`). `ramoira publish` sends it to Ramoira, which stores it privately and serves only the summary. |
| `summary` | The public extract (section 11) | `ramoira.com/brands/[slug]/schema.summary.json`: public, crawlable, free |
| `archetype` | A drafting template: one archetype filled at archetype level, plus the questions that adapt it to a brand (section 10) | Inside a drafting instrument. Never ratifiable, never published under `/brands/`. |

---

## 4. Top-level shape

```json
{
  "ramoira":          { },
  "rules":            [ ],
  "identity":         { },
  "narrative":        { },
  "voice":            { },
  "commercial":       { },
  "governance":       { },
  "draft_provenance": { },
  "archetype":        { }
}
```

- `ramoira`, `rules` and the five layers are required in a full schema and an archetype template.
- `draft_provenance` is optional and never appears in a summary.
- `archetype` appears only when `schema_type` is `archetype`.
- No other top-level key is allowed. Every object the spec defines is closed (`additionalProperties: false`), so no result-bearing field can be added anywhere.

### 4.1 `content_hash`

```
content_hash = "sha256:" + hex(SHA-256(JCS({rules, identity, narrative, voice, commercial, governance})))
```

JCS is the JSON Canonicalization Scheme, [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785). Key order and whitespace never change the hash; any change to meaning does.

The hash covers **brand meaning only**. `ramoira`, `draft_provenance` and `archetype` are process metadata and sit outside it: changing the workflow state, a publishing choice or a drafting note does not create a new version.

`content_hash` is the version. `schema_version` is a human label. A verdict binds to a `content_hash`; when the schema changes, the hash changes and earlier verdicts stay attached to the old hash.

In a summary, `content_hash` is the hash of the full schema the summary was extracted from. It cannot be recomputed from the summary.

Compute it with `npm run hash -- <file> --write`.

---

## 5. Metadata — `ramoira`

```json
"ramoira": {
  "spec_version":           "3.0.0",
  "schema_type":            "full",
  "brand_id":               "corvane",
  "schema_version":         "1.0.0",
  "content_hash":           "sha256:…",
  "workflow_state":         "in_review",
  "ratification":           null,
  "account_owner_verified": false,
  "canonical_url":          null,
  "summary_opt_in":         []
}
```

| Field | Meaning | Constraint |
|---|---|---|
| `spec_version` | The spec version the file follows | `"3.0.0"` |
| `schema_type` | `full`, `summary` or `archetype` | `archetype` ⇒ `brand_id`, `ratification` and `canonical_url` are `null` |
| `brand_id` | The brand's slug | |
| `schema_version` | A human label only | Versioning truth is `content_hash` |
| `content_hash` | Section 4.1 | Must recompute (full and archetype) |
| `workflow_state` | Publication lifecycle: `draft`, `in_review`, `published`, `archived` | Never encodes ratification or certification. There is no `certified` state. |
| `ratification` | `null`, or a pointer `{ratification_id, ratified_hash, ratified_at, ratifier_role}` | A pointer only; the verifier's record holds the authoritative ratification. Valid only if `ratified_hash == content_hash`; otherwise the file is an unratified edit of a ratified version. |
| `account_owner_verified` | The account controls this slug (renamed from `owner_verified`) | Never read as ratification |
| `canonical_url` | Where the published summary lives | |
| `summary_opt_in` | Default-excluded material the brand chooses to publish: `commercial`, `governance`, `sacred_boundary` | Optional in a full schema; required in a summary. Identical options at every tier. |

**What a ratification needs.** A non-null `ratification` is valid only if every rule inherited from a drafting template has been affirmed by the brand, and every example a rule cites as rubric material was judged by the brand (section 12, invariant 5). How a ratification is recorded is defined by Ramoira's ratification process, not by this file.

---

## 6. The rule registry — `rules`

Every prohibition and requirement lives once, here. Layers do not repeat them.

### 6.1 The rule object

```json
{
  "rule_id":     "r_warranty_wording",
  "statement":   "Never call the warranty lifetime. It is 25 years.",
  "check_class": "deterministic_exact",
  "severity":    "strong",
  "topic":       "narrative.denotative.claims",
  "surfaces":    "all",
  "markets":     "all",
  "situations":  "any",
  "modality":    "text",
  "visibility":  "public",
  "rationale":   "The warranty terms say 25 years.",
  "match":       { "terms": ["lifetime warranty"], "mode": "phrase", "normalization": "casefold_nfkc" },
  "provenance":  "authored",
  "affirmed":    true
}
```

| Field | Meaning |
|---|---|
| `rule_id` | Stable and unique within the schema. Findings cite it. |
| `statement` | The rule in plain language |
| `check_class` | How the rule is checked (6.2) |
| `severity` | `absolute`, `strong` or `contextual` (6.3) |
| `topic` | Dot path naming what the rule is about, e.g. `commercial.pricing.urgency` |
| `surfaces` | `"all"` or a list of `OutputSurface` values (Appendix A) |
| `markets` | `"all"` or a list of market codes |
| `situations` | `"any"` or a list of `situation_id`s (section 9.2) |
| `modality` | `text`, `visual` or `audio`. A text-only verifier returns `not_evaluable` for visual and audio rules, honestly. |
| `visibility` | `public` or `private`. Governs the public summary only (section 11). By convention `private` for `commercial.*` and `governance.*` topics and `public` otherwise; the brand can change either, identically at every tier. |
| `rationale` | Why the rule exists (optional) |
| `match` / `predicate` / `rubric` | Exactly one, by check class (6.2) |
| `provenance` | `authored` (the brand wrote it), `adapted` (edited from a template) or `inherited` (taken from a template unchanged) |
| `affirmed` | Whether the brand has affirmed the rule. A schema cannot be ratified while any rule is `inherited` and not `affirmed`. |

All fields except `rationale` are required, so two schemas that mean the same thing hash the same.

### 6.2 Check classes

| `check_class` | Required | Not allowed | A violation reports |
|---|---|---|---|
| `deterministic_exact` | `match`: non-empty `terms`, a `mode` (`substring`, `word`, `phrase`) and a `normalization` (`casefold_nfkc`, `exact`) | `predicate`, `rubric` | The matched span |
| `deterministic_structural` | `predicate`: `{type, params}` | `match`, `rubric` | The structural condition that failed |
| `judged_bounded` | `rubric`: `{question, example_refs, rail_refs}` citing **at least one approved and one rejected** example, or **a rail with both an `example` and an `antiExample`** | `match`, `predicate` | A quoted span plus the cited rubric material; otherwise the finding is `void` |

There is **no `advisory_only` rule**. Advice that cannot produce a verdict is density and lives in the layers (for example `narrative.guidance`).

**Predicates.** `predicate.type` names a structural check. Predicates this spec names:

| `type` | `params` | Checks |
|---|---|---|
| `claim_must_be_approved` | `{against: "/narrative/semiotic/denotative/claims"}` | Every product claim is an approved claim, within its markets and surfaces |
| `max_number` | `{field, max}` | An extracted number (e.g. `discount_percent`) stays at or below `max` |
| `required_phrase_on_surface` | `{phrase}` | A phrase is present (scope it with `surfaces`) |
| `self_reference_form` | `{form: "we" \| "I" \| "brand_name_only", brand_name}` | How the brand refers to itself |
| `max_character_count` | `{character, max}` | e.g. no exclamation marks |
| `max_sentence_words` | `{max}` | Sentence length |
| `tempo_range` | `{min_bpm, max_bpm}` | Audio tempo (`modality: audio`) |

The vocabulary is open. A verifier that does not implement a predicate returns `not_evaluable` for that rule; it never skips it silently.

### 6.3 Severity

Severity is the only enforcement setting. The response follows from it and is not stored, so the two can never disagree:

| `severity` | Violation response | Effect on the item |
|---|---|---|
| `absolute` | block | The item fails |
| `strong` | flag for review | The item needs review unless the brand's override clears it |
| `contextual` | log | The item may pass with a logged finding |

### 6.4 Where v2's rule material went

Every v2 list of forbidden things (forbidden words, claims, tones, devices, framings, structures, references, zero-tolerance terms, severity-registry strings, per-surface `additionalForbidden`, the `*Permitted: false` flags) becomes rules. The field-by-field table is in the migration guide.

---

## 7. Draft provenance — `draft_provenance`

How the candidate was produced. Outside `content_hash`. Never a score of the brand. Never in a summary.

```json
"draft_provenance": {
  "method": "archetype_anchored",
  "instrument_version": "…",
  "intake": { "name": "…", "category": "…", "description": "…", "founded": "2014", "source_documents": [] },
  "participants": [ { "participant_id": "p_owner", "role": "brand_owner" } ],
  "closeness_ratings": [ { "archetype_id": "…", "closeness": 0.7 } ],
  "anchors": [ { "archetype_id": "…", "closeness": 0.7, "exemplars_shown": [] } ],
  "delta_answers": [
    { "zone_id": "dz_effort", "field": "/narrative/mythEvolution/modernTensions",
      "question": "…", "answer": "…", "answered_by": "p_owner" }
  ],
  "fields": { "/narrative/mythEvolution/modernTensions": "adapted", "/identity/distinctiveAssets/sonic/sonicLogoURL": "unfilled" },
  "reactions": [
    { "probe_id": "probe_pdp_1", "surface": "product_detail_page", "text": "…",
      "reaction": "no", "reason": "…", "answered_by": "p_owner", "captured_at": "2026-10-05",
      "resulted_in": { "fields": [], "example_ids": ["ex_pdp_gadget"] } }
  ]
}
```

| Field | Meaning |
|---|---|
| `method` | `archetype_anchored`, `questionnaire`, `document_import` or `manual` |
| `participants` | Who took part, and in what role: `brand_owner`, `brand_team`, `agency`, `freelancer`, `ramoira_facilitator` |
| `closeness_ratings`, `anchors` | The owner's rated closeness to archetypes; up to two anchors seeded the draft. The closeness scale is not fixed by 3.0.0. |
| `delta_answers` | Answers that adapted the template, each tied to the field it changed (a JSON pointer) and to who answered |
| `fields` | JSON pointer → `inherited`, `adapted`, `authored`, `affirmed` or `unfilled`. `unfilled` fields are shown at ratification as thinness. |
| `reactions` | The owner's verdicts on elicitation probes, and what each changed |

**Probes are not content.** A probe text exists only to draw out the owner's judgment. It is kept here as evidence of that judgment and is never delivered or exported as copy.

**Who answered matters.** Only examples judged by `brand_owner` or `brand_team` can ground a verdict in a ratified schema. An example promoted from a reaction carries the role of the participant who reacted (invariant 11).

---

## 8. The five layers

Layers carry facts and density. They hold no prohibitions: those are rules.

### 8.1 `identity`

| Field | Kind | Notes |
|---|---|---|
| `prism.physique.{permitted, posture, referenceURL}` | Density | Brand identity prism (Kapferer), used as a layout |
| `prism.personality.characterBrief` | Density | |
| `prism.culture.{coreValues, originNarrative, sacredBoundary}` | Density | `sacredBoundary` is excluded from the summary unless opted in. To have it checked, restate it as a rule. |
| `prism.relationship.{formality, warmth}` | Density | Values on the shared anchored scales (section 8.6); the reference axes that context-variant and situation deltas move along |
| `prism.reflection.{depictedCustomer, ageSignal}` | Density | `depictedCustomer`: the customer the brand depicts |
| `prism.selfImage.{feelingDescriptors, identityStatement}` | Density | |
| `distinctiveAssets.visual.{primaryColor, secondaryColors, logoUsage.minimumClearSpace, iconography, characterAssets, photographyStyle.{permitted, lightingMood}}` | Facts | Forbidden colours, logo misuse and photography → `modality: visual` rules |
| `distinctiveAssets.sonic.{sonicLogoURL, permittedGenres, instrumentalMood}` | Facts | Tempo and forbidden genres → `modality: audio` rules |
| `distinctiveAssets.linguistic.{ownedPhrases, ownedWords, typographicVoice}` | Facts / density | Misquoting an owned phrase is checked by an exact rule on the altered forms |

### 8.2 `narrative`

| Field | Kind | Notes |
|---|---|---|
| `semiotic.denotative.{categoryDescriptor, specifications}` | Facts | `categoryDescriptor` required |
| `semiotic.denotative.claims[]` | Facts | `{claim_id, claim, evidenceRequired, evidenceType, markets, surfaces}`. The one list of approved claims; `claim_must_be_approved` rules check against it. |
| `semiotic.connotative.{meaningClusters, emotionalRegister}` | Density | Both required |
| `myth.{culturalTension, mythStatement, protagonistRole, antagonist}` | Density | `mythStatement` required |
| `mythEvolution.{principle, immutableCore, modernTensions[].{tension, mythResolution, permittedFraming, rails}}` | Density | |
| `pillars[].{name, description, coreClaim, approvedArcs, surfaces, rails}` | Density | |
| `editorial.{openingPrinciple, structuralApproach, referencePool, timeScaleLanguage}` | Density | |
| `guidance[]` | Density | `{question, applies_to}`: test questions that have no brand-judged examples yet, so cannot be judged rules. They never produce a verdict. |

### 8.3 `voice`

| Field | Kind | Notes |
|---|---|---|
| `base.vocabularyLevel` | Density | Shared anchored scale (8.6). Required. |
| `base.humourStyle` | Density | `{style, frequency?}`. Open vocabulary (`none`, `dry`, `warm`, `absurdist`, …); `none` means humour is not permitted. Required. |
| `base.permittedDevices` | Density | |
| `approvedTones` | Density | At least one |
| `examples[]` | Rubric material and density | See below |
| `contextVariants[].{surface, formalityDelta, warmthDelta, sentenceLength, openingInstruction, closingInstruction, rails, fallbackInstruction}` | Density | Deltas move along the shared scales and must keep the result within 0–10 |
| `rails.{global, alternatives.when…Forbidden}` | Density; rubric material when a rail has both `example` and `antiExample` | |

**The example object** is where the brand's own judgment enters the schema:

```json
{
  "example_id":  "ex_pdp_gadget",
  "surface":     "product_detail_page",
  "text":        "The kitchen hack you need: one pan that does it all with zero effort.",
  "verdict":     "rejected",
  "reason":      "Gadget framing and a promise of no effort.",
  "judged_by":   "brand_owner",
  "source":      "owner_reaction",
  "captured_at": "2026-10-05"
}
```

- `judged_by`: `brand_owner`, `brand_team`, `agency`, `freelancer`, `ramoira_facilitator`, `archetype_template` or `ramoira_draft`.
- `source`: `authored`, `owner_reaction`, `inherited` or `imported_document`.
- In a ratified schema, every example a rule cites in `rubric.example_refs` must be judged by `brand_owner` or `brand_team`. Examples from a template, a draft or a producer can guide writers, but cannot ground a verdict until the brand affirms them.

**The rail object:** `{rail_id, context, instruction, example?, antiExample?}`. Rails can sit in several layers; every `rail_id` is unique across the schema, so a rule can cite any of them.

### 8.4 `commercial`

| Field | Kind | Notes |
|---|---|---|
| `pricing.{style, displayFormat, surfaceOverrides, permittedLanguage}` | Facts / density | `style` is open vocabulary (`opaque`, `transparent`, `value_led`, `simple`, …). Discount caps, urgency, scarcity and forbidden pricing language → rules. |
| `claims.superlatives.approved` | Facts | Approved product claims live in `narrative.semiotic.denotative.claims`. Comparative and forbidden superlatives → rules. |
| `offers.{permittedTypes, communicationRules.valueFraming}` | Facts / density | Forbidden offer types → rules |
| `socialProof.{celebrityEndorsementStyle, permittedAuthoritySignals}` | Facts / density | Forbidden social proof → rules |

### 8.5 `governance`

| Field | Kind | Notes |
|---|---|---|
| `conflictResolution.{componentPriority, knownConflicts, defaultResolution}` | Operational | |
| `situations[]` | Operational / density | Section 9.2 |
| `surfaces[].{surface, objective, primaryRail, rails, fallback, fallbackContent, intentRules, suspended_rule_ids}` | Operational / density | One list for surface behaviour. `primaryRail` is a `rail_id`. `suspended_rule_ids` may name only `contextual` rules. |
| `override.{authorisedRoles, requiredFields, maxDurationDays, overrideProcess, judgmentBounds}` | Operational | Who may clear a `strong` finding, and how. Override events are recorded in the verification record. |
| `reviewTopics` | Operational | Topics that always need human review |

`FallbackBehaviour` values (`refuse_to_generate`, `escalate_to_human`, `use_brand_default`, `use_minimal_safe`) are the brand's instructions to its own producers. Ramoira never executes them: it does not produce content.

Integration plumbing (webhooks, routing addresses, audit endpoints) is not brand meaning and is not part of the schema.

### 8.6 Shared anchored scales

`formality`, `warmth` and `vocabularyLevel` are integers from 0 to 10 on scales defined once, here, so a value means the same thing in every schema:

| Value | `formality` | `warmth` | `vocabularyLevel` |
|---:|---|---|---|
| 1 | Text-message register; fragments permitted | Cold, distant | Simplest everyday words |
| 3 | Friendly but not informal | Reserved, courteous | Plain; no jargon |
| 5 | Clear and direct; neither casual nor formal | Approachable, even | Everyday professional |
| 7 | Formal, not casual | Warm, personal | Precise; technical terms explained |
| 9 | Ceremonial; never casual | Intimate | Specialist, peer-to-peer technical |

- Even values sit between their neighbours' anchors.
- Deltas (`formalityDelta`, `warmthDelta`) move along the same scale and must keep the result within 0–10.
- A rule written against a scale ("social formality never below 3") is a `judged_bounded` rule whose rubric is the anchor text plus at least one brand-judged example on each side of the line.

---

## 9. Where, who and when

### 9.1 Surfaces and intents

- **Surfaces** (`OutputSurface`, Appendix A) say *where* content appears.
- **User intents** (`UserIntent`, Appendix A) say *who* it is for.

### 9.2 Situations

**Situations** say *when*: a circumstance the brand responds to.

```json
"situations": [
  {
    "situation_id": "sit_safety_notice",
    "trigger": "A product safety notice or recall is in effect.",
    "category": "crisis",
    "posture": "Facts and instructions first.",
    "surfaces": ["press_release", "customer_service"],
    "voice": { "persona": "restrained", "formalityDelta": 2, "warmthDelta": 0, "instruction": "Plain steps." },
    "rails": [],
    "suspended_rule_ids": []
  }
]
```

- `category`: `crisis`, `competitor_action`, `accusation`, `praise`, `partner_request` or `other`.
- `voice.persona`: `normal`, `restrained` or `suspended` (the brand voice pauses entirely).
- A rule applies by surface × market × situation. A rule with `situations: ["sit_safety_notice"]` applies only while that situation is active.

**Who activates a situation.** The brand does, as a time-bounded state ("active from … to …"), and the verifier reads active situations from the brand's record. A producer never declares a situation per item: that would let the checked party choose which rules apply to its own work.

---

## 10. Archetype templates (`schema_type: archetype`)

An archetype template is the same format as a brand schema, filled at archetype level, plus an `archetype` block describing it:

```json
"archetype": {
  "archetype_id": "workshop",
  "name": "…",
  "tagline": "…",
  "core_insight": "…",
  "exemplars": [],
  "not_for": [],
  "delta_zones": [
    {
      "zone_id": "dz_competitor",
      "label": "When a competitor makes a claim about you",
      "question": "A competitor says their product outlasts yours. What do you do?",
      "impact": "medium",
      "fields": ["/governance/situations"],
      "situation_ids": ["sit_competitor_claim"],
      "divergence_signals": [ { "signal": "…", "delta": "…", "fields": ["/…"] } ]
    }
  ]
}
```

- **Exemplars are names only**: reference points in a closeness question ("how close are you to …?"). No schema is written for an exemplar brand.
- **Delta zones** are the questions that adapt the template to a brand. Each names the fields it changes as v3 JSON pointers, and may name surfaces and situations; all must resolve (invariant 9).
- A template is never ratifiable: `brand_id`, `ratification` and `canonical_url` are `null`.
- When a draft is built from a template, its rules are copied with `provenance: inherited` and `affirmed: false`, and the draft records the anchor in `draft_provenance`. Archetypes draft; they never measure. Closeness to an archetype is not a quality, conformance or faithfulness result.

---

## 11. The summary (`schema_type: summary`)

| | In the summary |
|---|---|
| `ramoira` | Always, with `schema_type: summary` and the full schema's `content_hash` and `ratification` |
| `rules` with `visibility: public` | Always |
| `identity`, `narrative`, `voice` | Always, in full, including rejected examples, context variants, rails, myth evolution and pillars |
| `identity.prism.culture.sacredBoundary` | Only if `summary_opt_in` includes `sacred_boundary` |
| `commercial`, `governance` | Only if `summary_opt_in` includes them |
| Rules with `visibility: private` | Never (change the rule's visibility to publish it) |
| `draft_provenance` | Never |

Defaults and options are identical at every tier. Nothing is withheld from the summary because of pricing.

Produce a summary with `npm run summarize -- brand.schema.json brand.schema.summary.json`.

---

## 12. Validation

```bash
npm install
npm run validate -- path/to/brand.schema.json [more files…]
npm test
```

The validator detects the document kind, runs the JSON Schema for it, then enforces the invariants JSON Schema cannot express. Requires Node.js 22.18 or later.

**Invariants.**

1. `ramoira`, and every object the spec defines, is closed: no result-bearing field can be added anywhere.
2. `rule_id`, `example_id`, `rail_id`, `claim_id`, `situation_id`, `participant_id` and `zone_id` are unique; every reference resolves (rubric examples and rails, rule situations, suspended rules, `primaryRail`, participants, promoted examples).
3. Check-class requirements (section 6.2) hold. A `judged_bounded` rule without both an approved and a rejected example, or a rail with both an example and an anti-example, is invalid.
4. `schema_type: archetype` ⇒ `brand_id`, `ratification` and `canonical_url` are `null`, and only an archetype carries the `archetype` block.
5. `ratification` non-null ⇒ `ratified_hash == content_hash`; no rule is `inherited` and unaffirmed; every rubric example is judged by `brand_owner` or `brand_team`.
6. `suspended_rule_ids` (surfaces and situations) reference only `contextual` rules.
7. A summary contains no private rule, no `commercial` or `governance` layer and no `sacredBoundary` unless opted in, and never `draft_provenance`.
8. `content_hash` recomputes (full and archetype).
9. In an archetype template, every delta-zone field is a valid v3 JSON pointer and every situation it names exists in `governance.situations`.
10. Context-variant and situation deltas keep `formality` and `warmth` within 0–10.
11. An example promoted from a reaction is `judged_by` the role of the participant who reacted.

The validator also warns (without failing) on thinness (`unfilled` fields) and on `draft_provenance` pointers that name no v3 field.

---

## 13. The verification record

A schema never carries results. Results live in a verification record: an append-only log of **verdict events**, one per content item checked against one `content_hash`. [`record.schema.json`](record.schema.json) publishes the format openly; the records themselves are kept by the verifier.

A verdict event records the item and its hash, the declared surface, the producer and producer class (`agency`, `freelancer`, `internal_team`, `in_house_ai`, `other`, all checked on identical terms), the schema hash and ratification, the commissioning mode, the verdict, its certification standing, and one finding per rule run.

| Field | Values |
|---|---|
| `commissioning_mode` | `principal_commissioned` (the brand commissions the check), `principal_adopted` (a producer-run check inside an adoption the brand recorded), `producer_self_check` |
| `verdict` | `pass`, `fail`, `review_required`, `not_certifiable`, `not_evaluable` |
| `certification_standing` | `eligible`, `ineligible`, `tooling_only` |
| `findings[].outcome` | `pass`, `violation`, `void`, `not_evaluable`, `advisory` |

The format enforces:

- a producer's own check, and any check against an unratified schema, is `tooling_only`;
- deterministic findings have no judge; an exact violation quotes its span; a judged `pass` or `violation` quotes a span and names its judge, or it is `void`;
- the verdict follows from the findings: any absolute violation → `fail`; otherwise any unresolved strong violation or void judged finding → `review_required`; otherwise `pass`;
- an override, a brand act, clears only a `strong` violation.

There is no score, confidence or trust number in a verdict event. A conformance verdict says whether an item matches what the brand ratified. It says nothing about whether the schema is faithful to the brand.

Adoption records (`$defs/Adoption`) are the brand's act of adopting a producer-run stream of checks: the producer, the scope (surfaces and markets), the schema hashes, who adopted it and when, and whether it was revoked.

---

## 14. What 3.0.0 deliberately does not contain

- **Results of any kind** in a schema: certification, confidence, conformance rate, expiry, density score, archetype coherence.
- **Archetype taglines or scores inside brand meaning.** The anchor is provenance, not identity. Personality dimension scores are not part of a brand schema.
- **A ratified summary of the schema's own content.** A short brief can be derived on export; it is not stored, so it cannot drift from what it summarises.
- **Integration plumbing:** webhooks, routing addresses, audit endpoints.
- **Generation runtime:** token-trimming manifests and regenerate loops belong to whoever produces content.

---

## 15. Versioning

This spec follows semantic versioning.

| Change | Bump | Example |
|---|---|---|
| New optional field added | patch | 3.0.0 → 3.0.1 |
| New required field added | minor | 3.0.0 → 3.1.0 |
| Field removed, renamed, or type changed | major | 3.0.0 → 4.0.0 |

There is one version axis: `spec_version`. A schema's own version is its `content_hash`.

Migration guides are in [`migrations/`](migrations/).

---

## 16. For agents consuming this spec

**To write on-brand copy.** Fetch the summary at `https://ramoira.com/brands/[slug]/schema.summary.json` (no authentication). Read, in order: the public `rules` (what you must not do, and what must be true), `voice.examples` (approved and rejected, with reasons), `voice.approvedTones`, `voice.contextVariants` for your surface, the rails, and `narrative.semiotic.denotative.claims` (the only claims you may make).

**To check your own draft.** Running the rules against your own content is a self-check: useful tooling, recorded as `tooling_only`. It is not an independent check and not a certification.

**Check the status.** `ramoira.ratification` is `null` for a candidate. A candidate schema is the brand's draft; content written with it is not "approved" or "certified" by having used it.

**Examples** in [`examples/`](examples/) illustrate the format. The brands in them are fictional; none is a ratified schema.

---

## Appendix A — Enumerations

**`OutputSurface`** (17): `search_result_page`, `paid_landing_page`, `product_detail_page`, `comparison_page`, `editorial`, `brand_narrative`, `social_organic`, `social_paid`, `email_acquisition`, `email_retention`, `display_ad`, `video_script`, `audio_script`, `press_release`, `customer_service`, `packaging_copy`, `out_of_home`. The verification record uses the same list.

**`UserIntent`** (8): `high_intent_buyer`, `early_research`, `brand_discovery`, `competitor_comparison`, `post_purchase`, `service_enquiry`, `press_media`, `investor`.

**`SentenceLength`**: `short`, `varied`, `long`, `fragments_permitted`.

**`FallbackBehaviour`**: `refuse_to_generate`, `escalate_to_human`, `use_brand_default`, `use_minimal_safe`.
