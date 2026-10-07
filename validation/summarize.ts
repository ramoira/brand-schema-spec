// Usage: node validation/summarize.ts <brand.schema.json> [out.json]
//
// Writes the public summary of a full schema: every public rule; identity,
// narrative and voice; commercial, governance and sacredBoundary only if the
// brand opted them in. Never draft_provenance. Prints to stdout without out.json.

import { readFileSync, writeFileSync } from 'node:fs'
import { extractSummary } from './lib/summary.ts'

const [input, output] = process.argv.slice(2)
if (!input) {
  console.error('usage: node validation/summarize.ts <brand.schema.json> [out.json]')
  process.exit(2)
}

const summary = JSON.stringify(extractSummary(JSON.parse(readFileSync(input, 'utf8'))), null, 2) + '\n'
if (output) writeFileSync(output, summary)
else process.stdout.write(summary)
