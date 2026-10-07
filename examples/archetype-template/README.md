# Archetype template — illustrative

`archetype.schema.json` shows the `schema_type: archetype` format: a schema filled at archetype level, plus an `archetype` block with delta zones.

This template, "The Workshop", was written for this repository to illustrate the format. It is not one of the templates in Ramoira's drafting instrument.

- `brand_id`, `ratification` and `canonical_url` are `null`: a template is never ratifiable and never published as a brand.
- `exemplars` is empty here. In a drafting instrument, exemplars are real brand **names** used as reference points in closeness questions; no schema is written for them.
- Each delta zone names the fields it changes as v3 JSON pointers. `dz_competitor` names a situation (`sit_competitor_claim`) rather than a made-up surface.
- Brand-specific facts (origin, claims, colours, owned phrases) are deliberately left empty: they must come from the brand.
- Examples are `judged_by: archetype_template`. When a draft is built from a template, its rules become `provenance: inherited, affirmed: false`, and nothing it inherits can ground a verdict until the brand affirms it.

See [`examples/corvane`](../corvane/) for a brand schema anchored on this template.
