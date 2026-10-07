import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CheckError, checkItem, OUTPUT_SURFACES } from '../index.ts'
import type { CheckResult, Judge, JudgeRequest } from '../index.ts'
import { computeContentHash, extractSummary, validateDocument } from '../../validation/index.ts'

type Obj = Record<string, any>

const corvane: Obj = JSON.parse(readFileSync(new URL('../../examples/corvane/brand.schema.json', import.meta.url), 'utf8'))
const archetype: Obj = JSON.parse(
  readFileSync(new URL('../../examples/archetype-template/archetype.schema.json', import.meta.url), 'utf8'),
)

const CLEAN = 'Season it once and it gets better each time you cook. The 28 cm pan is one piece of iron.'

function variant(mutate: (doc: Obj) => void): Obj {
  const doc = structuredClone(corvane)
  mutate(doc)
  doc.ramoira.content_hash = computeContentHash(doc)
  return doc
}

function withRule(rule: Obj): Obj {
  return variant((doc) =>
    doc.rules.push({
      surfaces: 'all',
      markets: 'all',
      situations: 'any',
      modality: 'text',
      visibility: 'public',
      topic: 'voice.test',
      provenance: 'authored',
      affirmed: true,
      severity: 'strong',
      ...rule,
    }),
  )
}

const ratified = (doc: Obj): Obj => {
  const copy = structuredClone(doc)
  copy.ramoira.ratification = {
    ratification_id: 'rat_test',
    ratified_hash: copy.ramoira.content_hash,
    ratified_at: '2026-10-07T00:00:00Z',
    ratifier_role: 'brand_owner',
  }
  return copy
}

const finding = (r: CheckResult, id: string) => r.event.findings.find((f) => f.rule_id === id)

// A judge that answers from a script, as a model or reviewer would.
function scripted(answer: (req: JudgeRequest) => Obj): Judge {
  return { judge: async (req) => ({ judge_type: 'model', judge_id: 'test-model-1', ...answer(req) }) as any }
}
const agreeingJudge = scripted((req) => ({
  outcome: 'pass',
  span: req.text.split('.')[0],
  cited: [req.examples[0]?.example_id ?? req.rails[0]?.rail_id],
}))

test('every event is a valid record event, tooling_only, bound to the schema hash', async () => {
  const r = await checkItem(corvane, { text: CLEAN, surface: 'product_detail_page' })
  assert.equal(validateDocument(r.event, 'record').valid, true)
  assert.equal(r.event.certification_standing, 'tooling_only')
  assert.equal(r.event.schema.schema_hash, corvane.ramoira.content_hash)
  assert.equal(r.event.commissioning_mode, 'producer_self_check')
  assert.match(r.event.item_hash, /^sha256:[0-9a-f]{64}$/)
})

test('a candidate schema gives not_certifiable; the findings verdict is still reported', async () => {
  const r = await checkItem(corvane, { text: 'Our NON-TOXIC pan.', surface: 'product_detail_page' })
  assert.equal(r.event.verdict, 'not_certifiable')
  assert.equal(r.findingsVerdict, 'fail')
  assert.ok(r.notes.some((n) => n.includes('Precondition 1')))
})

test('exact: casefold_nfkc phrase match quotes the original span', async () => {
  const r = await checkItem(corvane, { text: 'Our NON-TOXIC pan.', surface: 'product_detail_page' })
  const f = finding(r, 'r_fear_vocabulary')!
  assert.equal(f.outcome, 'violation')
  assert.equal(f.span, 'NON-TOXIC')
  assert.equal(f.judge.type, 'none')
})

test('exact: phrase mode matches across any run of whitespace', async () => {
  const r = await checkItem(corvane, { text: 'A lifetime\n   warranty, they said.', surface: 'editorial' })
  assert.equal(finding(r, 'r_warranty_wording')!.span, 'lifetime\n   warranty')
})

test('exact: word mode respects word boundaries and NFKC', async () => {
  const hit = async (text: string) =>
    finding(await checkItem(corvane, { text, surface: 'editorial' }), 'r_no_competitor_names')!.outcome
  assert.equal(await hit('Unlike IRONHOLD pans.'), 'violation')
  assert.equal(await hit("Ironhold's pans."), 'violation')
  assert.equal(await hit('Ironholds is not a word here.'), 'pass')
  assert.equal(await hit('Pre-Ironhold era.'), 'violation')
  const r = await checkItem(corvane, { text: 'Unlike Ｉｒｏｎｈｏｌｄ pans.', surface: 'editorial' })
  assert.equal(finding(r, 'r_no_competitor_names')!.span, 'Ｉｒｏｎｈｏｌｄ')
})

test('exact: substring mode and the ß fold; exact normalization is case-sensitive', async () => {
  const sub = withRule({
    rule_id: 'r_t_sub',
    statement: 'No "strasse".',
    check_class: 'deterministic_exact',
    match: { terms: ['strasse'], mode: 'substring', normalization: 'casefold_nfkc' },
  })
  assert.equal(finding(await checkItem(sub, { text: 'Hauptstraße 5', surface: 'editorial' }), 'r_t_sub')!.span, 'straße')
  const exact = withRule({
    rule_id: 'r_t_exact',
    statement: 'No "Iron".',
    check_class: 'deterministic_exact',
    match: { terms: ['Iron'], mode: 'word', normalization: 'exact' },
  })
  assert.equal(finding(await checkItem(exact, { text: 'iron pan', surface: 'editorial' }), 'r_t_exact')!.outcome, 'pass')
  assert.equal(finding(await checkItem(exact, { text: 'Iron pan', surface: 'editorial' }), 'r_t_exact')!.outcome, 'violation')
})

test('structural: max_character_count quotes the sentence', async () => {
  const r = await checkItem(corvane, { text: 'It lasts. It really lasts!', surface: 'editorial' })
  const f = finding(r, 'r_no_exclamation')!
  assert.equal(f.outcome, 'violation')
  assert.equal(f.span, 'It really lasts!')
})

test('structural: max_number extracts discount percentages only', async () => {
  const out = async (text: string) => finding(await checkItem(corvane, { text, surface: 'editorial' }), 'r_max_discount')!
  assert.equal((await out('Save 20% on the 28 cm.')).outcome, 'violation')
  assert.equal((await out('Save 20% on the 28 cm.')).span, 'Save 20%')
  assert.equal((await out('Now 25 percent off.')).outcome, 'violation')
  assert.equal((await out('10% off this week.')).outcome, 'pass')
  assert.equal((await out('100% cast iron.')).outcome, 'pass')
})

test('structural: max_sentence_words and required_phrase_on_surface', async () => {
  const doc = variant((d) => {
    d.rules.push(
      { rule_id: 'r_t_short', statement: 'Short sentences.', check_class: 'deterministic_structural', severity: 'contextual', topic: 'voice.base', surfaces: 'all', markets: 'all', situations: 'any', modality: 'text', visibility: 'public', predicate: { type: 'max_sentence_words', params: { max: 5 } }, provenance: 'authored', affirmed: true },
      { rule_id: 'r_t_care', statement: 'Packaging says how to care for the pan.', check_class: 'deterministic_structural', severity: 'strong', topic: 'governance.surfaces', surfaces: ['packaging_copy'], markets: 'all', situations: 'any', modality: 'text', visibility: 'public', predicate: { type: 'required_phrase_on_surface', params: { phrase: 'dry it on the hob' } }, provenance: 'authored', affirmed: true },
    )
  })
  const r = await checkItem(doc, { text: 'Wash it. Then dry  it on the HOB.', surface: 'packaging_copy' })
  assert.equal(finding(r, 'r_t_short')!.outcome, 'violation')
  assert.equal(finding(r, 'r_t_short')!.span, 'Then dry  it on the HOB.')
  assert.equal(finding(r, 'r_t_care')!.outcome, 'pass')
  const missing = await checkItem(doc, { text: 'Wash it.', surface: 'packaging_copy' })
  assert.equal(finding(missing, 'r_t_care')!.outcome, 'violation')
  assert.equal(finding(missing, 'r_t_care')!.span, null)
})

test('structural: predicates needing judgment, unknown predicates and bad params are not_evaluable', async () => {
  const r = await checkItem(corvane, { text: CLEAN, surface: 'editorial' })
  assert.equal(finding(r, 'r_claims_approved')!.outcome, 'not_evaluable')
  assert.equal(finding(r, 'r_self_reference')!.outcome, 'not_evaluable')
  const unknown = withRule({ rule_id: 'r_t_unknown', statement: 'x', check_class: 'deterministic_structural', predicate: { type: 'reading_age', params: {} } })
  assert.match(finding(await checkItem(unknown, { text: CLEAN, surface: 'editorial' }), 'r_t_unknown')!.evidence, /not implemented/)
  const bad = withRule({ rule_id: 'r_t_bad', statement: 'x', check_class: 'deterministic_structural', predicate: { type: 'max_sentence_words', params: { max: 'ten' } } })
  assert.equal(finding(await checkItem(bad, { text: CLEAN, surface: 'editorial' }), 'r_t_bad')!.outcome, 'not_evaluable')
})

test('selection: scope comes from the schema, and nothing in scope is skipped silently', async () => {
  const pdp = await checkItem(corvane, { text: CLEAN, surface: 'product_detail_page' })
  // Every rule is either a finding or out of scope with a reason.
  assert.equal(pdp.event.findings.length + pdp.outOfScope.length, corvane.rules.length)
  assert.ok(pdp.outOfScope.some((o) => o.rule_id === 'r_social_formality_floor'))
  assert.ok(pdp.outOfScope.some((o) => o.rule_id === 'r_audio_tempo'))
  assert.equal(finding(pdp, 'r_forbidden_colour')!.outcome, 'not_evaluable') // visual
  assert.match(finding(pdp, 'r_safety_notice_no_promotion')!.evidence, /activated by the brand/)

  const social = await checkItem(corvane, { text: CLEAN, surface: 'social_organic' })
  assert.ok(finding(social, 'r_social_formality_floor'))
  const audio = await checkItem(corvane, { text: CLEAN, surface: 'audio_script' })
  assert.equal(finding(audio, 'r_audio_tempo')!.outcome, 'not_evaluable') // audio
  const pack = await checkItem(corvane, { text: CLEAN, surface: 'packaging_copy' })
  assert.match(pack.outOfScope.find((o) => o.rule_id === 'r_self_reference')!.reason, /suspends/)
})

test('selection: market-scoped rules need the item’s market', async () => {
  const doc = withRule({
    rule_id: 'r_t_uk',
    statement: 'No "cookware set" in the UK.',
    check_class: 'deterministic_exact',
    markets: ['GB'],
    match: { terms: ['cookware set'], mode: 'phrase', normalization: 'casefold_nfkc' },
  })
  const text = 'The cookware set.'
  assert.equal(finding(await checkItem(doc, { text, surface: 'editorial' }), 'r_t_uk')!.outcome, 'not_evaluable')
  assert.ok((await checkItem(doc, { text, surface: 'editorial', market: 'US' })).outOfScope.some((o) => o.rule_id === 'r_t_uk'))
  assert.equal(finding(await checkItem(doc, { text, surface: 'editorial', market: 'GB' }), 'r_t_uk')!.outcome, 'violation')
})

test('judged: with no judge, judged rules are void and the item needs review', async () => {
  const r = await checkItem(ratified(corvane), { text: CLEAN, surface: 'product_detail_page' })
  const f = finding(r, 'r_not_a_gadget')!
  assert.equal(f.outcome, 'void')
  assert.match(f.evidence, /no judge/)
  assert.equal(r.findingsVerdict, 'review_required')
  assert.equal(r.event.verdict, 'review_required')
})

test('judged: the judge gets only the rule’s own rubric material', async () => {
  let seen: JudgeRequest | undefined
  await checkItem(corvane, {
    text: CLEAN,
    surface: 'email_retention',
  }, {
    judge: {
      judge: async (req) => {
        if (req.rule_id === 'r_no_invented_heritage') seen = req
        return { outcome: 'undecided', span: null, cited: [], judge_type: 'model', judge_id: 'm' }
      },
    },
  })
  assert.deepEqual(seen!.examples.map((e) => e.example_id), ['ex_email_honest_age', 'ex_email_heritage_costume'])
  assert.deepEqual(seen!.rails.map((r) => r.rail_id), ['rail_heritage'])
  assert.equal(seen!.text, CLEAN)
})

test('judged: a cited, quoted answer counts; anything else is void', async () => {
  const run = async (judge: Judge) =>
    finding(await checkItem(ratified(corvane), { text: CLEAN, surface: 'product_detail_page' }, { judge }), 'r_not_a_gadget')!

  const ok = await run(agreeingJudge)
  assert.equal(ok.outcome, 'pass')
  assert.equal(ok.judge.id, 'test-model-1')
  assert.match(ok.evidence, /cites ex_pdp_seasoning/)

  assert.equal((await run(scripted(() => ({ outcome: 'violation', span: 'a quote not in the item', cited: ['ex_pdp_gadget'] })))).outcome, 'void')
  assert.equal((await run(scripted((r) => ({ outcome: 'violation', span: r.text.slice(0, 10), cited: ['ex_somewhere_else'] })))).outcome, 'void')
  assert.equal((await run(scripted(() => ({ outcome: 'undecided', span: null, cited: [] })))).outcome, 'void')
  assert.equal((await run({ judge: async () => { throw new Error('rate limited') } })).outcome, 'void')

  const bad = await run(scripted((r) => ({ outcome: 'violation', span: r.text.slice(0, 20), cited: ['ex_pdp_gadget'] })))
  assert.equal(bad.outcome, 'violation')
  assert.equal(bad.severity, 'strong')
})

test('a ratified schema with every rule passing gives pass', async () => {
  const r = await checkItem(ratified(corvane), { text: CLEAN, surface: 'product_detail_page' }, { judge: agreeingJudge })
  assert.equal(r.event.verdict, 'pass')
  assert.equal(r.event.schema.ratification_id, 'rat_test')
  assert.ok(r.notes.some((n) => n.includes('not confirmed')))
  // r_claims_approved is absolute and needs judgment to decide: the pass says it does not cover it.
  assert.ok(r.notes.some((n) => n.includes('could not be checked here') && n.includes('r_claims_approved')))
})

test('a public summary is checked, but never certifiable, and private rules are absent', async () => {
  const summary = extractSummary(corvane) as Obj
  const r = await checkItem(summary, { text: CLEAN, surface: 'product_detail_page' })
  assert.equal(r.event.verdict, 'not_certifiable')
  assert.ok(r.notes.some((n) => n.includes('public summary')))
  const privateIds = corvane.rules.filter((x: Obj) => x.visibility === 'private').map((x: Obj) => x.rule_id)
  assert.ok(privateIds.length > 0)
  assert.ok(privateIds.every((id: string) => !finding(r, id)))
})

test('RMT4: no option selects, skips or tunes rules', async () => {
  await assert.rejects(
    checkItem(corvane, { text: CLEAN, surface: 'editorial' }, { skip_rules: ['r_no_urgency'] } as any),
    (e: Error) => e instanceof CheckError && /cannot be selected, skipped or tuned/.test(e.message),
  )
  await assert.rejects(checkItem(corvane, { text: CLEAN, surface: 'editorial', rules: [] } as any), CheckError)
  await assert.rejects(checkItem(corvane, { text: CLEAN, surface: 'editorial' }, { severity_floor: 'absolute' } as any), CheckError)
})

test('deterministic findings are the same on every run', async () => {
  const text = 'Hurry! Last chance: save 30% on the lifetime warranty pan.'
  const a = await checkItem(corvane, { text, surface: 'social_paid' })
  const b = await checkItem(corvane, { text, surface: 'social_paid' })
  assert.deepEqual(a.event.findings, b.event.findings)
  assert.equal(a.event.item_hash, b.event.item_hash)
})

test('refuses what it cannot check honestly', async () => {
  await assert.rejects(checkItem(archetype, { text: CLEAN, surface: 'editorial' }), /archetype template/)
  await assert.rejects(checkItem({ meta: {} }, { text: CLEAN, surface: 'editorial' }), CheckError)
  const tampered = structuredClone(corvane)
  tampered.rules[0].severity = 'contextual'
  await assert.rejects(checkItem(tampered, { text: CLEAN, surface: 'editorial' }), /not valid/)
  await assert.rejects(checkItem(corvane, { text: CLEAN, surface: 'billboard' }), /surfaces/)
  const empty = await checkItem(corvane, { text: '   ', surface: 'editorial' })
  assert.equal(empty.event.verdict, 'not_evaluable')
})

test('the surface list is the spec’s', () => {
  assert.equal(OUTPUT_SURFACES.length, 17)
})
