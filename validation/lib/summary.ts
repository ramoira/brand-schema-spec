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

  // A public rule keeps its place, but not a pointer into material the summary
  // excludes (3.2.0, invariant 7): what it protects there stays private too.
  const excluded = (entry: string): boolean =>
    (entry === '/commercial' || entry.startsWith('/commercial/')) ? !optIn.has('commercial')
      : (entry === '/identity/prism/culture/sacredBoundary' || entry.startsWith('/identity/prism/culture/sacredBoundary/'))
        ? !optIn.has('sacred_boundary')
        : false
  const publicRules = clone((full.rules ?? []).filter((r: Obj) => r.visibility === 'public')).map((r: Obj) => {
    if (!Array.isArray(r.protects)) return r
    const kept = r.protects.filter((entry: string) => !excluded(entry))
    if (kept.length > 0) r.protects = kept
    else delete r.protects
    return r
  })

  const summary: Obj = {
    ramoira: { ...clone(full.ramoira), schema_type: 'summary', summary_opt_in: [...optIn] },
    rules: publicRules,
    identity,
    narrative: clone(full.narrative),
    voice: clone(full.voice),
  }
  if (optIn.has('commercial')) summary.commercial = clone(full.commercial)
  if (optIn.has('governance')) summary.governance = clone(full.governance)
  return summary
}
