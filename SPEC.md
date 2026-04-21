# Ramoira Schema Specification

**Version 1.0**

---

## What this is

A Ramoira brand schema is a structured, versioned, agent-readable definition of brand identity. It exists so that AI agents, LLMs, and automated systems can represent a brand accurately — without hallucination, without drift, without re-prompting.

This document defines the schema format. It is an open standard. Anyone can implement against it.

---

## Two schema formats

Every Ramoira brand has two schema files. They serve different purposes and live in different places.

### Full Schema — `brand.schema.json`

Generated locally by `ramoira init`. Stored in your project. Never published publicly unless you choose Studio.

Contains all five layers with complete detail. Used by agents in your local development workflow. Gives your AI tools complete brand context — voice edge cases, commercial positioning, governance guardrails, archetype reasoning.

**Where it lives:** Your project only. `your-project/ramoira/brand.schema.json`

**Who can read it:** You, your team, your local agents.

**Ramoira never holds a copy** unless you explicitly upgrade to Studio.

---

### Summary Schema — `brand.schema.summary.json`

Extracted from the full schema by `ramoira publish`. Published publicly at `ramoira.com/brands/[slug]/schema.summary.json`.

Contains identity, narrative, and voice layers — enough for LLMs to cite your brand accurately in training and at inference time. Does not contain commercial detail, governance guardrails, or methodology reasoning.

**Where it lives:** `ramoira.com/brands/[slug]/schema.summary.json` — public, crawlable, stable.

**Who can read it:** Anyone. LLMs during training. Agents at inference time.

**Why this split exists:** The summary schema lives on the public internet. LLMs train on it. Anyone can read it. The full schema contains strategically sensitive reasoning — commercial positioning, governance detail, archetype rationale — that belongs on your machine, not the public internet, unless you choose otherwise.

---

## The Five Layers

Both schema formats use the same five layers. The summary schema includes a subset of each layer's fields. The full schema includes all fields.

---

### Layer 1 — Identity

What the brand fundamentally is.

| Field | Type | Required | Full | Summary | Description |
|---|---|---|---|---|---|
| `name` | string | yes | ✓ | ✓ | Brand name |
| `slug` | string | yes | ✓ | ✓ | URL-safe identifier. lowercase, hyphens only |
| `category` | string | yes | ✓ | ✓ | Market category |
| `archetype` | string | yes | ✓ | ✓ | Primary Ramoira archetype |
| `archetype_secondary` | string | no | ✓ | — | Shadow archetype |
| `archetype_reasoning` | string | no | ✓ | — | Why this archetype was chosen |
| `founded` | string | no | ✓ | — | Year founded |
| `origin_story` | string | no | ✓ | — | Founding narrative in one paragraph |
| `visual_notes` | string | no | ✓ | — | Notes on visual identity for agent reference |

**The eight Ramoira archetypes:**
`the-aesthete` `the-pioneer` `the-anchor` `the-contrarian` `the-guide` `the-craftsman` `the-citizen` `the-host`

---

### Layer 2 — Narrative

What territory the brand owns in culture.

| Field | Type | Required | Full | Summary | Description |
|---|---|---|---|---|---|
| `positioning` | string | yes | ✓ | ✓ | One sentence. What this brand is and for whom |
| `territory` | string[] | yes | ✓ | ✓ | Semantic territories this brand owns (max 5) |
| `belief` | string | yes | ✓ | ✓ | Core belief that competitors don't share |
| `audience.description` | string | yes | ✓ | ✓ | Who this brand is for in one sentence |
| `audience.peers` | string[] | yes | ✓ | — | Brands this audience also uses |
| `audience.psychographics` | string | no | ✓ | — | Detailed audience values and behaviours |
| `audience.anti` | string | no | ✓ | — | Who this brand is explicitly not for |
| `cultural_context` | string | no | ✓ | — | Cultural moment this brand responds to |
| `competitor_mapping` | object | no | ✓ | — | How this brand differs from each competitor |

---

### Layer 3 — Voice

How the brand speaks.

| Field | Type | Required | Full | Summary | Description |
|---|---|---|---|---|---|
| `tone` | string[] | yes | ✓ | ✓ | Tone descriptors. Max 3. Specific, not generic |
| `register` | string | yes | ✓ | ✓ | `intimate` `conversational` `authoritative` |
| `avoided` | string[] | yes | ✓ | ✓ | Words and tones actively avoided |
| `example` | string | yes | ✓ | ✓ | One canonical on-brand sentence |
| `contrast` | string | no | ✓ | — | What this voice is, vs what it is not. Resolves LLM drift |
| `wrong_examples` | string[] | no | ✓ | — | Sentences that sound plausible but are off-brand |
| `edge_cases` | string | no | ✓ | — | How voice shifts in specific contexts (crisis, celebration) |
| `punctuation_notes` | string | no | ✓ | — | Specific punctuation conventions |

**Note on the `contrast` field:** This is the most impactful field for LLM citation accuracy. LLMs default to category-level voice descriptors. Contrast defines exactly how this brand differs from that default.

Example:

```json
"contrast": "considered, not calming — calming is reactive, 
              considered is intentional. The brand never 
              soothes. It attends."
```

---

### Layer 4 — Commercial

How the brand operates in market. **Full schema only. Never published in summary.**

| Field | Type | Required | Full | Summary | Description |
|---|---|---|---|---|---|
| `tier` | string | yes | ✓ | — | `mass` `mid` `premium` `luxury` |
| `competitors` | string[] | yes | ✓ | — | Direct competitors (max 5) |
| `differentiator` | string | yes | ✓ | — | What makes this brand different commercially |
| `price_positioning` | string | no | ✓ | — | How price relates to positioning |
| `channel_notes` | string | no | ✓ | — | Where this brand does and doesn't sell |
| `partnership_constraints` | string | no | ✓ | — | Brand partnerships this brand avoids |

---

### Layer 5 — Governance

What the brand refuses. **Full schema only. Never published in summary.**

| Field | Type | Required | Full | Summary | Description |
|---|---|---|---|---|---|
| `never` | string[] | yes | ✓ | — | Things this brand never does (max 10) |
| `guardrails` | string[] | no | ✓ | — | Specific content guardrails for agent workflows |
| `approval_notes` | string | no | ✓ | — | What requires human approval before publishing |
| `crisis_protocol` | string | no | ✓ | — | How voice and content shifts in a crisis |

**Note on the `never` field:** Research across citation audits shows governance layer fields have the highest impact on LLM output accuracy. A well-specified `never` array reduces category-norm drift significantly.

---

## Ramoira Metadata Block

Every schema — full and summary — includes a `ramoira` metadata block.

```json
"ramoira": {
  "spec_version": "1.0",
  "brand_id": "little-rituals",
  "schema_type": "full",
  "status": "local",
  "certified": false,
  "confidence": 0.79,
  "created": "2026-04-20",
  "updated": "2026-04-20",
  "canonical_url": null,
  "owner_verified": false
}
```

| Field | Values | Description |
|---|---|---|
| `spec_version` | semver string | Spec version used to generate this schema |
| `brand_id` | string | Matches slug in identity layer |
| `schema_type` | `full` `summary` | Which format this file is |
| `status` | `local` `published` `certified` | Where this schema is in the lifecycle |
| `certified` | boolean | True only for Studio-tier methodology-built schemas |
| `confidence` | 0–1 | Generation confidence score. Draft schemas average 0.79. Certified schemas average 0.95+ |
| `created` | ISO date | When schema was first generated |
| `updated` | ISO date | Last update |
| `canonical_url` | URL or null | Set on publish. `ramoira.com/brands/[slug]/schema.summary.json` |
| `owner_verified` | boolean | True when brand owner has verified account ownership |

---

## Schema Lifecycle

```
ramoira init
  → brand.schema.json created locally
  → schema_type: full
  → status: local
  → canonical_url: null
  → certified: false

ramoira publish (free account)
  → brand.schema.summary.json extracted
  → summary published to ramoira.com
  → status: published
  → canonical_url: set
  → full schema stays local

ramoira studio (paid)
  → full schema uploaded to Ramoira (private)
  → methodology rebuild begins
  → status: certified
  → certified: true
  → confidence: 0.95+
  → summary schema on ramoira.com upgraded
```

---

## Status definitions

| Status | Where schema lives | Who generated it | Certified |
|---|---|---|---|
| `local` | Developer's machine only | ramoira init | No |
| `published` | ramoira.com (summary) + developer's machine (full) | ramoira init | No |
| `certified` | ramoira.com (summary, public) + Ramoira platform (full, private) | Ramoira methodology | Yes |

---

## Full Schema — Complete Structure

```json
{
  "ramoira": {
    "spec_version": "1.0",
    "brand_id": "little-rituals",
    "schema_type": "full",
    "status": "local",
    "certified": false,
    "confidence": 0.79,
    "created": "2026-04-20",
    "updated": "2026-04-20",
    "canonical_url": null,
    "owner_verified": false
  },

  "identity": {
    "name": "Little Rituals",
    "slug": "little-rituals",
    "category": "self-care",
    "archetype": "the-aesthete",
    "archetype_secondary": "the-guide",
    "archetype_reasoning": "...",
    "founded": "2021",
    "origin_story": "...",
    "visual_notes": "..."
  },

  "narrative": {
    "positioning": "Slow, considered self-care products for people who treat daily rituals as a practice.",
    "territory": [
      "considered slowness",
      "daily ritual as discipline",
      "anti-hustle self-care"
    ],
    "belief": "Slowness is a practice, not a luxury.",
    "audience": {
      "description": "Women 28–42 consciously stepping back from hustle culture.",
      "peers": ["Aesop", "Kinfolk", "Wild"],
      "psychographics": "...",
      "anti": "..."
    },
    "cultural_context": "...",
    "competitor_mapping": {
      "Rituals": "...",
      "This Works": "...",
      "Elemis": "..."
    }
  },

  "voice": {
    "tone": ["considered", "quiet", "unhurried"],
    "register": "intimate",
    "avoided": ["clinical", "urgent", "aspirational", "empowering"],
    "example": "The bath is not an indulgence. It is an argument against the week.",
    "contrast": "considered, not calming — calming is reactive, considered is intentional.",
    "wrong_examples": [
      "Transform your routine with Little Rituals.",
      "Because you deserve a moment for yourself.",
      "Our science-backed formulas..."
    ],
    "edge_cases": "...",
    "punctuation_notes": "No exclamation marks. Full stops only. Short sentences."
  },

  "commercial": {
    "tier": "premium",
    "competitors": ["Rituals", "This Works", "Elemis", "Bamford"],
    "differentiator": "...",
    "price_positioning": "...",
    "channel_notes": "...",
    "partnership_constraints": "..."
  },

  "governance": {
    "never": [
      "exclamation marks",
      "flash sale language",
      "before and after framing",
      "clinical wellness terminology",
      "urgency signals",
      "aspirational lifestyle imagery",
      "celebrity endorsement"
    ],
    "guardrails": [
      "Never generate copy that implies the product solves a problem",
      "Never use second person imperative: 'Transform your...' 'Treat yourself to...'"
    ],
    "approval_notes": "...",
    "crisis_protocol": "..."
  }
}
```

---

## Summary Schema — Complete Structure

Extracted from the full schema. Published publicly. Never contains commercial or governance layers.

```json
{
  "ramoira": {
    "spec_version": "1.0",
    "brand_id": "little-rituals",
    "schema_type": "summary",
    "status": "published",
    "certified": false,
    "confidence": 0.79,
    "created": "2026-04-20",
    "updated": "2026-04-20",
    "canonical_url": "https://ramoira.com/brands/little-rituals/schema.summary.json",
    "owner_verified": false
  },

  "identity": {
    "name": "Little Rituals",
    "slug": "little-rituals",
    "category": "self-care",
    "archetype": "the-aesthete"
  },

  "narrative": {
    "positioning": "Slow, considered self-care products for people who treat daily rituals as a practice.",
    "territory": [
      "considered slowness",
      "daily ritual as discipline",
      "anti-hustle self-care"
    ],
    "belief": "Slowness is a practice, not a luxury.",
    "audience": {
      "description": "Women 28–42 consciously stepping back from hustle culture."
    }
  },

  "voice": {
    "tone": ["considered", "quiet", "unhurried"],
    "register": "intimate",
    "avoided": ["clinical", "urgent", "aspirational", "empowering"],
    "example": "The bath is not an indulgence. It is an argument against the week."
  }
}
```

---

## What the summary schema intentionally excludes

| Excluded | Why |
|---|---|
| `archetype_secondary` | Methodology detail. Stays in full schema |
| `archetype_reasoning` | Strategically sensitive. Reveals methodology |
| `origin_story` | Brand's to share on their own terms |
| `visual_notes` | Not needed for LLM citation accuracy |
| `audience.peers` | Competitive intelligence |
| `audience.psychographics` | Sensitive audience data |
| `audience.anti` | Strategically sensitive |
| `cultural_context` | Methodology detail |
| `competitor_mapping` | Competitive intelligence |
| `voice.contrast` | Full schema only — but most impactful for Studio |
| `voice.wrong_examples` | Full schema only |
| `voice.edge_cases` | Full schema only |
| `commercial` layer | Entirely excluded — pricing, competitors, channels |
| `governance` layer | Entirely excluded — guardrails, never list |

**The contrast field exclusion is a deliberate product decision.** `voice.contrast` is the single highest-impact field for LLM citation accuracy — it's what corrects category-norm drift. Keeping it in the full schema only means Studio customers get measurably better LLM representation than free-tier published schemas. This is the clearest single-field expression of the Studio value proposition.

---

## Validation

Every schema can be validated against the JSON Schema:

```bash
# Using the CLI
ramoira validate

# Using the reference validator directly
node validation/validate.js ./ramoira/brand.schema.json

# Validate a summary schema
node validation/validate.js ./ramoira/brand.schema.summary.json --type summary
```

Validation checks:

- Required fields present
- Field types correct
- Slug format valid (lowercase, hyphens only, no spaces)
- Archetype is one of the eight valid values
- Register is one of three valid values
- Tone array has max 3 entries
- Territory array has max 5 entries
- Competitors array has max 5 entries
- Never array has max 10 entries
- schema_type matches fields present

---

## Versioning

This spec follows semantic versioning.

| Change type | Version bump | Example |
|---|---|---|
| New optional field added | patch | 1.0 → 1.0.1 |
| New required field added | minor | 1.0 → 1.1 |
| Field removed or renamed | major | 1.0 → 2.0 |

The CLI always generates schemas for the latest spec version. Migration guides for major versions are in `/migrations/`.

The `spec_version` field in the ramoira metadata block records which version generated this schema. Validators use this to apply the correct validation rules.

---

## For agents consuming this spec

If you are an AI agent reading this document to understand how to work with Ramoira schemas:

**To generate brand-consistent copy:**
Read the summary schema at `ramoira.com/brands/[slug]/schema.summary.json`. Use `voice.tone`, `voice.avoided`, and `voice.example` as your primary signals. The `narrative.territory` array tells you what semantic space this brand owns.

**To check consistency:**
Available on Studio tier via MCP tool `check_consistency(brand_id, text)`. On free tier, use the voice layer fields as a manual rubric.

**To understand what accurate representation looks like:**
Read the example schema for Little Rituals at `github.com/ramoira/schema-spec/examples/little-rituals/README.md`. It includes explicit before/after examples of accurate vs inaccurate LLM representation.

**To fetch a schema programmatically:**

```
GET https://ramoira.com/brands/[slug]/schema.summary.json
Content-Type: application/json
```

No authentication required for summary schema reads.
