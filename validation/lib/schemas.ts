import type { ErrorObject, ValidateFunction } from 'ajv'
// JSON imports, not file reads: bundlers (tsup, Next.js) inline these, so the
// validator keeps working when its code is bundled into another package.
import specJson from '../../SPEC.schema.json' with { type: 'json' }
import summaryJson from '../../SPEC.summary.schema.json' with { type: 'json' }
import recordJson from '../../record.schema.json' with { type: 'json' }
// The validators are compiled ahead of time (validation/build-validators.ts),
// so nothing generates code at runtime: they run where `new Function` is
// forbidden, such as Cloudflare Workers.
import * as generated from './validators.generated.ts'

export const specSchema = specJson as Record<string, unknown>
export const summarySchema = summaryJson as Record<string, unknown>
export const recordSchema = recordJson as Record<string, unknown>

const fn = (v: unknown) => v as ValidateFunction

export const validators = {
  full: fn(generated.full),
  archetype: fn(generated.full),
  summary: fn(generated.summary),
  record: fn(generated.record),
  adoption: fn(generated.adoption),
}

export type { ErrorObject }
