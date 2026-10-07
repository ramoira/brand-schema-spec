// deterministic_structural (Verification Protocol, Mechanics §4; SPEC.md §6.2).
//
// The predicate vocabulary is open. This checker implements the predicates it
// can decide without judgment and returns not_evaluable for the rest, with the
// reason; it never skips a rule silently.

import { runExact } from './exact.ts'
import { sentences, words } from './text.ts'

type Obj = Record<string, any>

export type StructuralResult =
  | { outcome: 'pass'; evidence: string }
  | { outcome: 'violation'; span: string | null; evidence: string }
  | { outcome: 'not_evaluable'; evidence: string }

const notEvaluable = (evidence: string): StructuralResult => ({ outcome: 'not_evaluable', evidence })

const isNonNegInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0
const isNonNegNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0

// Numbers this checker can extract without judgment. English phrasings only;
// any other field is not_evaluable.
const NUMBER_EXTRACTORS: Record<string, { patterns: RegExp[]; label: string }> = {
  discount_percent: {
    label: 'a percentage followed by "off", "discount" or "reduction", or after "save"',
    patterns: [
      /(\d+(?:\.\d+)?)\s*(?:%|percent\b|per cent\b)\s*(?:off|discount|reduction)\b/giu,
      /\bsave\s+(?:up\s+to\s+)?(\d+(?:\.\d+)?)\s*(?:%|percent\b|per cent\b)/giu,
    ],
  },
}

const PREDICATES: Record<string, (text: string, params: Obj) => StructuralResult> = {
  required_phrase_on_surface(text, params) {
    const phrase = params.phrase
    if (typeof phrase !== 'string' || !phrase.trim()) return notEvaluable('params.phrase must be a non-empty string')
    const { matches } = runExact(text, { terms: [phrase], mode: 'phrase', normalization: 'casefold_nfkc' })
    return matches.length
      ? { outcome: 'pass', evidence: `required phrase "${phrase}" is present` }
      : { outcome: 'violation', span: null, evidence: `required phrase "${phrase}" is absent` }
  },

  max_character_count(text, params) {
    const { character, max } = params
    if (typeof character !== 'string' || [...character].length !== 1) {
      return notEvaluable('params.character must be a single character')
    }
    if (!isNonNegInt(max)) return notEvaluable('params.max must be a non-negative integer')
    const count = [...text].filter((c) => c === character).length
    if (count <= max) return { outcome: 'pass', evidence: `"${character}" appears ${count} time(s); max ${max}` }
    let seen = 0
    const span = sentences(text).find((s) => (seen += [...s].filter((c) => c === character).length) > max) ?? null
    return { outcome: 'violation', span, evidence: `"${character}" appears ${count} time(s); max ${max}` }
  },

  max_sentence_words(text, params) {
    const { max } = params
    if (!isNonNegInt(max) || max === 0) return notEvaluable('params.max must be a positive integer')
    const long = sentences(text).find((s) => words(s).length > max)
    return long
      ? { outcome: 'violation', span: long, evidence: `a sentence has ${words(long).length} words; max ${max}` }
      : { outcome: 'pass', evidence: `no sentence exceeds ${max} words` }
  },

  max_number(text, params) {
    const { field, max } = params
    if (typeof field !== 'string') return notEvaluable('params.field must be a string')
    if (!isNonNegNum(max)) return notEvaluable('params.max must be a non-negative number')
    const extractor = NUMBER_EXTRACTORS[field]
    if (!extractor) return notEvaluable(`this checker cannot extract "${field}" without judgment`)
    for (const pattern of extractor.patterns) {
      for (const m of text.matchAll(pattern)) {
        const value = Number(m[1])
        if (value > max) {
          return { outcome: 'violation', span: m[0], evidence: `${field} ${value} exceeds max ${max}` }
        }
      }
    }
    return { outcome: 'pass', evidence: `no ${field} above ${max} found (looked for ${extractor.label})` }
  },

  claim_must_be_approved() {
    return notEvaluable('finding the product claims in an item takes judgment; this checker does not decide it')
  },

  self_reference_form() {
    return notEvaluable("telling the brand's own voice from quoted speech takes judgment; this checker does not decide it")
  },
}

export function runStructural(text: string, predicate: { type: string; params: Obj }): StructuralResult {
  const run = PREDICATES[predicate.type]
  if (!run) return notEvaluable(`predicate "${predicate.type}" is not implemented by this checker`)
  return run(text, predicate.params ?? {})
}

export const IMPLEMENTED_PREDICATES = ['required_phrase_on_surface', 'max_character_count', 'max_sentence_words', 'max_number'] as const
