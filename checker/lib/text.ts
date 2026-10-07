// Text normalization with a map back to the original text, so every span a
// finding quotes is the producer's own text, unaltered (Verification Protocol,
// Mechanics §1: the verifier may not rewrite content before checking it).

export type Normalization = 'casefold_nfkc' | 'exact'

export interface Folded {
  /** The normalized text that matching runs on. */
  text: string
  /** For each UTF-16 unit of `text`, the [start, end) range in the original. */
  origin: Array<[number, number]>
}

const graphemes = new Intl.Segmenter('und', { granularity: 'grapheme' })
const WHITESPACE = /^\s+$/u
const WORD_CHAR = /[\p{L}\p{N}\p{M}_]/u

/**
 * casefold_nfkc: NFKC, then Unicode case folding. JavaScript has no full case
 * fold, so this is lowercasing plus the folds lowercasing misses (ß → ss,
 * final sigma → σ), re-normalized to NFKC.
 */
function fold(s: string): string {
  return s.normalize('NFKC').toLowerCase().replace(/ß/g, 'ss').replace(/ς/g, 'σ').normalize('NFKC')
}

/**
 * Normalizes per grapheme cluster, so a combining sequence folds as a unit and
 * maps back to the whole cluster. With `collapseWhitespace`, every run of
 * whitespace becomes one space (phrase matching).
 */
export function normalize(input: string, normalization: Normalization, collapseWhitespace = false): Folded {
  let text = ''
  const origin: Array<[number, number]> = []
  let lastWasSpace = false
  for (const { segment, index } of graphemes.segment(input)) {
    const range: [number, number] = [index, index + segment.length]
    if (collapseWhitespace && WHITESPACE.test(segment)) {
      if (lastWasSpace) {
        origin[origin.length - 1] = [origin[origin.length - 1][0], range[1]]
      } else {
        text += ' '
        origin.push(range)
      }
      lastWasSpace = true
      continue
    }
    lastWasSpace = false
    const out = normalization === 'casefold_nfkc' ? fold(segment) : segment
    text += out
    for (let i = 0; i < out.length; i++) origin.push(range)
  }
  return { text, origin }
}

/** The same normalization applied to a rule's term. */
export function normalizeTerm(term: string, normalization: Normalization, collapseWhitespace = false): string {
  const t = normalize(term, normalization, collapseWhitespace).text
  return collapseWhitespace ? t.trim() : t
}

export function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && WORD_CHAR.test(ch)
}

/** The original-text span for normalized range [start, end). */
export function originalSpan(source: string, folded: Folded, start: number, end: number): string {
  return source.slice(folded.origin[start][0], folded.origin[end - 1][1])
}

/**
 * Sentences: text split at . ! ? or … followed by whitespace, and at line
 * breaks. A fixed rule rather than a locale-dependent segmenter, so the same
 * item splits the same way on every machine.
 */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+|\r?\n+/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/** Words: whitespace-separated tokens that contain a letter or a digit. */
export function words(sentence: string): string[] {
  return sentence.split(/\s+/u).filter((w) => /[\p{L}\p{N}]/u.test(w))
}
