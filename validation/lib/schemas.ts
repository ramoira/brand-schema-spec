import AjvModule from 'ajv/dist/2020.js'
import formatsModule from 'ajv-formats'
import type { ErrorObject, ValidateFunction } from 'ajv'
// JSON imports, not file reads: bundlers (tsup, Next.js) inline these, so the
// validator keeps working when its code is bundled into another package.
import specJson from '../../SPEC.schema.json' with { type: 'json' }
import summaryJson from '../../SPEC.summary.schema.json' with { type: 'json' }
import recordJson from '../../record.schema.json' with { type: 'json' }

// ajv and ajv-formats are CommonJS. Node's ESM loader puts the class on
// `.default`; some bundlers hand back the class itself. Accept either.
const interop = <T,>(mod: T): T => ((mod as { default?: T }).default ?? mod)
const Ajv2020 = interop(AjvModule.default)
const addFormats = interop(formatsModule.default)

export const specSchema = specJson as Record<string, unknown>
export const summarySchema = summaryJson as Record<string, unknown>
export const recordSchema = recordJson as Record<string, unknown>

const ajv = new Ajv2020({ strict: true, strictTypes: false, strictRequired: false, allErrors: true, allowUnionTypes: true })
addFormats(ajv)
ajv.addSchema(specSchema)
ajv.addSchema(summarySchema)
ajv.addSchema(recordSchema)

function compiled(schema: Record<string, unknown>): ValidateFunction {
  const fn = ajv.getSchema(schema.$id as string)
  if (!fn) throw new Error(`schema not registered: ${String(schema.$id)}`)
  return fn
}

export const validators = {
  full: compiled(specSchema),
  archetype: compiled(specSchema),
  summary: compiled(summarySchema),
  record: compiled(recordSchema),
  adoption: (() => {
    const fn = ajv.getSchema(`${String(recordSchema.$id)}#/$defs/Adoption`)
    if (!fn) throw new Error('adoption schema not registered')
    return fn
  })(),
}

export type { ErrorObject }
