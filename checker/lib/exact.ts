// deterministic_exact (Verification Protocol, Mechanics §3; SPEC.md §6.2).
// No model decides an exact rule.
//
//   substring  the term anywhere
//   word       the term with no letter, digit or underscore either side
//   phrase     as word, and any run of whitespace in the item matches the
//              spaces in the term

import { isWordChar, normalize, normalizeTerm, originalSpan } from './text.ts'
import type { Normalization } from './text.ts'

// Whole code points either side of a match, so a letter outside the Basic
// Multilingual Plane still counts as a letter.
function charBefore(s: string, i: number): string | undefined {
  if (i <= 0) return undefined
  const unit = s.charCodeAt(i - 1)
  return unit >= 0xdc00 && unit <= 0xdfff && i >= 2 ? s.slice(i - 2, i) : s[i - 1]
}

function charAt(s: string, i: number): string | undefined {
  return i >= s.length ? undefined : String.fromCodePoint(s.codePointAt(i)!)
}

export interface ExactMatch {
  term: string
  span: string
}

export interface ExactResult {
  matches: ExactMatch[]
}

export function runExact(
  text: string,
  match: { terms: string[]; mode: 'substring' | 'word' | 'phrase'; normalization: Normalization },
): ExactResult {
  const phrase = match.mode === 'phrase'
  const folded = normalize(text, match.normalization, phrase)
  const matches: ExactMatch[] = []

  for (const term of match.terms) {
    const needle = normalizeTerm(term, match.normalization, phrase)
    if (!needle) continue
    let from = 0
    while (from <= folded.text.length - needle.length) {
      const at = folded.text.indexOf(needle, from)
      if (at === -1) break
      const end = at + needle.length
      const bounded =
        match.mode === 'substring' || (!isWordChar(charBefore(folded.text, at)) && !isWordChar(charAt(folded.text, end)))
      if (bounded) {
        matches.push({ term, span: originalSpan(text, folded, at, end) })
        from = end
      } else {
        from = at + 1
      }
    }
  }
  return { matches }
}
