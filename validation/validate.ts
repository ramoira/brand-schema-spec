// Usage: node validation/validate.ts <file.json>... [--json]
//
// Validates brand schemas (full, archetype, summary), verdict events and
// adoption records. The kind is detected from the document. Exits 1 if any
// file has an error.

import { readFileSync } from 'node:fs'
import { validateDocument } from './index.ts'

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const files = args.filter((a) => !a.startsWith('--'))

if (files.length === 0) {
  console.error('usage: node validation/validate.ts <file.json>... [--json]')
  process.exit(2)
}

let failed = false
const report: Record<string, unknown> = {}

for (const file of files) {
  let doc: unknown
  try {
    doc = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    failed = true
    report[file] = { valid: false, error: (e as Error).message }
    if (!asJson) console.log(`✗ ${file}\n    cannot read JSON: ${(e as Error).message}`)
    continue
  }

  const result = validateDocument(doc)
  failed ||= !result.valid
  report[file] = result
  if (asJson) continue

  console.log(`${result.valid ? '✓' : '✗'} ${file}${result.kind ? ` (${result.kind})` : ''}`)
  for (const issue of result.issues) {
    const tag = issue.invariant ? `invariant ${issue.invariant}` : issue.level
    console.log(`    ${issue.level === 'error' ? 'error' : 'warn '} [${tag}] ${issue.path}: ${issue.message}`)
  }
}

if (asJson) console.log(JSON.stringify(report, null, 2))
process.exit(failed ? 1 : 0)
