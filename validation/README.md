# Reference validator

Validates 3.0.0 documents: full schemas, archetype templates, summaries, verdict events and adoption records. Requires Node.js 22.18 or later (TypeScript runs directly; no build step).

```bash
npm install
npm run validate -- examples/*/*.json          # add --json for machine-readable output
npm run hash -- brand.schema.json --write       # compute and store content_hash
npm run summarize -- brand.schema.json out.json # extract the public summary
npm test
```

## What it checks

1. The JSON Schema for the document's kind (`SPEC.schema.json`, `SPEC.summary.schema.json`, `record.schema.json`).
2. The invariants JSON Schema cannot express, each reported with its number (`SPEC.md` section 12): unique ids and resolving references, judged-rule rubric sufficiency, archetype constraints, ratification conditions, suspensions, summary contents, `content_hash`, delta-zone pointers, scale ranges, and who judged promoted examples.
3. For verdict events: the verdict follows from the findings, and an override clears only a strong violation.

Warnings (thinness, unresolved `draft_provenance` pointers) never fail validation.

## As a library

```ts
import { validateDocument, computeContentHash, extractSummary } from './validation/index.ts'

const { kind, valid, issues } = validateDocument(doc)
```

`content_hash` is `"sha256:" + hex(SHA-256(JCS({rules, identity, narrative, voice, commercial, governance})))`, with JCS per RFC 8785 (`lib/jcs.ts`). Other implementations must produce the same hash for the same schema.
