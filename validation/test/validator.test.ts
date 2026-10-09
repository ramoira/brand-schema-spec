import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { canonicalize, computeContentHash, extractSummary, validateDocument } from '../index.ts'
import type { Issue } from '../index.ts'
import { pointerResolvesInSchema } from '../lib/pointer.ts'
import { specSchema } from '../lib/schemas.ts'

type Obj = Record<string, any>

const read = (path: string): Obj => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'))
const corvane = () => read('examples/corvane/brand.schema.json')
const archetype = () => read('examples/archetype-template/archetype.schema.json')
const record = () => read('validation/test/fixtures/verdict.json')

const rehash = (doc: Obj): Obj => {
  doc.ramoira.content_hash = computeContentHash(doc)
  return doc
}
const rule = (doc: Obj, id: string): Obj => doc.rules.find((r: Obj) => r.rule_id === id)
const errors = (doc: unknown): Issue[] => validateDocument(doc).issues.filter((i) => i.level === 'error')
const failsInvariant = (doc: unknown, invariant: number) => {
  const errs = errors(doc)
  assert.ok(
    errs.some((e) => e.invariant === invariant),
    `expected invariant ${invariant} to fail; got ${JSON.stringify(errs, null, 2)}`,
  )
}
const failsSchema = (doc: unknown, pattern?: RegExp) => {
  const errs = errors(doc)
  assert.ok(errs.length > 0, 'expected a schema error')
  if (pattern) assert.ok(errs.some((e) => pattern.test(`${e.path} ${e.message}`)), JSON.stringify(errs, null, 2))
}

// A ratifiable copy of Corvane: every rule affirmed, every rubric example brand-judged.
const ratified = (): Obj => {
  const doc = corvane()
  doc.ramoira.content_hash = computeContentHash(doc)
  doc.ramoira.ratification = {
    ratification_id: 'rat_1',
    ratified_hash: doc.ramoira.content_hash,
    ratified_at: '2026-10-07T10:00:00Z',
    ratifier_role: 'founder',
  }
  return doc
}

describe('examples', () => {
  for (const path of [
    'examples/corvane/brand.schema.json',
    'examples/corvane/brand.schema.summary.json',
    'examples/minimal/brand.schema.json',
    'examples/minimal/brand.schema.summary.json',
    'examples/archetype-template/archetype.schema.json',
    'schemas/brand.schema.json',
    'schemas/brand.schema.summary.json',
    'validation/test/fixtures/verdict.json',
    'validation/test/fixtures/adoption.json',
  ]) {
    it(`${path} is valid`, () => assert.deepEqual(errors(read(path)), []))
  }

  it('the committed summaries are exactly what extractSummary produces', () => {
    for (const dir of ['corvane', 'minimal']) {
      const full = read(`examples/${dir}/brand.schema.json`)
      assert.deepEqual(read(`examples/${dir}/brand.schema.summary.json`), extractSummary(full))
    }
  })

  it('a ratified schema with everything affirmed and brand-judged is valid', () => {
    assert.deepEqual(errors(ratified()), [])
  })
})

describe('P1 exit test: no results in a schema', () => {
  for (const field of ['certified', 'confidence', 'conformance_rate', 'expires_at', 'density_score']) {
    it(`rejects ramoira.${field}`, () => {
      const doc = corvane()
      doc.ramoira[field] = field === 'certified' ? true : 0.95
      failsSchema(doc, new RegExp(`additional|${field}`))
    })
  }
  it('rejects results smuggled into a layer', () => {
    const doc = corvane()
    doc.voice.confidence = 0.9
    failsSchema(doc)
  })
  it('rejects a certified workflow_state', () => {
    const doc = corvane()
    doc.ramoira.workflow_state = 'certified'
    failsSchema(doc, /workflow_state/)
  })
  it('rejects an advisory_only rule', () => {
    const doc = corvane()
    rule(doc, 'r_not_a_gadget').check_class = 'advisory_only'
    failsSchema(doc, /check_class/)
  })
  it('rejects a 2.0.0 document with a pointer to the migration guide', () => {
    failsSchema({ meta: { brandId: 'x' } }, /2\.0\.0/)
  })
})

describe('check-class shape (schema)', () => {
  it('an exact rule needs match and nothing else', () => {
    const doc = corvane()
    delete rule(doc, 'r_fear_vocabulary').match
    failsSchema(rehash(doc))
  })
  it('a structural rule cannot carry a rubric', () => {
    const doc = corvane()
    rule(doc, 'r_claims_approved').rubric = { question: null, example_refs: [], rail_refs: ['rail_heritage'] }
    failsSchema(rehash(doc))
  })
  it('a violation response is not stored', () => {
    const doc = corvane()
    rule(doc, 'r_fear_vocabulary').violationResponse = 'block_output'
    failsSchema(rehash(doc))
  })
})

describe('invariant 2: unique ids, resolving references', () => {
  it('duplicate rule_id', () => {
    const doc = corvane()
    doc.rules.push({ ...rule(doc, 'r_no_exclamation') })
    failsInvariant(rehash(doc), 2)
  })
  it('duplicate rail_id across layers', () => {
    const doc = corvane()
    doc.voice.contextVariants[0].rails.push({ rail_id: 'rail_heritage', context: 'x', instruction: 'y' })
    failsInvariant(rehash(doc), 2)
  })
  it('unknown example in a rubric', () => {
    const doc = corvane()
    rule(doc, 'r_not_a_gadget').rubric.example_refs.push('ex_missing')
    failsInvariant(rehash(doc), 2)
  })
  it('unknown situation on a rule', () => {
    const doc = corvane()
    rule(doc, 'r_safety_notice_no_promotion').situations = ['sit_missing']
    failsInvariant(rehash(doc), 2)
  })
  it('unknown participant', () => {
    const doc = corvane()
    doc.draft_provenance.delta_answers[0].answered_by = 'p_nobody'
    failsInvariant(doc, 2)
  })
})

describe('invariant 3: judged rules need bounded rubric material', () => {
  it('two approved examples are not enough', () => {
    const doc = corvane()
    rule(doc, 'r_not_a_gadget').rubric.example_refs = ['ex_pdp_seasoning', 'ex_social_ritual']
    failsInvariant(rehash(doc), 3)
  })
  it('a rail without an antiExample is not enough', () => {
    const doc = corvane()
    rule(doc, 'r_not_a_gadget').rubric = { question: null, example_refs: [], rail_refs: ['rail_restock'] }
    failsInvariant(rehash(doc), 3)
  })
  it('a rail with example and antiExample is enough', () => {
    const doc = corvane()
    rule(doc, 'r_not_a_gadget').rubric = { question: null, example_refs: [], rail_refs: ['rail_effort'] }
    assert.deepEqual(errors(rehash(doc)), [])
  })
})

describe('invariant 4: archetype templates', () => {
  it('cannot carry a brand_id', () => {
    const doc = archetype()
    doc.ramoira.brand_id = 'someone'
    failsSchema(doc)
  })
  it('cannot be ratified', () => {
    const doc = archetype()
    doc.ramoira.ratification = {
      ratification_id: 'rat_1',
      ratified_hash: doc.ramoira.content_hash,
      ratified_at: '2026-10-07T10:00:00Z',
      ratifier_role: 'founder',
    }
    failsSchema(doc)
  })
  it('a full schema cannot carry the archetype block', () => {
    const doc = corvane()
    doc.archetype = archetype().archetype
    failsSchema(doc)
  })
})

describe('invariant 5: ratification', () => {
  it('ratified_hash must equal content_hash', () => {
    const doc = ratified()
    doc.identity.prism.personality.characterBrief = 'edited after ratification'
    doc.ramoira.content_hash = computeContentHash(doc)
    failsInvariant(doc, 5)
  })
  it('blocked by an inherited, unaffirmed rule', () => {
    const doc = ratified()
    rule(doc, 'r_no_disposable_language').affirmed = false
    rehash(doc)
    doc.ramoira.ratification.ratified_hash = doc.ramoira.content_hash
    failsInvariant(doc, 5)
  })
  it('rubric examples must be brand-judged', () => {
    const doc = ratified()
    doc.voice.examples.find((e: Obj) => e.example_id === 'ex_pdp_gadget').judged_by = 'agency'
    doc.draft_provenance.reactions = []
    rehash(doc)
    doc.ramoira.ratification.ratified_hash = doc.ramoira.content_hash
    failsInvariant(doc, 5)
  })
  it('an unratified draft may still hold agency-judged examples', () => {
    const doc = corvane()
    doc.voice.examples.find((e: Obj) => e.example_id === 'ex_social_hype').judged_by = 'agency'
    assert.deepEqual(errors(rehash(doc)), [])
  })
})

describe('invariant 6: only contextual rules can be suspended', () => {
  it('suspending a strong rule on a surface', () => {
    const doc = corvane()
    doc.governance.surfaces[0].suspended_rule_ids = ['r_no_urgency']
    failsInvariant(rehash(doc), 6)
  })
  it('suspending an absolute rule in a situation', () => {
    const doc = corvane()
    doc.governance.situations[0].suspended_rule_ids = ['r_fear_vocabulary']
    failsInvariant(rehash(doc), 6)
  })
})

describe('invariant 7: the summary', () => {
  const summary = () => read('examples/corvane/brand.schema.summary.json')
  it('no private rule', () => {
    const doc = summary()
    doc.rules.push(rule(corvane(), 'r_no_urgency'))
    failsSchema(doc)
  })
  it('no commercial layer without opt-in', () => {
    const doc = summary()
    doc.commercial = corvane().commercial
    failsSchema(doc)
  })
  it('commercial layer with opt-in', () => {
    const doc = summary()
    doc.commercial = corvane().commercial
    doc.ramoira.summary_opt_in = ['commercial']
    assert.deepEqual(errors(doc), [])
  })
  it('no sacredBoundary without opt-in', () => {
    const doc = summary()
    doc.identity.prism.culture.sacredBoundary = 'x'
    failsSchema(doc)
  })
  it('never draft_provenance', () => {
    const doc = summary()
    doc.draft_provenance = corvane().draft_provenance
    failsSchema(doc)
  })
  it('extractSummary honours opt-in identically', () => {
    const full = corvane()
    full.ramoira.summary_opt_in = ['governance', 'sacred_boundary']
    const s = extractSummary(full)
    assert.ok(s.governance)
    assert.equal(s.commercial, undefined)
    assert.ok(s.identity.prism.culture.sacredBoundary)
    assert.deepEqual(errors(s), [])
  })
})

describe('invariant 8: content_hash', () => {
  it('a meaning change without rehashing fails', () => {
    const doc = corvane()
    doc.narrative.myth.mythStatement = 'Something else.'
    failsInvariant(doc, 8)
  })
  it('metadata and provenance are outside the hash', () => {
    const doc = corvane()
    const before = computeContentHash(doc)
    doc.ramoira.workflow_state = 'published'
    doc.draft_provenance.fields['/voice/approvedTones'] = 'authored'
    assert.equal(computeContentHash(doc), before)
  })
  it('key order and whitespace do not change the hash', () => {
    const doc = corvane()
    const reverseKeys = (v: unknown): unknown =>
      Array.isArray(v)
        ? v.map(reverseKeys)
        : v && typeof v === 'object'
          ? Object.fromEntries(Object.entries(v).reverse().map(([k, x]) => [k, reverseKeys(x)]))
          : v
    const reordered = reverseKeys(doc) as Obj
    assert.notEqual(JSON.stringify(reordered), JSON.stringify(doc))
    assert.equal(computeContentHash(reordered), computeContentHash(doc))
  })
})

describe('invariant 9: archetype delta zones resolve', () => {
  it('a v2 path is rejected', () => {
    const doc = archetype()
    doc.archetype.delta_zones[0].fields = ['/voice/contextVariants/competitive/tone']
    failsInvariant(doc, 9)
  })
  it('a dropped v2 field is rejected', () => {
    const doc = archetype()
    doc.archetype.delta_zones[1].fields = ['/identity/prism/relationship/powerDynamic']
    failsInvariant(doc, 9)
  })
  it('an unknown situation is rejected', () => {
    const doc = archetype()
    doc.archetype.delta_zones[3].situation_ids = ['sit_missing']
    failsInvariant(doc, 9)
  })
  it('pointer resolution follows the v3 structure', () => {
    assert.ok(pointerResolvesInSchema(specSchema, '/narrative/myth/culturalTension'))
    assert.ok(pointerResolvesInSchema(specSchema, '/voice/contextVariants/0/formalityDelta'))
    assert.ok(pointerResolvesInSchema(specSchema, '/voice/rails/alternatives/whenPricingForbidden/0/example'))
    assert.ok(pointerResolvesInSchema(specSchema, '/rules/3/rubric/example_refs'))
    assert.ok(!pointerResolvesInSchema(specSchema, '/identity/summary'))
    assert.ok(!pointerResolvesInSchema(specSchema, '/narrative/semiotic/layerHierarchy'))
  })
})

describe('invariant 10: scale deltas stay in range', () => {
  it('context variant pushes formality above 10', () => {
    const doc = corvane()
    doc.voice.contextVariants[0].formalityDelta = 7
    failsInvariant(rehash(doc), 10)
  })
  it('situation pushes warmth below 0', () => {
    const doc = corvane()
    doc.governance.situations[0].voice.warmthDelta = -7
    failsInvariant(rehash(doc), 10)
  })
})

describe('invariant 11: promoted examples keep the reacting participant’s role', () => {
  it('owner reaction promoted as a team-judged example', () => {
    const doc = corvane()
    doc.voice.examples.find((e: Obj) => e.example_id === 'ex_pdp_gadget').judged_by = 'brand_team'
    failsInvariant(rehash(doc), 11)
  })
  it('facilitator reaction cannot become a brand-judged example', () => {
    const doc = corvane()
    doc.draft_provenance.reactions[0].answered_by = 'p_facilitator'
    failsInvariant(doc, 11)
  })
})

// A Corvane copy in the 3.0.0 shape: no field added in 3.1.0.
const at300 = (): Obj => {
  const doc = corvane()
  doc.ramoira.spec_version = '3.0.0'
  const dp = doc.draft_provenance
  dp.closeness_ratings = dp.closeness_ratings
    .filter((r: Obj) => r.answered_by === 'p_owner' && r.basis === 'intended')
    .map(({ archetype_id, closeness }: Obj) => ({ archetype_id, closeness }))
  dp.reactions = dp.reactions.filter((r: Obj) => r.set_id === undefined)
  delete dp.contrast_sets
  delete dp.retests
  delete dp.competitor_ratings
  return doc
}
const contrastSet = (doc: Obj): Obj => doc.draft_provenance.contrast_sets[0]

describe('3.1.0: version gate', () => {
  it('a 3.0.0 document stays valid', () => assert.deepEqual(errors(at300()), []))
  it('a 3.0.0 document cannot carry contrast sets', () => {
    const doc = at300()
    doc.draft_provenance.contrast_sets = corvane().draft_provenance.contrast_sets
    failsSchema(doc, /contrast_sets added in spec 3\.1\.0/)
  })
  it('a 3.0.0 document cannot attribute a closeness rating', () => {
    const doc = at300()
    doc.draft_provenance.closeness_ratings[0].answered_by = 'p_owner'
    failsSchema(doc, /answered_by added in spec 3\.1\.0/)
  })
  it('a 3.1.0 closeness rating names who rated', () => {
    const doc = corvane()
    delete doc.draft_provenance.closeness_ratings[0].answered_by
    failsSchema(doc, /closeness_ratings\/0 .*answered_by/)
  })
  it('changing spec_version does not change content_hash', () => {
    assert.equal(computeContentHash(at300()), computeContentHash(corvane()))
  })
})

describe('invariant 12: the elicitation record is consistent', () => {
  it('unknown exemplars mean a null closeness', () => {
    const doc = corvane()
    doc.draft_provenance.closeness_ratings[0].exemplars_known = false
    failsInvariant(doc, 12)
  })
  it('the same archetype rated twice by one participant on one basis', () => {
    const doc = corvane()
    doc.draft_provenance.closeness_ratings.push({ ...doc.draft_provenance.closeness_ratings[0] })
    failsInvariant(doc, 12)
  })
  it('the same rating on another basis or by another participant is fine', () => {
    assert.deepEqual(errors(corvane()), [])
  })
  it('a competitor rating by an unknown participant', () => {
    const doc = corvane()
    doc.draft_provenance.competitor_ratings[0].answered_by = 'p_nobody'
    failsInvariant(doc, 2)
  })
  it('best must be one of the set\u2019s probes', () => {
    const doc = corvane()
    contrastSet(doc).best = 'probe_elsewhere'
    failsInvariant(doc, 12)
  })
  it('best and worst cannot be the same probe', () => {
    const doc = corvane()
    contrastSet(doc).worst = contrastSet(doc).best
    failsInvariant(doc, 12)
  })
  it('none_of_these and a best probe contradict each other', () => {
    const doc = corvane()
    contrastSet(doc).none_of_these = true
    failsInvariant(doc, 12)
  })
  it('a set with no best probe must say none of these', () => {
    const doc = corvane()
    contrastSet(doc).best = null
    doc.draft_provenance.reactions = doc.draft_provenance.reactions.filter((r: Obj) => r.probe_id !== 'probe_effort_b')
    doc.draft_provenance.retests[0].best = null
    doc.draft_provenance.retests[0].none_of_these = true
    failsInvariant(doc, 12)
  })
  it('the best probe is recorded as a yes reaction', () => {
    const doc = corvane()
    doc.draft_provenance.reactions.find((r: Obj) => r.probe_id === 'probe_effort_b').reaction = 'close'
    failsInvariant(doc, 12)
  })
  it('a reaction names an existing set', () => {
    const doc = corvane()
    doc.draft_provenance.reactions.find((r: Obj) => r.probe_id === 'probe_effort_a').set_id = 'cs_missing'
    failsInvariant(doc, 2)
  })
  it('set_id is unique', () => {
    const doc = corvane()
    doc.draft_provenance.contrast_sets.push({ ...contrastSet(doc) })
    failsInvariant(doc, 2)
  })
  it('a retest is answered by the participant who answered the set', () => {
    const doc = corvane()
    doc.draft_provenance.retests[0].answered_by = 'p_team'
    failsInvariant(doc, 12)
  })
  it('a retest names an existing set', () => {
    const doc = corvane()
    doc.draft_provenance.retests[0].set_id = 'cs_missing'
    failsInvariant(doc, 2)
  })
  it('a retest that disagrees with the set is valid: agreement is computed, not enforced', () => {
    const doc = corvane()
    Object.assign(doc.draft_provenance.retests[0], { best: 'probe_effort_c', worst: 'probe_effort_a' })
    assert.deepEqual(errors(doc), [])
  })
})

describe('verdict record', () => {
  it('a producer self-check is tooling_only', () => {
    const doc = record()
    doc.commissioning_mode = 'producer_self_check'
    doc.adoption_id = null
    doc.certification_standing = 'eligible'
    failsSchema(doc)
  })
  it('an unratified schema gives tooling_only', () => {
    const doc = record()
    doc.schema.ratification_id = null
    failsSchema(doc)
  })
  it('principal_adopted needs an adoption_id', () => {
    const doc = record()
    doc.commissioning_mode = 'principal_adopted'
    failsSchema(doc)
  })
  it('a judged outcome without a span is invalid', () => {
    const doc = record()
    doc.findings[1].span = null
    failsSchema(doc)
  })
  it('a deterministic check never has a judge', () => {
    const doc = record()
    doc.findings[0].judge = { type: 'model', id: 'm' }
    failsSchema(doc)
  })
  it('verdict follows from findings', () => {
    const doc = record()
    doc.verdict = 'pass'
    assert.ok(errors(doc).some((e) => /findings give review_required/.test(e.message)))
  })
  it('an absolute violation fails the item', () => {
    const doc = record()
    doc.findings[0].outcome = 'violation'
    doc.findings[0].span = 'chemical-free'
    doc.findings[0].severity = 'absolute'
    assert.ok(errors(doc).some((e) => /findings give fail/.test(e.message)))
  })
  it('an override clears a strong violation', () => {
    const doc = record()
    doc.verdict = 'pass'
    doc.override = {
      approved_by: 'head of brand',
      approved_at: '2026-10-07T11:00:00Z',
      rationale: 'Quoted from a customer review, with permission.',
      rule_id: 'r_not_a_gadget',
      expires_at: null,
      applies_to: 'item',
    }
    assert.deepEqual(errors(doc), [])
  })
  it('an override cannot clear an absolute violation', () => {
    const doc = record()
    doc.findings[0] = { ...doc.findings[0], outcome: 'violation', span: 'chemical-free', severity: 'absolute' }
    doc.verdict = 'fail'
    doc.override = {
      approved_by: 'head of brand',
      approved_at: '2026-10-07T11:00:00Z',
      rationale: 'x',
      rule_id: 'r_fear_vocabulary',
      expires_at: null,
      applies_to: 'item',
    }
    assert.ok(errors(doc).some((e) => /only strong violations/.test(e.message)))
  })
  it('a record carries no score', () => {
    const doc = record()
    doc.confidence = 0.97
    failsSchema(doc)
  })
})

describe('JCS (RFC 8785)', () => {
  it('sorts keys and drops whitespace', () => {
    assert.equal(canonicalize({ b: 1, a: [2, 'x', null, true] }), '{"a":[2,"x",null,true],"b":1}')
  })
  it('serialises numbers the ECMAScript way', () => {
    assert.equal(canonicalize([1e21, 1e-7, 0.000001, -0, 4.5]), '[1e+21,1e-7,0.000001,0,4.5]')
  })
  it('sorts by UTF-16 code units', () => {
    assert.equal(canonicalize({ '€': 1, '\r': 2, '😀': 3, '1': 4 }), '{"\\r":2,"1":4,"€":1,"😀":3}')
  })
})

it('the precompiled validators match the JSON Schemas (run npm run build:validators if this fails)', async () => {
  const { readFileSync } = await import('node:fs')
  const { generateValidators, GENERATED_PATH } = await import('../build-validators.ts')
  assert.equal(readFileSync(GENERATED_PATH, 'utf8'), generateValidators())
})

it('nothing in the validator generates code at runtime', async () => {
  const { readFileSync } = await import('node:fs')
  const { GENERATED_PATH } = await import('../build-validators.ts')
  assert.doesNotMatch(readFileSync(GENERATED_PATH, 'utf8'), /new Function|eval\(/)
})
