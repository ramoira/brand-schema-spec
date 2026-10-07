// Reference validator for Ramoira brand schema 3.0.0.
//
//   validateDocument(doc) → { kind, issues }
//
// Runs the JSON Schema for the document's kind, then the invariants JSON
// Schema cannot express (SPEC.md section 9). A document is valid when no
// issue has level "error".

import { checkInvariants } from './lib/invariants.ts'
import type { Issue, SchemaKind } from './lib/invariants.ts'
import { checkRecord } from './lib/record.ts'
import { validators } from './lib/schemas.ts'
import type { ErrorObject } from './lib/schemas.ts'

export { computeContentHash, hashedScope } from './lib/hash.ts'
export { canonicalize } from './lib/jcs.ts'
export { extractSummary } from './lib/summary.ts'
export type { Issue, SchemaKind }

export type DocumentKind = SchemaKind | 'record' | 'adoption'

export interface ValidationResult {
  kind: DocumentKind | null
  valid: boolean
  issues: Issue[]
}

export function detectKind(doc: unknown): DocumentKind | null {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return null
  const obj = doc as Record<string, any>
  if ('verdict_id' in obj) return 'record'
  if ('adoption_id' in obj && 'schema_hashes' in obj) return 'adoption'
  const type = obj.ramoira?.schema_type
  return type === 'full' || type === 'archetype' || type === 'summary' ? type : null
}

function fromAjv(errors: ErrorObject[] | null | undefined): Issue[] {
  return (errors ?? []).map((e) => ({
    level: 'error' as const,
    invariant: null,
    path: e.instancePath || '/',
    message: `${e.message ?? 'invalid'}${e.params && Object.keys(e.params).length ? ` ${JSON.stringify(e.params)}` : ''}`,
  }))
}

export function validateDocument(doc: unknown, kind: DocumentKind | null = detectKind(doc)): ValidationResult {
  if (!kind) {
    const v2 = Boolean(doc && typeof doc === 'object' && 'meta' in (doc as object))
    return {
      kind: null,
      valid: false,
      issues: [
        {
          level: 'error',
          invariant: null,
          path: '/',
          message: v2
            ? 'this looks like a 2.0.0 schema (top-level "meta"); see migrations/2.0.0-to-3.0.0.md'
            : 'cannot tell what this document is: expected ramoira.schema_type, a verdict_id, or an adoption_id',
        },
      ],
    }
  }

  const validate = validators[kind]
  const issues: Issue[] = validate(doc) ? [] : fromAjv(validate.errors)

  // Invariants assume the shape is right; skip them if it is not, to avoid noise.
  if (issues.length === 0) {
    if (kind === 'record') issues.push(...checkRecord(doc as Record<string, unknown>))
    else if (kind !== 'adoption') issues.push(...checkInvariants(doc as Record<string, unknown>, kind))
  }

  return { kind, valid: !issues.some((i) => i.level === 'error'), issues }
}
