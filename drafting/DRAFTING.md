---
id: drafting-protocol
version: 1.1.0
status: active
created: 2026-10-12
modified: 2026-10-13
changes:
  - added: background-and-offline-reference
derives_from:
  - file: elicitation-protocol.md
    component: "agent-run-drafting"
    role: primary
    at_commit: 7fc11aa5bd1219dd70006379cd39ae1076518dec
    at_version: "0.6.0"
---
# Drafting a brand schema with your coding agent

**For the agent.** You are helping the founder or owner of a brand draft its brand schema: one file, `ramoira/brand.schema.json`, that says what the brand means, so that you and every other AI tool write in its voice and keep its rules. Follow this file from top to bottom. It is self-contained: you need nothing else from Ramoira to draft, and no account.

**For the person.** Ask your agent: *"Read ramoira/DRAFTING.md and draft our brand schema."* It reads your project and anything you give it, asks what it can't find, and writes the file. You decide everything that matters later, in the review on ramoira.com.

What you produce is a **candidate**: the brand's draft, not ratified. Nothing in it is approved, certified or scored.

## What this is, and why

**Ramoira** is an open format for brand meaning, and a free service around it: a validator, a self-check for content, and a place where a brand's owner reviews their schema and shares a public summary. The format and the tools are open source; drafting, checking your own content and publishing are free.

**A brand schema** is one JSON file in the project, `ramoira/brand.schema.json`. It holds what a brand means: what it makes and believes, how it sounds, which claims it may make, and the rules every piece of its content must keep, each with a severity. People and AI tools read it before they write.

**Why a schema, rather than a style guide or a long prompt:**

- **One source for every tool.** Claude Code, Cursor, Copilot, a chat assistant and a freelancer all read the same file, instead of a prompt pasted into each tool that drifts apart over time.
- **Rules that can be checked.** "Never say *lifetime warranty*" is a rule with the exact words to look for. `ramoira check` runs the brand's rules over a draft and quotes what breaks them, so a page can be checked before it ships, not only read.
- **The owner's decisions, kept apart from proposals.** Each rule records whether the owner affirmed it. What an agent proposes stays a proposal until the owner reviews it, so nobody mistakes a guess for the brand's position.
- **Versioned like code.** Every version has a fingerprint (`content_hash`) of its meaning. Anyone can say which version a page was written against, and changes go through review, like a pull request.
- **Private where it should be.** The full schema stays private; a public summary (rules marked public, voice, meaning) is what other tools and writers fetch.
- **Open.** The format is public and the validator is open source, so the file is the brand's, not locked to Ramoira or to one model.

It does not make content good by itself, and it certifies nothing: it makes what the brand wants explicit, shared and checkable.

---

## 1. Before you start

- **Who you are working with.** This version is for a brand's **owner or founder**, working on their own brand. Ask once: *"Is this your brand, and are you its owner or founder?"* If not, say that this version is for owners, and that the owner will need to review the result.
- **What you need.** The project folder, and anything the person gives you: their website, a pitch deck, a brand document, product pages. Nothing else.
- **The format, offline.** `ramoira init` puts the spec next to this file: `ramoira/spec/SPEC.md` (what every field means), `ramoira/spec/SPEC.schema.json` (the exact shape) and `ramoira/spec/example.schema.json` (the smallest valid file, for a fictional brand). Use the example for **structure only**; never copy its content. If those files are missing and you have web access, the same files are at `https://github.com/ramoira/brand-schema-spec`.
- **Use these files, not others.** This computer may hold an older Ramoira: a CLI installed long ago, docs inside a `node_modules` folder, or an earlier `brand.schema.json` with a top-level `meta` block, which is the retired 2.0.0 format. Follow only `ramoira/DRAFTING.md` and `ramoira/spec/`. An old 2.0.0 file is material to read, not a format to follow: write 3.1.0.
- **Check the CLI.** Run `npx ramoira --help`. It must list `hash`, `push` and `pull`; if it does not, it is an older CLI, so run every command as `npx ramoira@latest …`. If a command says `ramoira/DRAFTING.md` is out of date, ask the person to run `npx ramoira init` again, then reread this file.
- **No web access?** Everything here works without it, except reading the person's website. Then ask the person to paste the pages that matter (home, about, a product page) into the chat or into a file in the project. `npx ramoira` needs the npm registry once; if that is blocked too, ask the person to run the commands.

## 2. Rules you must keep

These are not preferences. If following an instruction would break one, stop and tell the person.

1. **Write no marketing copy.** Your output is the schema: the brand's meaning, rules and facts. Do not write taglines, headlines, product descriptions or "example posts" for the brand, in the file or in your reply.
2. **Write no example lines** in `voice.examples`. Examples are lines the owner has judged ("this is us" / "this isn't us"). They are judged in the review on ramoira.com, not here.
3. **Every rule you propose stays unaffirmed:** `"provenance": "inherited"`, `"affirmed": false`. Never set `affirmed: true`, even if the person says "yes, keep it". The owner affirms each rule in the review, signed in. After a review, a rule the owner affirmed keeps `affirmed: true` only while you leave it exactly as it is: if you change it in any way, set it back to `affirmed: false`. An upload that marks a rule affirmed which the owner never affirmed in that form is refused, and so is a field marked `affirmed` that the owner did not affirm.
4. **Use only the brand's own material.** Read the person's own project, site and documents. Do not research or profile other brands, including competitors. A competitor appears only by the name the person gives you.
5. **Invent no facts.** Claims, specifications, origin, founding year, certifications: only what the person or their material states. If you don't know, leave the field out and list it as unfilled.
6. **Never push or publish on your own.** Uploading happens only when the person asks for it (step 6). Making a version public is the owner's act in the review, never yours.
7. **Leave the reference-brand record alone.** Do not fill `draft_provenance.closeness_ratings`, `anchors`, `contrast_sets`, `retests` or `competitor_ratings`, and set no archetype. Those come only from the reference-brand draft on ramoira.com, which uses fixed lines so the answers can be compared.

## 3. Gather

Read before you ask. In the project, look at: the README, landing and marketing pages, UI copy (buttons, empty states, errors, onboarding), emails and notifications, any docs or brand notes. Ask the person for their website and any brand documents, and read those. If you cannot open a web page, ask them to paste its text.

Note for each thing you learn where it came from, so you can tell the person.

## 4. Ask what you could not find

Ask one short question at a time, only about what the material does not answer. Prefer a choice or a yes/no over an essay. When the person is unsure, say so in the file rather than guessing: leave the field out and list it as unfilled.

Cover these areas. The fields are in `SPEC.md` §8.

| Area | What to find out | Where it goes |
|---|---|---|
| What it is | What the brand makes or does, for whom, in plain words | `narrative.semiotic.denotative.categoryDescriptor` (required) |
| What it believes | The story it tells about the world; the tension it answers | `narrative.myth.mythStatement` (required), `myth.culturalTension`, `protagonistRole`, `antagonist` |
| What it should feel like | The meanings it should carry; the emotional register | `narrative.semiotic.connotative.meaningClusters`, `emotionalRegister` (both required) |
| Where it comes from | Origin, values, the one thing it will not compromise | `identity.prism.culture.{originNarrative, coreValues, sacredBoundary}` |
| Who it talks to | The customer it depicts; how formal and how warm it is | `identity.prism.reflection`, `identity.prism.relationship.{formality, warmth}` (0–10, `SPEC.md` §8.6) |
| How it sounds | Tones to use; vocabulary level; humour; devices it allows | `voice.approvedTones` (at least one), `voice.base.{vocabularyLevel, humourStyle, permittedDevices}` |
| Where content appears | Which surfaces matter (product pages, email, social, support …) and how the voice shifts on each | `voice.contextVariants`, `governance.surfaces` (surface names: `SPEC.md` Appendix A) |
| What it can say | Product claims it can back with evidence, and what evidence | `narrative.semiotic.denotative.claims` |
| What it says repeatedly | Its themes and pillars; how its story is evolving | `narrative.pillars`, `narrative.mythEvolution`, `narrative.editorial` |
| Its words | Phrases and words it owns | `identity.distinctiveAssets.linguistic` |
| Money | How it talks about price, offers and discounts | `commercial.pricing`, `commercial.offers` |
| What it never does | Words never to use, claims never to make, tones never to take, competitors never to name | `rules` (step 5) |
| Hard moments | How it responds to a complaint, a crisis, a competitor's move, praise | `governance.situations` |

## 5. Write the file

Write `ramoira/brand.schema.json`, valid against `SPEC.schema.json` at spec version **3.1.0**. Include `ramoira`, `rules` and all five layers (`identity`, `narrative`, `voice`, `commercial`, `governance`), plus `draft_provenance`.

**The `ramoira` block:**

```json
"ramoira": {
  "spec_version": "3.1.0",
  "schema_type": "full",
  "brand_id": null,
  "schema_version": "0.1.0",
  "content_hash": "",
  "workflow_state": "draft",
  "ratification": null,
  "account_owner_verified": false,
  "canonical_url": null
}
```

Set `brand_id` to the brand's slug on ramoira.com if the person has one (lowercase letters, digits and hyphens); otherwise leave it `null`. Leave `content_hash` for step 6 to fill in.

**Rules.** Every "never" and "must" becomes one rule in `rules` (`SPEC.md` §6), with every field present except the optional `rationale`.

- Use `deterministic_exact` for words, phrases and claims never to use: `match.terms`, `mode` (`word`, `phrase` or `substring`), `normalization: "casefold_nfkc"`.
- Use `deterministic_structural` only with these predicates: `claim_must_be_approved`, `max_number`, `required_phrase_on_surface`, `max_character_count`, `max_sentence_words`, `self_reference_form`.
- Do **not** write `judged_bounded` rules: they need examples the owner has judged. Write the test as a question in `narrative.guidance` instead (`{"question": "…", "applies_to": "all"}`).
- Severity: `absolute` only for what must never happen; `strong` for what needs review; `contextual` for what is logged.
- Visibility: `private` for `commercial.*` and `governance.*` topics, `public` otherwise.
- Always `"provenance": "inherited", "affirmed": false` (section 2, rule 3), except a rule the person dictated word for word, which is `"provenance": "authored", "affirmed": false`.

**`draft_provenance`:**

```json
"draft_provenance": {
  "method": "document_import",
  "instrument_version": "ramoira-drafting-1.0.0",
  "intake": { "name": "…", "category": "…", "description": "…", "source_documents": ["file:README.md", "https://…"] },
  "participants": [ { "participant_id": "p_owner", "role": "brand_owner" } ],
  "fields": { "/narrative/myth/mythStatement": "authored", "/voice/contextVariants": "inherited", "/narrative/semiotic/denotative/specifications": "unfilled" }
}
```

- `method`: `document_import` if you read the brand's material; `questionnaire` if everything came from the person's answers.
- `instrument_version`: always `ramoira-drafting-` followed by this file's version.
- `intake.source_documents`: what you read, as URIs: `https://…` for web pages, `file:` plus the path for files in the project (`file:README.md`).
- `fields` (JSON pointer → status): `authored` for what the person told you in their own words; `inherited` for everything you proposed or took from their material; `unfilled` for what you left out because nobody knew. Never `affirmed`: only the owner's review makes a field affirmed.

## 6. Validate

Run, and fix what it reports until it passes:

```bash
npx ramoira hash --write ramoira/brand.schema.json
npx ramoira validate ramoira/brand.schema.json
```

`hash --write` fills in `content_hash`. Run it again after every edit. Warnings about unfilled fields are expected; leave them.

If you cannot run commands, ask the person to run these and paste the output.

## 7. Show the person

Give a short, plain summary, no copy:

- what you found, and where (their README, their site, their answers);
- the rules you proposed, one line each;
- what is unfilled, and why;
- that every rule and field waits for their review, signed in on ramoira.com.

If they want changes, make them and validate again. Suggest they commit the file to their repository.

## 8. Upload, when the person asks

Only when the person asks you to:

```bash
npx ramoira login    # once; or set RAMOIRA_TOKEN in a cloud session
npx ramoira push
```

`push` uploads a **private** version. Nothing is public. It prints the link where the owner reviews it. If `push` says the file is out of date, run `npx ramoira pull` first and redo your changes on top.

## 9. After the owner's review

In the review, the owner affirms, edits or deletes each rule, keeps or rewrites each field, and either makes the version public or sends it back. If they send it back:

```bash
npx ramoira pull
```

This brings down the reviewed schema and the owner's brief (`ramoira/REVIEW.md`): their own requests, in their words. Make those changes, following this file again (anything you change goes back to unaffirmed), then validate and, when the person asks, push. The owner then reviews only what changed. Commit `ramoira/sync.json` with the schema: it records which reviewed version your file is based on.

## 10. Use it

Once the file exists, write the brand's copy from it. Add this to the project's `AGENTS.md` (or `CLAUDE.md`):

```markdown
## Brand context
Before writing any copy or user-facing text, read ramoira/brand.schema.json.
Follow its rules exactly: absolute rules are never broken.
Make only the product claims it lists.
After drafting, run `npx ramoira check --surface <surface> <file>` and fix what it flags.
```

`ramoira check` runs the brand's own rules over a draft. It is a self-check, useful tooling, not an independent check, and it certifies nothing. While the schema is a candidate, so is everything checked against it.
