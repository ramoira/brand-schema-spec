# Changelog

## 3.0.0

Breaking. See `migrations/2.0.0-to-3.0.0.md`.

**A schema carries meaning, never results**
- Removed `certified`, `confidence`, `schema_contract_version`, the `certified` workflow state, and per-component `_component` / `_version`.
- Every object is closed (`additionalProperties: false`), so no result-bearing field can be added.
- New `record.schema.json`: the open format for verdict events and adoption records. Results live there, never in the schema.

**Rule registry**
- New top-level `rules`: every prohibition and requirement, each with `rule_id`, `check_class` (`deterministic_exact`, `deterministic_structural`, `judged_bounded`), `severity`, and scoping by surface, market, situation, modality and visibility.
- All v2 forbidden lists, `*Permitted: false` flags and severity-registry strings moved into it. Layers keep facts and density only.
- A `judged_bounded` rule must cite an approved and a rejected example, or a rail with both an example and an anti-example.
- `violationResponse` is no longer stored; it follows from severity.

**Version binding**
- New `ramoira.content_hash`: SHA-256 over the RFC 8785 canonical form of the rules and five layers. `schema_version` is a label.
- New `ramoira.ratification` pointer (`null` until the brand ratifies). `owner_verified` renamed `account_owner_verified`.

**Drafting**
- New `draft_provenance` (outside the hash; never in a summary): method, participants, anchors, delta answers, per-field inheritance status, owner reactions.
- New `schema_type: archetype` with an `archetype` block (delta zones as JSON pointers).
- Rules and examples record provenance. Inherited rules must be affirmed, and rubric examples must be judged by the brand, before a schema can be ratified.

**Layers**
- One approved-claims list: `narrative.semiotic.denotative.claims` (merges `functionalClaims` and `commercial.claims.approved`).
- Examples gain `example_id`, `judged_by`, `source`, `captured_at`; rails gain `rail_id`.
- New `governance.situations` (when, as distinct from where); `governance.surfaces` consolidates the three v2 surface-rule lists.
- Shared anchored scales for `formality`, `warmth` and `vocabularyLevel`.
- `humourStyle` becomes `{style, frequency?}` and absorbs `humourPermitted`. `pricing.style` is open vocabulary.
- Removed: personality dimension scores, `relationship.mode`, `powerDynamic`, `aspirationalDelta`, `layerHierarchy`, `identity.summary`, `contentTest`, `preflight`, webhooks and routing. `depictedArchetype` renamed `depictedCustomer`. New `narrative.guidance` for questions without examples.

**Summary**
- Includes every public rule and all of identity, narrative and voice, including rejected examples, context variants, rails, myth evolution and pillars, identically at every tier.
- Excludes by default only the commercial and governance layers, private rules and `sacredBoundary`; the brand opts in with `ramoira.summary_opt_in`.

**Repository**
- Reference validator rewritten (`validation/`, TypeScript on Node.js 22.18+): JSON Schema plus invariants 1–11, `content_hash` and summary tools, and a test suite.
- Examples replaced with fictional brands: `corvane/` and an illustrative `archetype-template/`. The Rolex and Little Rituals examples were removed: both are real brands, and a schema written about a brand that ratified nothing is not that brand's schema.
- Private implementation paths removed from the repository.

## 2.0.x — deprecation notices ahead of 3.0.0

Documentation only. The v2.0.0 format and its validators are unchanged.

- `certified` and `confidence` are deprecated and will be removed in 3.0.0. Neither field says anything about quality, ratification or conformance. Both are dropped from the examples and templates; validators still accept them for v2 compatibility.
- The spec no longer names a private implementation as its source of truth. `SPEC.md` and the JSON Schemas in this repository are normative.
- The "Studio tier value" rationale for summary exclusions is withdrawn. The fields stay excluded in v2 for compatibility and become includable at every tier in 3.0.0.
- The Rolex example is marked as an unratified illustration, not Rolex's schema and not a reference implementation. It will be replaced in 3.0.0.
- A generated schema is described as a candidate until the brand ratifies it.

## 2.0.0

Component architecture: identity, narrative, voice, commercial, governance.
