// Extracts the public summary from a full schema (SPEC.md section 7).
// Identical at every tier: what is included depends only on rule visibility
// and the brand's own summary_opt_in.

type Obj = Record<string, any>

export function extractSummary(full: Obj): Obj {
  if (full?.ramoira?.schema_type !== 'full') {
    throw new Error('only a full schema has a public summary')
  }
  const optIn = new Set<string>(full.ramoira.summary_opt_in ?? [])
  const clone = <T>(v: T): T => structuredClone(v)

  const identity = clone(full.identity)
  if (!optIn.has('sacred_boundary') && identity?.prism?.culture) {
    delete identity.prism.culture.sacredBoundary
  }

  const summary: Obj = {
    ramoira: { ...clone(full.ramoira), schema_type: 'summary', summary_opt_in: [...optIn] },
    rules: clone((full.rules ?? []).filter((r: Obj) => r.visibility === 'public')),
    identity,
    narrative: clone(full.narrative),
    voice: clone(full.voice),
  }
  if (optIn.has('commercial')) summary.commercial = clone(full.commercial)
  if (optIn.has('governance')) summary.governance = clone(full.governance)
  return summary
}
