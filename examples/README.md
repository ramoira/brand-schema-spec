# Examples

These illustrate the 3.1.0 format. **Every brand here is fictional**, and none of these schemas is ratified. Any resemblance to a real company is unintended.

| Folder | What it shows |
|---|---|
| [`corvane/`](corvane/) | A complete full schema for a fictional cookware maker, and its public summary: rules of every check class (including visual, audio and situation-scoped rules), brand-judged examples, rails, situations, and the draft provenance of an archetype-anchored candidate. In review, not ratified. |
| [`archetype-template/`](archetype-template/) | An illustrative archetype template (`schema_type: archetype`) with delta zones, including one that points at a situation. Written for this repository; it is not one of the templates in Ramoira's drafting instrument. |
| [`minimal/`](minimal/) | The smallest valid full schema, and its summary |

Validate them all:

```bash
npm install
npm run validate -- examples/*/*.json
```

Summaries are generated, never hand-written: `npm run summarize -- examples/corvane/brand.schema.json`.

Earlier versions of this repository carried schemas written about real brands. They were removed in 3.0.0: a schema of a brand that ratified nothing is someone else's interpretation presented as that brand's own.
