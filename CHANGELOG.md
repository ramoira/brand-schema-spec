# Changelog

## Unreleased — deprecation notices ahead of 3.0.0

Documentation only. The v2.0.0 format and its validators are unchanged.

- `certified` and `confidence` are deprecated and will be removed in 3.0.0. Neither field says anything about quality, ratification or conformance. Both are dropped from the examples and templates; validators still accept them for v2 compatibility.
- The spec no longer names a private implementation as its source of truth. `SPEC.md` and the JSON Schemas in this repository are normative.
- The "Studio tier value" rationale for summary exclusions is withdrawn. The fields stay excluded in v2 for compatibility and become includable at every tier in 3.0.0.
- The Rolex example is marked as an unratified illustration, not Rolex's schema and not a reference implementation. It will be replaced in 3.0.0.
- A generated schema is described as a candidate until the brand ratifies it.

## 2.0.0

Component architecture: identity, narrative, voice, commercial, governance.
