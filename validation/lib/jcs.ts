// RFC 8785 JSON Canonicalization Scheme (JCS).
//
// JCS is defined in terms of ECMAScript's own JSON serialisation, so in
// JavaScript it reduces to: JSON.stringify for primitives, and object keys
// sorted by UTF-16 code units (the default Array.prototype.sort order).

export function canonicalize(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value)
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('JCS: non-finite numbers are not valid JSON')
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalize).join(',') + ']'
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const keys = Object.keys(record).filter((k) => record[k] !== undefined).sort()
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalize(record[k])).join(',') + '}'
  }
  throw new TypeError(`JCS: unsupported value of type ${typeof value}`)
}
