# Reading guide

One page per part of a 3.0.0 schema. The normative definition is [`SPEC.md`](../SPEC.md) with the JSON Schemas; where a page here disagrees with them, the spec wins.

| Page | Part |
|---|---|
| [`rules.md`](rules.md) | The rule registry: everything that can be checked |
| [`identity.md`](identity.md) | Who the brand is: prism and distinctive assets |
| [`narrative.md`](narrative.md) | What the brand means: facts, claims, myth, pillars |
| [`voice.md`](voice.md) | How the brand writes: tones, judged examples, surface variants, rails |
| [`commercial.md`](commercial.md) | How the brand sells: pricing, offers, social proof |
| [`governance.md`](governance.md) | How the brand operates the schema: situations, surfaces, overrides |

**One rule of thumb for every page:** if a sentence says "never", "must" or "only", it belongs in `rules`, not in a layer. Layers hold what rules check against (facts) and what producers write from (density).
