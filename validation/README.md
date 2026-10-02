# Validation

This folder contains a lightweight reference validator for the `brand.schema.json` (full) and `brand.schema.summary.json` (summary) formats.

The format is defined by `SPEC.md` and the JSON Schemas in this repository. The JSON examples in `brand-schema-spec/examples/` can be validated here.

## Usage

```bash
node validation/validate.js ./schemas/brand.schema.json
node validation/validate.js ./schemas/brand.schema.summary.json --type summary
```

## What it checks

- File is valid JSON
- Required top-level keys exist
- Component `_component` fields match their component name when present

This is intentionally minimal; deployments may enforce stricter constraints.
