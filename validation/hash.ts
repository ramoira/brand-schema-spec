// Usage: node validation/hash.ts <brand.schema.json> [--write]
//
// Prints the content_hash of a full schema or archetype template: SHA-256 over
// the RFC 8785 canonical form of {rules, identity, narrative, voice,
// commercial, governance}. With --write, stores it in ramoira.content_hash.
// A summary's content_hash is the full schema's and cannot be computed here.

import { readFileSync, writeFileSync } from 'node:fs'
import { computeContentHash } from './index.ts'

const args = process.argv.slice(2)
const write = args.includes('--write')
const [file] = args.filter((a) => !a.startsWith('--'))

if (!file) {
  console.error('usage: node validation/hash.ts <brand.schema.json> [--write]')
  process.exit(2)
}

const doc = JSON.parse(readFileSync(file, 'utf8'))
if (doc?.ramoira?.schema_type === 'summary') {
  console.error('a summary carries the content_hash of its full schema; hash the full schema instead')
  process.exit(2)
}

const hash = computeContentHash(doc)
console.log(hash)

if (write) {
  doc.ramoira.content_hash = hash
  writeFileSync(file, JSON.stringify(doc, null, 2) + '\n')
}
