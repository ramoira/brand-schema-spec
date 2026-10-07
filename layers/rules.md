# The rule registry — `rules`

Normative: [`SPEC.md`](../SPEC.md) section 6.

Everything that can produce a finding lives here, once. A finding cites a `rule_id`; if a prohibition is not a rule, nothing can cite it, and it cannot be checked.

## Choosing a check class

Ask what a checker would need to decide the rule without asking you.

| If the rule is… | Use | You supply |
|---|---|---|
| a word, phrase, name or colour that must not appear | `deterministic_exact` | `match.terms`, `mode`, `normalization` |
| a number, a required phrase, a pronoun, "only approved claims" | `deterministic_structural` | `predicate {type, params}` |
| something only judgment can decide ("never sound like a gadget") | `judged_bounded` | `rubric` citing at least one approved and one rejected example **you** judged, or a rail with an example and an anti-example |
| something you cannot yet illustrate either way | not a rule | a `narrative.guidance` question, until you have examples |

Judged rules are only as good as their examples. Two examples that sit either side of the line ("this is us", "this is not us, because…") do more than a paragraph of explanation.

## Severity

`absolute` blocks, `strong` sends the item to review (your override can clear it), `contextual` logs. Severity is the only setting; the response follows from it.

## Scope

- `surfaces`, `markets`: where and in which markets the rule applies.
- `situations`: `"any"`, or only while you have a situation active (a recall, an accusation).
- `modality`: `text`, `visual`, `audio`. Text-only checkers report visual and audio rules as `not_evaluable`.
- `visibility`: whether the rule appears in your public summary. Private by default for commercial and governance topics.

## Provenance

`provenance` says where the rule came from (`authored`, `adapted`, `inherited`), and `affirmed` whether you have affirmed it. Rules copied from a drafting template start `inherited`, `affirmed: false`; a schema cannot be ratified until you affirm, edit or delete each one.

## Writing good rules

- One rule, one thing. "No urgency or scarcity" is fine; "no urgency, no emoji and no competitor names" is three rules.
- Put the reason in `rationale`. Producers follow rules they understand.
- Merge duplicates. The same term in three lists is one rule.
