# Open checker

Checks one content item against one 3.0.0 brand schema and returns a **verdict event** in the open record format ([`record.schema.json`](../record.schema.json)). It follows the [Verification Protocol](../SPEC.md#13-the-verification-record)'s mechanics. Free to use, for a brand checking its producers' work or a producer checking its own.

```ts
import { checkItem } from '@ramoira/schema/checker'

const { event, findingsVerdict, notes, outOfScope } = await checkItem(schema, {
  text: 'The item exactly as it would be published.',
  surface: 'product_detail_page', // one of SPEC.md Appendix A
  market: 'GB',                    // optional; rules scoped to markets need it
}, {
  commissioning_mode: 'producer_self_check', // or 'principal_commissioned' for a brand's own check
  producer: { producer_id: 'acme-studio', producer_class: 'agency' },
  judge,                                      // optional; see "Judged rules"
})
```

## What you can and cannot set

You declare facts about the item: its text, surface and market, who produced it, and who is running the check. You cannot choose, skip, tune or preview rules: the schema decides which apply, and any other option is an error. A check whose logic the checked party could adjust would not be a check.

## What it does with each rule

| Rule | Result |
|---|---|
| Not for this item's surface or market, or suspended on this surface by the schema | Listed in `outOfScope` with the reason. Not a finding. |
| Scoped to markets, and the item's market is not declared | `not_evaluable` |
| Scoped to situations | `not_evaluable`: situations are activated by the brand in Ramoira's record, which a local check cannot see |
| `visual` or `audio` modality | `not_evaluable`: this checker reads text |
| `deterministic_exact` | `pass` or `violation`, quoting the matched span from the item as written |
| `deterministic_structural` | `pass` or `violation` for the predicates below; `not_evaluable` for any other, with the reason |
| `judged_bounded` | Only through a judge you supply; `void` otherwise |

**Exact matching.** `casefold_nfkc` is NFKC plus case folding; `exact` compares as written. `substring` matches anywhere; `word` needs no letter, digit or underscore on either side; `phrase` is `word` with any run of whitespace in the item matching a space in the term. Spans are always the item's own text.

**Structural predicates implemented.** `required_phrase_on_surface`, `max_character_count`, `max_sentence_words`, `max_number` (field `discount_percent`: a percentage followed by "off", "discount" or "reduction", or after "save"; English only). `claim_must_be_approved` and `self_reference_form` need judgment to decide, so they are `not_evaluable` here. Sentences split at `. ! ? …` followed by whitespace, and at line breaks.

**Judged rules.** A judge is any object with `judge(request) → answer`. The request carries the rule's statement, its rubric question and the examples and rails its rubric cites, and the item. The answer is `pass`, `violation` or `undecided`, a verbatim quote from the item, the ids of the rubric material it relied on, and who judged (model and version, or reviewer). The checker accepts a `pass` or `violation` only when the quote is really in the item and every cited id is in the rule's rubric; anything else is `void`. A `void` judged finding sends the item to review. The checker never asks a judge for a rewrite, and a finding never carries one.

## Verdict and standing

`findingsVerdict` follows the findings: any absolute violation → `fail`; otherwise any strong violation or void judged finding → `review_required`; otherwise `pass`. A rule that is `not_evaluable` does not change it, so `notes` lists every absolute or strong rule the verdict does not cover.

The event's `verdict` is `findingsVerdict`, except:

- `not_certifiable` when the schema is not ratified (RMT2), or is a public summary (which lacks the brand's private rules);
- `not_evaluable` when the item is empty.

`certification_standing` is always `tooling_only`: the open checker keeps no record, and a result nobody else holds cannot stand as independent evidence. Ratified, recorded checks are Ramoira's service.
