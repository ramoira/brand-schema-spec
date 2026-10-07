# Commercial — `commercial`

Normative: [`SPEC.md`](../SPEC.md) section 8.4. How the brand sells. Excluded from the public summary unless the brand opts in.

| Field | Holds |
|---|---|
| `pricing.{style, displayFormat, surfaceOverrides, permittedLanguage}` | How prices are shown and talked about. `style` is open vocabulary (`opaque`, `transparent`, `value_led`, …). |
| `claims.superlatives.approved` | Superlatives the brand can stand behind |
| `offers.{permittedTypes, communicationRules.valueFraming}` | Which offers exist and how value is framed |
| `socialProof.{celebrityEndorsementStyle, permittedAuthoritySignals}` | Which proof the brand uses |

This is where v2 kept most of its booleans (`discountPermitted: false`, `urgencyLanguagePermitted: false`, `maxDiscountPercent`, forbidden language, comparative rules). In 3.0.0 each is a rule: exact rules for words and competitor names, structural rules for numbers (`max_number {field: "discount_percent", max: 15}`). Approved product claims live in `narrative.semiotic.denotative.claims`.
