// judged_bounded (Verification Protocol, Mechanics §5; SPEC.md §6.2).
//
// The checker does not judge. The caller supplies a judge (a model run with
// the caller's own key, or a human reviewer). The checker hands it the rule's
// own rubric material, then accepts a pass or violation only if the judge
// quotes a span that is really in the item and cites rubric material the rule
// really has. Anything else is void, which sends the item to review.

type Obj = Record<string, any>

export interface RubricExample {
  example_id: string
  verdict: 'approved' | 'rejected'
  surface: string
  text: string
  reason: string
  judged_by: string
}

export interface RubricRail {
  rail_id: string
  context: string
  instruction: string
  example?: string
  antiExample?: string
}

export interface JudgeRequest {
  rule_id: string
  statement: string
  /** The rubric question, when the rule has one. */
  question: string | null
  examples: RubricExample[]
  rails: RubricRail[]
  /** The item exactly as submitted. */
  text: string
  surface: string
}

export interface JudgeAnswer {
  outcome: 'pass' | 'violation' | 'undecided'
  /** A verbatim quote from the item supporting the outcome. */
  span: string | null
  /** example_ids and rail_ids from the request that ground the outcome. */
  cited: string[]
  /** What judged: model and version, or reviewer id or role. */
  judge_id: string
  judge_type: 'model' | 'human' | 'hybrid'
}

export interface Judge {
  judge(request: JudgeRequest): Promise<JudgeAnswer>
}

export type JudgedResult =
  | { outcome: 'pass' | 'violation'; span: string; evidence: string; judge: { type: 'model' | 'human' | 'hybrid'; id: string } }
  | { outcome: 'void'; span: null; evidence: string; judge: { type: 'none' | 'model' | 'human' | 'hybrid'; id: string | null } }

/** Every rail in the document, wherever it sits (rails are the objects carrying rail_id). */
export function collectRails(node: unknown, out = new Map<string, RubricRail>()): Map<string, RubricRail> {
  if (Array.isArray(node)) node.forEach((n) => collectRails(n, out))
  else if (node && typeof node === 'object') {
    const obj = node as Obj
    if (typeof obj.rail_id === 'string') out.set(obj.rail_id, obj as RubricRail)
    Object.values(obj).forEach((v) => collectRails(v, out))
  }
  return out
}

export function buildRequest(doc: Obj, rule: Obj, text: string, surface: string, rails: Map<string, RubricRail>): JudgeRequest {
  const examples = new Map<string, RubricExample>((doc.voice?.examples ?? []).map((e: RubricExample) => [e.example_id, e]))
  return {
    rule_id: rule.rule_id,
    statement: rule.statement,
    question: rule.rubric.question ?? null,
    examples: (rule.rubric.example_refs ?? []).map((id: string) => examples.get(id)).filter(Boolean),
    rails: (rule.rubric.rail_refs ?? []).map((id: string) => rails.get(id)).filter(Boolean),
    text,
    surface,
  }
}

const voidResult = (evidence: string, judge: JudgedResult['judge'] = { type: 'none', id: null }): JudgedResult => ({
  outcome: 'void',
  span: null,
  evidence,
  judge,
})

export async function runJudged(request: JudgeRequest, judge: Judge | null, schemaHash: string): Promise<JudgedResult> {
  const rubric = `rubric of ${request.rule_id} in ${schemaHash}`
  if (!judge) return voidResult(`not judged: no judge was supplied (${rubric})`)

  let answer: JudgeAnswer
  try {
    answer = await judge.judge(request)
  } catch (err) {
    return voidResult(`not judged: the judge failed (${(err as Error).message}) (${rubric})`)
  }
  const who = { type: answer.judge_type, id: answer.judge_id }
  if (!answer.judge_id) return voidResult(`void: the judge did not identify itself (${rubric})`)
  if (answer.outcome !== 'pass' && answer.outcome !== 'violation') {
    return voidResult(`void: the judge could not decide from the rubric (${rubric})`, who)
  }
  const span = answer.span?.trim() ?? ''
  if (!span || !request.text.includes(span)) {
    return voidResult(`void: the judge's quote is not in the item (${rubric})`, who)
  }
  const known = new Set([...request.examples.map((e) => e.example_id), ...request.rails.map((r) => r.rail_id)])
  const cited = [...new Set(answer.cited)].filter((id) => known.has(id))
  if (cited.length === 0 || cited.length !== new Set(answer.cited).size) {
    return voidResult(`void: the judge did not cite this rule's rubric material (${rubric})`, who)
  }
  return { outcome: answer.outcome, span, evidence: `${rubric}; cites ${cited.join(', ')}`, judge: who }
}
