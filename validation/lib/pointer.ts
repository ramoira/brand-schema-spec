// Resolves an RFC 6901 JSON pointer against the *structure* of a JSON Schema,
// not against a document. A delta zone in an archetype template may point at
// a field the template leaves empty, so "resolves" means "names a field the
// v3 format defines" (SPEC.md section 9, invariant 9).

type Schema = Record<string, unknown>

export function parsePointer(pointer: string): string[] {
  if (pointer === '') return []
  if (!pointer.startsWith('/')) throw new Error(`not a JSON pointer: ${pointer}`)
  return pointer
    .slice(1)
    .split('/')
    .map((seg) => seg.replace(/~1/g, '/').replace(/~0/g, '~'))
}

const ARRAY_INDEX = /^(0|[1-9][0-9]*|-)$/

export function pointerResolvesInSchema(root: Schema, pointer: string): boolean {
  return walk(root, root, parsePointer(pointer), 0)
}

function deref(root: Schema, schema: Schema): Schema {
  const ref = schema.$ref
  if (typeof ref !== 'string') return schema
  if (!ref.startsWith('#/')) throw new Error(`only local $ref is supported here: ${ref}`)
  let node: unknown = root
  for (const seg of parsePointer(ref.slice(1))) {
    node = (node as Record<string, unknown>)[seg]
  }
  if (node === undefined) throw new Error(`unresolved $ref: ${ref}`)
  return node as Schema
}

function walk(root: Schema, schema: Schema, segs: string[], depth: number): boolean {
  if (depth > 64) return false
  const node = deref(root, schema)
  if (segs.length === 0) return true

  for (const combinator of ['allOf', 'anyOf', 'oneOf'] as const) {
    const branches = node[combinator]
    if (Array.isArray(branches) && branches.some((b) => walk(root, b as Schema, segs, depth + 1))) {
      return true
    }
  }

  const [head, ...rest] = segs
  const properties = node.properties as Record<string, Schema> | undefined
  if (properties && Object.hasOwn(properties, head)) {
    return walk(root, properties[head], rest, depth + 1)
  }
  if (node.items && typeof node.items === 'object' && ARRAY_INDEX.test(head)) {
    return walk(root, node.items as Schema, rest, depth + 1)
  }
  if (node.additionalProperties && typeof node.additionalProperties === 'object') {
    return walk(root, node.additionalProperties as Schema, rest, depth + 1)
  }
  return false
}
