// The spec's OutputSurface list (SPEC.md Appendix A), read from the normative
// JSON Schema so the checker and the spec cannot drift apart.

import specJson from '../../SPEC.schema.json' with { type: 'json' }

export const OUTPUT_SURFACES: readonly string[] = (specJson as { $defs: { OutputSurface: { enum: string[] } } }).$defs.OutputSurface.enum
