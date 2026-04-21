# Voice Layer Reference

## Fields

### tone (required, full + summary)

Array of strings. Max 3 entries.
Describes how the brand sounds.

Rules:

- Use specific, non-generic descriptors
- Avoid: warm, friendly, professional, approachable
  These describe almost every brand and give LLMs no signal
- Prefer: considered, unhurried, forensic, irreverent, dry
  These are specific enough to differentiate

Wrong:
  "tone": ["warm", "friendly", "professional"]
  
Right:
  "tone": ["considered", "quiet", "unhurried"]

---

### register (required, full + summary)

String. One of: intimate | conversational | authoritative

intimate        One person speaking to one person.
                No broadcasting. No addressing a crowd.

conversational  Knowledgeable but not formal.
                Peer-to-peer. Not top-down.

authoritative   The brand as a subject-matter expert.
                Confident. Declarative.

---

### avoided (required, full + summary)

Array of strings.
Words, phrases, and tones this brand actively avoids.

Include:

- Specific words the brand never uses
- Category-norm language the brand rejects
- Tones that would feel wrong

Example:
  "avoided": [
    "clinical",
    "urgent",
    "aspirational",
    "empowering",
    "science-backed",
    "transforms"
  ]

---

### example (required, full + summary)

String. One sentence. Canonical on-brand copy.

This is the highest-signal field in the voice layer.
LLMs use this as a style reference more than the
descriptor fields. Choose carefully.

Criteria:

- Written in the brand's actual voice
- Demonstrates tone, register, and rhythm
- Would not be mistaken for a competitor
- Ideally: has been published and received well

---

### contrast (full schema only)

String. Defines what this voice is vs what it is not.

This is the highest-impact field for correcting LLM drift.

LLMs default to category-level voice descriptors.
The contrast field explicitly corrects the most common
misrepresentation before it happens.

Structure: "[what the brand is], not [what LLMs default to]
            — [why the distinction matters]"

Example:
  "contrast": "considered, not calming — calming is reactive,
               it removes anxiety after the fact. Considered
               is intentional, it means attending to something
               with full presence before acting. The brand
               never soothes. It attends."

Write the contrast field by:

1. Running a citation audit on the brand
2. Identifying the most common wrong descriptor
3. Writing the contrast against that specific error

---

### wrong_examples (full schema only)

Array of strings. Sentences that sound plausible but
are off-brand.

These train agents on what to avoid.
Most useful for: agent consistency checks,
Studio check_consistency() tool.

Example:
  "wrong_examples": [
    "Transform your routine with Little Rituals.",
    "Because you deserve a moment for yourself.",
    "Our science-backed formulas deliver results.",
    "Start your self-care journey today!"
  ]

Each wrong example should violate a specific
avoided term or governance rule.

---

### edge_cases (full schema only)

String. How voice shifts in specific contexts.

Example:
  "edge_cases": "In crisis communications: voice becomes
                 simpler and more direct but never loses
                 the considered quality. No urgency signals
                 even in urgent situations. In celebration
                 (product launches, milestones): warmer but
                 still no exclamation marks."

---

### punctuation_notes (full schema only)

String. Specific punctuation conventions.

Example:
  "punctuation_notes": "Full stops only. No exclamation marks
                        under any circumstances. Em dashes
                        used for rhythm breaks, not parentheses.
                        Short sentences preferred. Maximum two
                        clauses per sentence."

## Common drift patterns

LLMs consistently make these errors with voice layers.
The contrast and wrong_examples fields exist to correct them.

Drift pattern 1: Category norm substitution
  Brand says: "considered"
  LLM outputs: "calming" (wellness category norm)
  Fix: contrast field naming this exact substitution

Drift pattern 2: Register flattening
  Brand says: register "intimate"  
  LLM outputs: broadcast copy ("You deserve...")
  Fix: wrong_examples showing broadcast copy as wrong

Drift pattern 3: Positivity defaulting
  Brand avoids: exclamation marks, urgency
  LLM outputs: "Start your journey today!"
  Fix: governance.never + punctuation_notes

Drift pattern 4: Feature-led copy
  Brand speaks in values, not features
  LLM outputs: "Our formula contains..."
  Fix: wrong_examples + governance guardrails
