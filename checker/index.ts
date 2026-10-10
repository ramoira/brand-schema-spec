// Reference open checker for Ramoira brand schema 3.x (3.0.0 and 3.1.0).
//
//   checkItem(schema, item, context?) → { event, findingsVerdict, notes, outOfScope }
//
// Checks one content item against one schema and returns a verdict event in
// the open record format (record.schema.json), following the Verification
// Protocol's mechanics. Exact and structural rules are deterministic. Judged
// rules run only through a judge the caller supplies.
//
// What the caller can and cannot set (RMT4). The caller declares facts about
// the item: its text, its surface, its market, who produced it, and who is
// running the check. The caller cannot choose, skip, tune or preview rules:
// the schema decides which rules apply, and an unknown option is an error.
//
// Standing. The open checker keeps no record, so its results are always
// tooling_only. A check against a schema that is not ratified, or against a
// public summary (which lacks the brand's private rules), has the verdict
// not_certifiable; `findingsVerdict` still says what the findings give.

import { createHash } from 'node:crypto'
import { validateDocument } from '../validation/index.ts'
import { OUTPUT_SURFACES } from './lib/surfaces.ts'
import { runExact } from './lib/exact.ts'
import { runStructural } from './lib/structural.ts'
import { buildRequest, collectRails, runJudged } from './lib/judged.ts'
import type { Judge } from './lib/judged.ts'

export type { Judge, JudgeAnswer, JudgeRequest, RubricExample, RubricRail } from './lib/judged.ts'
export { IMPLEMENTED_PREDICATES } from './lib/structural.ts'
export { OUTPUT_SURFACES } from './lib/surfaces.ts'

export const CHECKER_VERSION = 'ramoira-open-checker-0.1.0'

type Obj = Record<string, any>

export type ProducerClass = 'agency' | 'freelancer' | 'internal_team' | 'in_house_ai' | 'other'
export type ItemVerdict = 'pass' | 'fail' | 'review_required'

export interface Item {
  /** The item exactly as it would be published. */
  text: string
  /** Where it will appear: one of the spec's OutputSurface values. */
  surface: string
  /** The market it is for, when known. Rules scoped to markets need it. */
  market?: string | null
  item_id?: string
}

export interface CheckContext {
  /** Who is running the check. A brand checking its producers' work for its own use is principal_commissioned. */
  commissioning_mode?: 'producer_self_check' | 'principal_commissioned'
  producer?: { producer_id: string; producer_class: ProducerClass }
  submitted_by?: string
  judge?: Judge | null
  now?: Date
}

export interface Finding {
  rule_id: string
  check_class: 'deterministic_exact' | 'deterministic_structural' | 'judged_bounded' | 'advisory_only'
  severity: 'absolute' | 'strong' | 'contextual'
  outcome: 'pass' | 'violation' | 'void' | 'not_evaluable' | 'advisory'
  span: string | null
  evidence: string
  judge: { type: 'none' | 'model' | 'human' | 'hybrid'; id: string | null }
}

export interface VerdictEvent {
  verdict_id: string
  brand_id: string
  item_id: string
  item_hash: string
  surface: string
  submitted_by: string
  submitted_at: string
  producer: { producer_id: string; producer_class: ProducerClass }
  schema: { schema_version: string; schema_hash: string; ratification_id: string | null }
  commissioning_mode: 'producer_self_check' | 'principal_commissioned'
  adoption_id: null
  attempt: number
  verdict: ItemVerdict | 'not_certifiable' | 'not_evaluable'
  certification_standing: 'tooling_only'
  checked_at: string
  checker_version: string
  ruleset_version: string
  findings: Finding[]
  override: null
}

export interface CheckResult {
  event: VerdictEvent
  /** What the findings give (Mechanics §6), whatever the event's verdict. */
  findingsVerdict: ItemVerdict
  /** Why the verdict is what it is: missing preconditions, coverage gaps. */
  notes: string[]
  /** Rules that do not apply to this item, with the reason. Not findings. */
  outOfScope: Array<{ rule_id: string; reason: string }>
}

export class CheckError extends Error {}

const CONTEXT_KEYS = new Set(['commissioning_mode', 'producer', 'submitted_by', 'judge', 'now'])
const ITEM_KEYS = new Set(['text', 'surface', 'market', 'item_id'])
const PRODUCER_CLASSES = new Set(['agency', 'freelancer', 'internal_team', 'in_house_ai', 'other'])

function rejectUnknown(obj: object, allowed: Set<string>, what: string): void {
  const unknown = Object.keys(obj).filter((k) => !allowed.has(k))
  if (unknown.length) {
    throw new CheckError(
      `unknown ${what} option(s): ${unknown.join(', ')}. The schema decides which rules apply; they cannot be selected, skipped or tuned.`,
    )
  }
}

export function findingsVerdict(findings: Finding[]): ItemVerdict {
  const violations = findings.filter((f) => f.outcome === 'violation')
  if (violations.some((f) => f.severity === 'absolute')) return 'fail'
  if (violations.some((f) => f.severity === 'strong')) return 'review_required'
  if (findings.some((f) => f.check_class === 'judged_bounded' && f.outcome === 'void')) return 'review_required'
  return 'pass'
}

export async function checkItem(schema: unknown, item: Item, context: CheckContext = {}): Promise<CheckResult> {
  rejectUnknown(item ?? {}, ITEM_KEYS, 'item')
  rejectUnknown(context ?? {}, CONTEXT_KEYS, 'context')

  const validation = validateDocument(schema)
  if (validation.kind !== 'full' && validation.kind !== 'summary') {
    throw new CheckError(
      validation.kind === 'archetype'
        ? 'this is an archetype template; content is checked against a brand schema'
        : 'expected a 3.x brand schema (full or summary)',
    )
  }
  if (!validation.valid) {
    const first = validation.issues.find((i) => i.level === 'error')
    throw new CheckError(`the schema is not valid 3.x (${first?.path}: ${first?.message}); run the validator first`)
  }
  if (typeof item?.text !== 'string') throw new CheckError('item.text must be a string')
  if (!OUTPUT_SURFACES.includes(item.surface)) {
    throw new CheckError(`item.surface must be one of the spec's surfaces (SPEC.md Appendix A); got "${item.surface}"`)
  }
  const mode = context.commissioning_mode ?? 'producer_self_check'
  if (mode !== 'producer_self_check' && mode !== 'principal_commissioned') {
    throw new CheckError('commissioning_mode must be producer_self_check or principal_commissioned (adoption needs a record)')
  }
  const producer = context.producer ?? { producer_id: 'unattributed', producer_class: 'other' as const }
  if (!producer.producer_id || !PRODUCER_CLASSES.has(producer.producer_class)) {
    throw new CheckError('producer needs a producer_id and a producer_class (agency, freelancer, internal_team, in_house_ai, other)')
  }

  const doc = schema as Obj
  const meta = doc.ramoira
  const now = (context.now ?? new Date()).toISOString()
  const itemHash = `sha256:${createHash('sha256').update(item.text, 'utf8').digest('hex')}`
  const market = item.market ?? null
  const rails = collectRails(doc)
  const suspended = new Set<string>(
    (doc.governance?.surfaces ?? []).filter((s: Obj) => s.surface === item.surface).flatMap((s: Obj) => s.suspended_rule_ids ?? []),
  )

  const findings: Finding[] = []
  const outOfScope: CheckResult['outOfScope'] = []
  const pending: Array<Promise<void>> = []
  const notes: string[] = []

  const add = (rule: Obj, f: Omit<Finding, 'rule_id' | 'check_class' | 'severity'>) => {
    const finding = { rule_id: rule.rule_id, check_class: rule.check_class, severity: rule.severity, ...f }
    findings.push(finding)
    return finding
  }
  const notEvaluable = (rule: Obj, evidence: string) =>
    add(rule, { outcome: 'not_evaluable', span: null, evidence, judge: { type: 'none', id: null } })

  for (const rule of doc.rules as Obj[]) {
    // Select applicable rules (Mechanics §2): scope comes from the schema.
    if (rule.surfaces !== 'all' && !rule.surfaces.includes(item.surface)) {
      outOfScope.push({ rule_id: rule.rule_id, reason: `applies only on ${rule.surfaces.join(', ')}` })
      continue
    }
    if (suspended.has(rule.rule_id)) {
      outOfScope.push({ rule_id: rule.rule_id, reason: `the schema suspends it on ${item.surface}` })
      continue
    }
    if (rule.markets !== 'all') {
      if (market === null) {
        notEvaluable(rule, `applies only in ${rule.markets.join(', ')}; the item's market was not declared`)
        continue
      }
      if (!rule.markets.includes(market)) {
        outOfScope.push({ rule_id: rule.rule_id, reason: `applies only in ${rule.markets.join(', ')}` })
        continue
      }
    }
    if (rule.situations !== 'any') {
      notEvaluable(
        rule,
        `applies only while the brand has ${rule.situations.join(', ')} active; situations are activated by the brand in Ramoira's record, which a local check cannot see`,
      )
      continue
    }
    if (rule.modality !== 'text') {
      notEvaluable(rule, `a ${rule.modality} rule; this checker reads text only`)
      continue
    }
    if (item.text.trim() === '') {
      notEvaluable(rule, 'the item is empty')
      continue
    }

    if (rule.check_class === 'deterministic_exact') {
      const { matches } = runExact(item.text, rule.match)
      if (matches.length) {
        const terms = [...new Set(matches.map((m) => m.term))].map((t) => `"${t}"`).join(', ')
        add(rule, {
          outcome: 'violation',
          span: matches[0].span,
          evidence: `matched ${terms} (${rule.match.mode}, ${rule.match.normalization}); ${matches.length} occurrence(s)`,
          judge: { type: 'none', id: null },
        })
      } else {
        add(rule, {
          outcome: 'pass',
          span: null,
          evidence: `no ${rule.match.mode} match for ${rule.match.terms.length} term(s) (${rule.match.normalization})`,
          judge: { type: 'none', id: null },
        })
      }
    } else if (rule.check_class === 'deterministic_structural') {
      const r = runStructural(item.text, rule.predicate)
      add(rule, {
        outcome: r.outcome,
        span: r.outcome === 'violation' ? r.span : null,
        evidence: `${rule.predicate.type}: ${r.evidence}`,
        judge: { type: 'none', id: null },
      })
    } else {
      // Placeholder keeps schema order; the judge fills it in.
      const slot = add(rule, { outcome: 'void', span: null, evidence: 'pending', judge: { type: 'none', id: null } })
      const request = buildRequest(doc, rule, item.text, item.surface, rails)
      pending.push(
        runJudged(request, context.judge ?? null, meta.content_hash).then((r) => {
          Object.assign(slot, { outcome: r.outcome, span: r.span, evidence: r.evidence, judge: r.judge })
        }),
      )
    }
  }
  await Promise.all(pending)

  // Notes: what this result can and cannot stand for.
  const ratified = Boolean(meta.ratification)
  const isSummary = validation.kind === 'summary'
  if (!ratified) notes.push('Precondition 1 (ratified schema) is not met: this schema is a candidate, so the result is not certifiable (RMT2).')
  if (isSummary) notes.push("Checked against the public summary: rules the brand keeps private were not run.")
  if (ratified) notes.push("The schema's ratification pointer was not confirmed against Ramoira's record; a local check cannot do that.")
  notes.push('The open checker keeps no record: the result is tooling_only.')
  const unaffirmed = findings.filter((f) => (doc.rules as Obj[]).some((r) => r.rule_id === f.rule_id && r.affirmed === false))
  if (unaffirmed.length) notes.push(`${unaffirmed.length} rule(s) applied here were proposed and not yet affirmed by the brand.`)
  const unchecked = findings.filter((f) => f.outcome === 'not_evaluable' && f.severity !== 'contextual')
  if (unchecked.length) {
    notes.push(
      `${unchecked.length} absolute or strong rule(s) could not be checked here (${unchecked.map((f) => f.rule_id).join(', ')}); the verdict does not cover them.`,
    )
  }
  if (findings.some((f) => f.check_class === 'judged_bounded' && f.outcome === 'void' && f.evidence.startsWith('not judged'))) {
    notes.push('Judged rules were not judged, so the item needs review; supply a judge to run them.')
  }

  const fv = findingsVerdict(findings)
  const verdict: VerdictEvent['verdict'] =
    item.text.trim() === '' ? 'not_evaluable' : !ratified || isSummary ? 'not_certifiable' : fv

  const event: VerdictEvent = {
    verdict_id: `local_${itemHash.slice(7, 23)}_${Date.parse(now).toString(36)}`,
    brand_id: meta.brand_id ?? 'unassigned',
    item_id: item.item_id ?? `item_${itemHash.slice(7, 23)}`,
    item_hash: itemHash,
    surface: item.surface,
    submitted_by: context.submitted_by ?? 'local',
    submitted_at: now,
    producer,
    schema: {
      schema_version: meta.schema_version,
      schema_hash: meta.content_hash,
      ratification_id: meta.ratification?.ratification_id ?? null,
    },
    commissioning_mode: mode,
    adoption_id: null,
    attempt: 1,
    verdict,
    certification_standing: 'tooling_only',
    checked_at: now,
    checker_version: CHECKER_VERSION,
    ruleset_version: 'schema-bound',
    findings,
    override: null,
  }

  // The event must be a valid record event; if not, this checker has a bug.
  const self = validateDocument(event, 'record')
  if (!self.valid) {
    throw new Error(`checker produced an invalid verdict event: ${JSON.stringify(self.issues.slice(0, 3))}`)
  }
  return { event, findingsVerdict: fv, notes, outOfScope }
}
