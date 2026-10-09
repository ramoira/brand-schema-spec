// The validation invariants JSON Schema cannot express (SPEC.md section 9).
// Each issue names the invariant it enforces so failures are traceable.

import { computeContentHash } from './hash.ts'
import { pointerResolvesInSchema } from './pointer.ts'
import { specSchema } from './schemas.ts'

export type Level = 'error' | 'warning'
export interface Issue {
  level: Level
  invariant: number | null
  path: string
  message: string
}
export type SchemaKind = 'full' | 'archetype' | 'summary'

type Obj = Record<string, any>

const BRAND_JUDGES = new Set(['brand_owner', 'brand_team'])

interface Located<T> {
  value: T
  path: string
}

// Every rail in the document, wherever it sits: rails are the only objects carrying rail_id.
function collectRails(node: unknown, path: string, out: Located<Obj>[]): void {
  if (Array.isArray(node)) {
    node.forEach((item, i) => collectRails(item, `${path}/${i}`, out))
  } else if (node && typeof node === 'object') {
    const obj = node as Obj
    if (typeof obj.rail_id === 'string') out.push({ value: obj, path })
    for (const [k, v] of Object.entries(obj)) collectRails(v, `${path}/${k}`, out)
  }
}

function indexById<T extends Obj>(
  items: Located<T>[],
  key: string,
  label: string,
  issues: Issue[],
): Map<string, Located<T>> {
  const map = new Map<string, Located<T>>()
  for (const item of items) {
    const id = item.value[key]
    if (typeof id !== 'string') continue
    if (map.has(id)) {
      issues.push({
        level: 'error',
        invariant: 2,
        path: item.path,
        message: `duplicate ${label} "${id}" (first at ${map.get(id)!.path})`,
      })
    } else {
      map.set(id, item)
    }
  }
  return map
}

function located<T>(arr: unknown, path: string): Located<T>[] {
  return Array.isArray(arr) ? arr.map((value, i) => ({ value: value as T, path: `${path}/${i}` })) : []
}

export function checkInvariants(doc: Obj, kind: SchemaKind): Issue[] {
  const issues: Issue[] = []
  const err = (invariant: number | null, path: string, message: string) =>
    issues.push({ level: 'error', invariant, path, message })
  const warn = (invariant: number | null, path: string, message: string) =>
    issues.push({ level: 'warning', invariant, path, message })
  // In a summary, a reference may point into material the summary excludes
  // (a private rule, a governance rail). That is a warning, not an error.
  const missingRef = (invariant: number, path: string, message: string) =>
    kind === 'summary' ? warn(invariant, path, `${message} (not in this summary)`) : err(invariant, path, message)

  const meta: Obj = doc.ramoira ?? {}
  const governance: Obj = doc.governance ?? {}
  const provenance: Obj | undefined = doc.draft_provenance

  // ── Invariant 2: ids unique; every reference resolves ────────────────────
  const rules = indexById(located<Obj>(doc.rules, '/rules'), 'rule_id', 'rule_id', issues)
  const examples = indexById(located<Obj>(doc.voice?.examples, '/voice/examples'), 'example_id', 'example_id', issues)
  const railList: Located<Obj>[] = []
  collectRails(doc, '', railList)
  const rails = indexById(railList, 'rail_id', 'rail_id', issues)
  indexById(
    located<Obj>(doc.narrative?.semiotic?.denotative?.claims, '/narrative/semiotic/denotative/claims'),
    'claim_id',
    'claim_id',
    issues,
  )
  const situations = indexById(located<Obj>(governance.situations, '/governance/situations'), 'situation_id', 'situation_id', issues)
  const participants = indexById(
    located<Obj>(provenance?.participants, '/draft_provenance/participants'),
    'participant_id',
    'participant_id',
    issues,
  )
  indexById(located<Obj>(doc.archetype?.delta_zones, '/archetype/delta_zones'), 'zone_id', 'zone_id', issues)
  const contrastSets = indexById(
    located<Obj>(provenance?.contrast_sets, '/draft_provenance/contrast_sets'),
    'set_id',
    'set_id',
    issues,
  )

  for (const { value: rule, path } of rules.values()) {
    if (Array.isArray(rule.situations)) {
      rule.situations.forEach((sid: string, i: number) => {
        if (!situations.has(sid)) missingRef(2, `${path}/situations/${i}`, `unknown situation_id "${sid}"`)
      })
    }
    const rubric: Obj | undefined = rule.rubric
    if (!rubric) continue
    ;(rubric.example_refs ?? []).forEach((ref: string, i: number) => {
      if (!examples.has(ref)) missingRef(2, `${path}/rubric/example_refs/${i}`, `unknown example_id "${ref}"`)
    })
    ;(rubric.rail_refs ?? []).forEach((ref: string, i: number) => {
      if (!rails.has(ref)) missingRef(2, `${path}/rubric/rail_refs/${i}`, `unknown rail_id "${ref}"`)
    })
  }

  // ── Invariant 3: check-class requirements (judged rubric sufficiency) ────
  for (const { value: rule, path } of rules.values()) {
    if (rule.check_class !== 'judged_bounded' || !rule.rubric) continue
    const cited = (rule.rubric.example_refs ?? []).map((r: string) => examples.get(r)?.value).filter(Boolean) as Obj[]
    const hasApproved = cited.some((e) => e.verdict === 'approved')
    const hasRejected = cited.some((e) => e.verdict === 'rejected')
    const pairedRail = (rule.rubric.rail_refs ?? []).some((r: string) => {
      const rail = rails.get(r)?.value
      return Boolean(rail?.example && rail?.antiExample)
    })
    if (!(hasApproved && hasRejected) && !pairedRail) {
      err(
        3,
        `${path}/rubric`,
        `judged_bounded rule "${rule.rule_id}" needs at least one approved and one rejected example, or a rail with both an example and an antiExample`,
      )
    }
  }

  // ── Invariant 4: archetype templates carry no brand, ratification or URL ─
  if (kind === 'archetype') {
    for (const key of ['brand_id', 'ratification', 'canonical_url']) {
      if (meta[key] !== null) err(4, `/ramoira/${key}`, `an archetype template must have ${key}: null`)
    }
    if (!doc.archetype) err(4, '/archetype', 'an archetype template must carry the archetype block')
  } else if (doc.archetype !== undefined) {
    err(4, '/archetype', 'only an archetype template carries the archetype block')
  }

  // ── Invariant 5: what a ratification pointer requires ────────────────────
  if (meta.ratification) {
    if (meta.ratification.ratified_hash !== meta.content_hash) {
      err(
        5,
        '/ramoira/ratification/ratified_hash',
        'ratified_hash differs from content_hash: this file is an unratified edit of a ratified version',
      )
    }
    for (const { value: rule, path } of rules.values()) {
      if (rule.provenance === 'inherited' && rule.affirmed === false) {
        err(5, path, `rule "${rule.rule_id}" is inherited and unaffirmed; ratification is blocked until the brand affirms it`)
      }
    }
    for (const { value: rule, path } of rules.values()) {
      ;(rule.rubric?.example_refs ?? []).forEach((ref: string, i: number) => {
        const ex = examples.get(ref)?.value
        if (ex && !BRAND_JUDGES.has(ex.judged_by)) {
          err(
            5,
            `${path}/rubric/example_refs/${i}`,
            `rubric example "${ref}" is judged_by ${ex.judged_by}; in a ratified schema rubric examples must be judged by brand_owner or brand_team`,
          )
        }
      })
    }
  }

  // ── Invariant 6: suspensions reference only contextual rules ─────────────
  const suspensionSources: Located<Obj>[] = [
    ...located<Obj>(governance.surfaces, '/governance/surfaces'),
    ...located<Obj>(governance.situations, '/governance/situations'),
  ]
  for (const { value: holder, path } of suspensionSources) {
    ;(holder.suspended_rule_ids ?? []).forEach((rid: string, i: number) => {
      const rule = rules.get(rid)?.value
      if (!rule) {
        missingRef(2, `${path}/suspended_rule_ids/${i}`, `unknown rule_id "${rid}"`)
      } else if (rule.severity !== 'contextual') {
        err(6, `${path}/suspended_rule_ids/${i}`, `rule "${rid}" is ${rule.severity}; only contextual rules can be suspended`)
      }
    })
  }
  for (const { value: surface, path } of located<Obj>(governance.surfaces, '/governance/surfaces')) {
    if (surface.primaryRail !== undefined && !rails.has(surface.primaryRail)) {
      missingRef(2, `${path}/primaryRail`, `unknown rail_id "${surface.primaryRail}"`)
    }
  }

  // ── Invariant 7: the summary holds only what it may ──────────────────────
  if (kind === 'summary') {
    const optIn = new Set<string>(meta.summary_opt_in ?? [])
    for (const { value: rule, path } of rules.values()) {
      if (rule.visibility !== 'public') err(7, path, `private rule "${rule.rule_id}" in a summary`)
    }
    for (const layer of ['commercial', 'governance']) {
      if (doc[layer] !== undefined && !optIn.has(layer)) err(7, `/${layer}`, `${layer} layer in a summary without opt-in`)
    }
    if (doc.identity?.prism?.culture?.sacredBoundary !== undefined && !optIn.has('sacred_boundary')) {
      err(7, '/identity/prism/culture/sacredBoundary', 'sacredBoundary in a summary without opt-in')
    }
    if (doc.draft_provenance !== undefined) err(7, '/draft_provenance', 'draft_provenance is never in a summary')
  }

  // ── Invariant 8: content_hash recomputes ─────────────────────────────────
  if (kind !== 'summary' && typeof meta.content_hash === 'string') {
    const expected = computeContentHash(doc)
    if (meta.content_hash !== expected) {
      err(8, '/ramoira/content_hash', `content_hash does not recompute; expected ${expected}`)
    }
  }

  // ── Invariant 9: archetype delta zones resolve ───────────────────────────
  for (const { value: zone, path } of located<Obj>(doc.archetype?.delta_zones, '/archetype/delta_zones')) {
    const pointers: Located<string>[] = [
      ...located<string>(zone.fields, `${path}/fields`),
      ...(zone.divergence_signals ?? []).flatMap((s: Obj, i: number) =>
        located<string>(s.fields, `${path}/divergence_signals/${i}/fields`),
      ),
    ]
    for (const { value: pointer, path: p } of pointers) {
      if (!pointerResolvesInSchema(specSchema, pointer)) err(9, p, `"${pointer}" is not a v3 field`)
    }
    ;(zone.situation_ids ?? []).forEach((sid: string, i: number) => {
      if (!situations.has(sid)) err(9, `${path}/situation_ids/${i}`, `situation "${sid}" is not in governance.situations`)
    })
  }
  // Not an invariant, but the same mistake: draft_provenance pointers that name no v3 field.
  if (provenance) {
    const pointers: Located<string>[] = [
      ...located<Obj>(provenance.delta_answers, '/draft_provenance/delta_answers').map(({ value, path }) => ({
        value: value.field as string,
        path: `${path}/field`,
      })),
      ...Object.keys(provenance.fields ?? {}).map((p) => ({ value: p, path: '/draft_provenance/fields' })),
      ...located<Obj>(provenance.contrast_sets, '/draft_provenance/contrast_sets').map(({ value, path }) => ({
        value: value.field as string,
        path: `${path}/field`,
      })),
      ...located<Obj>(provenance.reactions, '/draft_provenance/reactions').flatMap(({ value, path }) =>
        located<string>(value.resulted_in?.fields, `${path}/resulted_in/fields`),
      ),
    ]
    for (const { value: pointer, path } of pointers) {
      if (typeof pointer === 'string' && !pointerResolvesInSchema(specSchema, pointer)) {
        warn(null, path, `"${pointer}" is not a v3 field`)
      }
    }
  }

  // ── Invariant 10: scale deltas stay within 0–10 ──────────────────────────
  const base = {
    formality: doc.identity?.prism?.relationship?.formality as number | undefined,
    warmth: doc.identity?.prism?.relationship?.warmth as number | undefined,
  }
  const deltaHolders: Located<Obj>[] = [
    ...located<Obj>(doc.voice?.contextVariants, '/voice/contextVariants'),
    ...located<Obj>(governance.situations, '/governance/situations').map(({ value, path }) => ({
      value: (value.voice ?? {}) as Obj,
      path: `${path}/voice`,
    })),
  ]
  for (const { value: holder, path } of deltaHolders) {
    for (const axis of ['formality', 'warmth'] as const) {
      const delta = holder[`${axis}Delta`]
      if (typeof delta !== 'number') continue
      const from = base[axis]
      if (typeof from !== 'number') {
        warn(10, `${path}/${axis}Delta`, `${axis}Delta set but identity.prism.relationship.${axis} is not`)
        continue
      }
      const result = from + delta
      if (result < 0 || result > 10) {
        err(10, `${path}/${axis}Delta`, `${axis} ${from} ${delta >= 0 ? '+' : ''}${delta} = ${result}, outside 0–10`)
      }
    }
  }

  // ── Invariant 11: promoted examples carry the reacting participant's role ─
  const promoted = new Set<string>()
  for (const { value: reaction, path } of located<Obj>(provenance?.reactions, '/draft_provenance/reactions')) {
    const who = participants.get(reaction.answered_by)?.value
    if (!who) {
      err(2, `${path}/answered_by`, `unknown participant "${reaction.answered_by}"`)
      continue
    }
    ;(reaction.resulted_in?.example_ids ?? []).forEach((exId: string, i: number) => {
      promoted.add(exId)
      const ex = examples.get(exId)?.value
      if (!ex) {
        err(2, `${path}/resulted_in/example_ids/${i}`, `unknown example_id "${exId}"`)
      } else if (ex.judged_by !== who.role) {
        err(
          11,
          `${path}/resulted_in/example_ids/${i}`,
          `example "${exId}" is judged_by ${ex.judged_by} but was promoted from a reaction by ${who.role}`,
        )
      }
    })
  }
  for (const { value: answer, path } of located<Obj>(provenance?.delta_answers, '/draft_provenance/delta_answers')) {
    if (!participants.has(answer.answered_by)) err(2, `${path}/answered_by`, `unknown participant "${answer.answered_by}"`)
  }

  // ── Invariant 12: the elicitation record is consistent (3.1.0) ───────────
  const closeness = located<Obj>(provenance?.closeness_ratings, '/draft_provenance/closeness_ratings')
  const competitors = located<Obj>(provenance?.competitor_ratings, '/draft_provenance/competitor_ratings')
  const retests = located<Obj>(provenance?.retests, '/draft_provenance/retests')
  const raters: Located<Obj>[] = [
    ...closeness.filter(({ value }) => value.answered_by !== undefined),
    ...competitors,
    ...contrastSets.values(),
    ...retests,
  ]
  for (const { value, path } of raters) {
    if (!participants.has(value.answered_by)) err(2, `${path}/answered_by`, `unknown participant "${value.answered_by}"`)
  }
  const seen = new Map<string, string>()
  const once = (key: string, path: string, what: string) => {
    if (seen.has(key)) err(12, path, `${what} is rated twice (first at ${seen.get(key)})`)
    else seen.set(key, path)
  }
  for (const { value: r, path } of closeness) {
    if (r.exemplars_known === false && r.closeness !== null) {
      err(12, `${path}/closeness`, 'exemplars_known is false, so closeness must be null')
    }
    once(`c|${r.archetype_id}|${r.answered_by ?? ''}|${r.basis ?? 'intended'}`, path, `archetype "${r.archetype_id}"`)
  }
  for (const { value: r, path } of competitors) {
    if (r.exemplars_known === false && r.closeness !== null) {
      err(12, `${path}/closeness`, 'exemplars_known is false, so closeness must be null')
    }
    once(`k|${r.competitor_name}|${r.archetype_id}|${r.answered_by}`, path, `competitor "${r.competitor_name}" on "${r.archetype_id}"`)
  }
  // A choice (in a contrast set or its retest) picks among the set's probes.
  const checkChoice = (choice: Obj, probes: string[], path: string) => {
    for (const key of ['best', 'worst'] as const) {
      if (choice[key] !== null && !probes.includes(choice[key])) {
        err(12, `${path}/${key}`, `"${choice[key]}" is not one of the set's probe_ids`)
      }
    }
    if (choice.best !== null && choice.best === choice.worst) err(12, `${path}/worst`, 'best and worst are the same probe')
    if (choice.none_of_these && choice.best !== null) err(12, `${path}/best`, 'none_of_these is true, so best must be null')
    if (!choice.none_of_these && choice.best === null) err(12, `${path}/best`, 'best is null, so none_of_these must be true')
  }
  const setReactions = located<Obj>(provenance?.reactions, '/draft_provenance/reactions').filter(
    ({ value }) => value.set_id !== undefined,
  )
  for (const { value: set, path } of contrastSets.values()) {
    checkChoice(set, set.probe_ids, path)
    for (const [key, expected] of [['best', 'yes'], ['worst', 'no']] as const) {
      if (set[key] === null) continue
      const reaction = setReactions.find(({ value }) => value.set_id === set.set_id && value.probe_id === set[key])?.value
      if (!reaction) {
        err(12, `${path}/${key}`, `no reaction records the ${key} probe "${set[key]}" for set "${set.set_id}"`)
      } else if (reaction.reaction !== expected || reaction.answered_by !== set.answered_by) {
        err(12, `${path}/${key}`, `the ${key} probe must be recorded as "${expected}" by ${set.answered_by}`)
      }
    }
  }
  for (const { value: reaction, path } of setReactions) {
    const set = contrastSets.get(reaction.set_id)?.value
    if (!set) err(2, `${path}/set_id`, `unknown set_id "${reaction.set_id}"`)
    else if (reaction.probe_id !== set.best && reaction.probe_id !== set.worst) {
      err(12, `${path}/probe_id`, `"${reaction.probe_id}" is neither the best nor the worst probe of set "${set.set_id}"`)
    }
  }
  for (const { value: retest, path } of retests) {
    const set = contrastSets.get(retest.set_id)?.value
    if (!set) {
      err(2, `${path}/set_id`, `unknown set_id "${retest.set_id}"`)
      continue
    }
    checkChoice(retest, set.probe_ids, path)
    if (retest.answered_by !== set.answered_by) {
      err(12, `${path}/answered_by`, `a retest is answered by the same participant as its set (${set.answered_by})`)
    }
  }
  if (provenance) {
    for (const { value: ex, path } of examples.values()) {
      if (ex.source === 'owner_reaction' && !promoted.has(ex.example_id)) {
        warn(11, path, `example "${ex.example_id}" has source owner_reaction but no reaction links to it`)
      }
    }
  }

  // ── Thinness (not an invariant): unfilled fields are shown at ratification ─
  const unfilled = Object.entries(provenance?.fields ?? {}).filter(([, status]) => status === 'unfilled')
  if (unfilled.length > 0) {
    warn(null, '/draft_provenance/fields', `${unfilled.length} field(s) unfilled: ${unfilled.map(([p]) => p).join(', ')}`)
  }

  return issues
}
