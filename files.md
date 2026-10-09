```
brand-schema-spec/
├── README.md                    what this repository is
├── SPEC.md                      the 3.1.0 specification (normative)
├── SPEC.schema.json             JSON Schema: full schemas and archetype templates
├── SPEC.summary.schema.json     JSON Schema: public summaries
├── record.schema.json           JSON Schema: verdict events and adoption records
├── CHANGELOG.md
├── LICENSE                      MIT
├── llms.txt
├── package.json                 @ramoira/schema: validator and checker
│
├── layers/                      reading guide: the rule registry and the five layers
├── validation/                  reference validator (TypeScript, Node.js 22.18+)
│   ├── validate.ts              npm run validate -- <files>
│   ├── hash.ts                  npm run hash -- <file> [--write]
│   ├── summarize.ts             npm run summarize -- <full> [out]
│   ├── index.ts                 library entry: validateDocument, computeContentHash, extractSummary
│   ├── lib/                     JCS, hashing, pointer resolution, invariants, record checks
│   └── test/                    npm test
├── checker/                     open checker: one item against one schema → verdict event
│   ├── index.ts                 library entry: checkItem (@ramoira/schema/checker)
│   ├── lib/                     normalization, exact, structural, judged
│   └── test/                    npm test
├── examples/                    fictional brands, unratified
│   ├── corvane/
│   ├── archetype-template/
│   └── minimal/
├── schemas/                     blank templates
└── migrations/                  2.0.0-to-3.0.0.md, 3.0.0-to-3.1.0.md
```
