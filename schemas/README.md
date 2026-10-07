# Schema templates

Blank 3.0.0 templates to copy when writing a schema by hand.

- `brand.schema.json`: full schema with every section present and a placeholder rule of each check class. Replace the placeholders, then `npm run hash -- brand.schema.json --write`.
- `brand.schema.summary.json`: the summary generated from it by `npm run summarize`. Generate your own rather than editing this one.

Field reference: [`SPEC.md`](../SPEC.md) and [`layers/`](../layers/).
