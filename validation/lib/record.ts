// Verdict-event checks the record JSON Schema cannot express: the top-level
// verdict must follow from the findings (Verification Protocol, Mechanics §6)
// and an override may clear only a strong violation (§7).

import type { Issue } from './invariants.ts'

type Obj = Record<string, any>

export function checkRecord(event: Obj): Issue[] {
  const issues: Issue[] = []
  const err = (path: string, message: string) => issues.push({ level: 'error', invariant: null, path, message })

  const findings: Obj[] = Array.isArray(event.findings) ? event.findings : []
  const override: Obj | null = event.override ?? null

  if (override) {
    const target = findings.findIndex((f) => f.rule_id === override.rule_id && f.outcome === 'violation')
    if (target === -1) {
      err('/override/rule_id', `override names rule "${override.rule_id}", which has no violation in this event`)
    } else if (findings[target].severity !== 'strong') {
      err(
        '/override/rule_id',
        `override clears a ${findings[target].severity} violation; only strong violations can be overridden`,
      )
    }
  }

  // not_certifiable and not_evaluable describe the run, not the findings.
  if (!['pass', 'fail', 'review_required'].includes(event.verdict)) return issues

  const violations = findings.filter((f) => f.outcome === 'violation')
  const absolute = violations.some((f) => f.severity === 'absolute')
  const unresolvedStrong = violations.some((f) => f.severity === 'strong' && f.rule_id !== override?.rule_id)
  const voidJudged = findings.some((f) => f.check_class === 'judged_bounded' && f.outcome === 'void')

  const expected = absolute ? 'fail' : unresolvedStrong || voidJudged ? 'review_required' : 'pass'
  if (event.verdict !== expected) {
    err('/verdict', `verdict is ${event.verdict} but the findings give ${expected}`)
  }
  return issues
}
