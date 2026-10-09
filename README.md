# Ramoira Schema Specification

An open format for what a brand means, and what it will not say.

## What this is

A Ramoira brand schema is a structured, versioned, agent-readable statement of a brand: the rules content must follow, and the facts and voice producers write from. Agencies, freelancers, in-house teams and AI systems read it to write on-brand content. A verifier reads it to check content against it.

**3.1.0** is the current version. It adds optional elicitation fields to `draft_provenance` (outside `content_hash`); 3.0.0 documents stay valid, see [`migrations/3.0.0-to-3.1.0.md`](migrations/3.0.0-to-3.1.0.md). 3.0.0 was a breaking release; see [`migrations/2.0.0-to-3.0.0.md`](migrations/2.0.0-to-3.0.0.md).

## Three things to know

- **A schema carries meaning, never results.** There is no certification, confidence or trust score in a schema. Results about content live in a verification record ([`record.schema.json`](record.schema.json)), never in a file the checked party can edit.
- **Every rule is citable.** Each prohibition or requirement is a rule with an id, a check class and a severity, so a finding can name exactly what was broken.
- **A generated schema is a candidate until the brand ratifies it.** Publishing a summary does not ratify a schema. The format is free and open at every tier.

## Files

| File | |
|---|---|
| [`SPEC.md`](SPEC.md) | The specification |
| [`SPEC.schema.json`](SPEC.schema.json) | JSON Schema: full schemas and archetype templates |
| [`SPEC.summary.schema.json`](SPEC.summary.schema.json) | JSON Schema: the public summary |
| [`record.schema.json`](record.schema.json) | JSON Schema: verdict events and adoption records |
| [`validation/`](validation/) | Reference validator, `content_hash` tool and summary extractor |
| [`checker/`](checker/) | Open checker: one content item against one schema, as a verdict event |
| [`layers/`](layers/) | Reading guide, one page per layer plus the rule registry |
| [`examples/`](examples/) | Worked examples (fictional brands) |
| [`schemas/`](schemas/) | Blank templates |
| [`migrations/`](migrations/) | Upgrade guides |

SPEC.md and the JSON Schemas are normative. Implementations, Ramoira's own included, conform to them.

## Two schema files per brand

```
brand.schema.json          Full schema. Every rule, all five layers.
                           Lives in your project. ramoira publish sends it
                           to Ramoira, which keeps it private.

brand.schema.summary.json  Public summary. Every public rule; identity,
                           narrative and voice in full. Commercial and
                           governance only if you opt in.
                           Published at ramoira.com/brands/[slug]/
```

## Validate

Requires Node.js 22.18 or later.

```bash
npm install
npm run validate -- path/to/brand.schema.json
npm run hash -- path/to/brand.schema.json --write
npm run summarize -- path/to/brand.schema.json path/to/brand.schema.summary.json
npm test
```

## Use the validator from code

```bash
npm install github:ramoira/brand-schema-spec#<commit>
```

```ts
import { validateDocument } from '@ramoira/schema'
```

See [`validation/README.md`](validation/README.md).

## Check content against a schema

```ts
import { checkItem } from '@ramoira/schema/checker'

const { event, notes } = await checkItem(schema, { text, surface: 'product_detail_page' })
```

Returns a verdict event in the [`record.schema.json`](record.schema.json) format. The schema decides which rules apply; nothing selects or skips them. A self-check is useful tooling (`tooling_only`), not an independent check. See [`checker/README.md`](checker/README.md).

## CLI

The Ramoira CLI drafts, validates and publishes schemas: [github.com/ramoira/cli](https://github.com/ramoira/cli).

## License

MIT. The schema format is open. Schemas you write are yours entirely.
