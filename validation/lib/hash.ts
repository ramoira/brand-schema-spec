import { createHash } from 'node:crypto'
import { canonicalize } from './jcs.ts'

// The hashed scope: brand meaning only. `ramoira`, `draft_provenance` and
// `archetype` are process metadata and sit outside it (SPEC.md section 2).
export const HASHED_KEYS = ['rules', 'identity', 'narrative', 'voice', 'commercial', 'governance'] as const

export function hashedScope(doc: Record<string, unknown>): Record<string, unknown> {
  const scope: Record<string, unknown> = {}
  for (const key of HASHED_KEYS) {
    if (doc[key] !== undefined) scope[key] = doc[key]
  }
  return scope
}

export function computeContentHash(doc: Record<string, unknown>): string {
  const digest = createHash('sha256').update(canonicalize(hashedScope(doc)), 'utf8').digest('hex')
  return `sha256:${digest}`
}
