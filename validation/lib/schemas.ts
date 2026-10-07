import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import AjvModule from 'ajv/dist/2020.js'
import formatsModule from 'ajv-formats'
import type { ErrorObject, ValidateFunction } from 'ajv'

// ajv and ajv-formats are CommonJS; under Node's ESM loader the real export sits on `.default`.
const Ajv2020 = AjvModule.default
const addFormats = formatsModule.default

const repoRoot = new URL('../../', import.meta.url)

function load(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(fileURLToPath(new URL(name, repoRoot)), 'utf8'))
}

export const specSchema = load('SPEC.schema.json')
export const summarySchema = load('SPEC.summary.schema.json')
export const recordSchema = load('record.schema.json')

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
