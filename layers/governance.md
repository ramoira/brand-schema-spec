# Governance Component (Layer 5)

Normative source: [`SPEC.md`](../SPEC.md) and [`SPEC.schema.json`](../SPEC.schema.json). This page is a reading guide.

Governance is the meta-layer that makes the system operable: severity weighting, conflict resolution between components, surface-specific rules, and compliance routing.

## Top-level shape

- `governance._component`: `'governance'`
- `governance._version`: string
- `governance.severity`: SeverityRegistry
- `governance.conflictResolution`: ConflictResolution
- `governance.surfaceRules`: SurfaceRule[]
- `governance.overrideProtocol`: OverrideProtocol
- `governance.compliance`: ComplianceConfig
- `governance.preflight`: three questions

## Severity registry

`severity` makes enforcement explicit.

- `severity.absolute.constraints`: string[]
- `severity.absolute.violationResponse`: `block_output | flag_and_block`

- `severity.strong.constraints`: string[]
- `severity.strong.overrideProcess`: string
- `severity.strong.violationResponse`: `flag_for_review | block_output`

- `severity.contextual.constraints`: string[]
- `severity.contextual.judgmentBounds`: string
- `severity.contextual.violationResponse`: `log_for_audit`

## Conflict resolution

- `conflictResolution.componentPriority`: string[] (index 0 wins)
- `conflictResolution.knownConflicts`: ConflictResolutionRule[]
- `conflictResolution.defaultResolution`: FallbackBehaviour

## Surface rules

Surface rules resolve edge cases like comparison pages and customer service.

- `surfaceRules[].surface`: OutputSurface
- `surfaceRules[].applicableConstraints`: `all` | string[]
- `surfaceRules[].suspendedConstraints?`: string[]
- `surfaceRules[].objective`: string
- `surfaceRules[].primaryRail`: string
- `surfaceRules[].rails`: Rail[]
- `surfaceRules[].fallback`: FallbackBehaviour
- `surfaceRules[].fallbackContent?`: string
- `surfaceRules[].intentRules?`: intent-specific instructions

## Override protocol

- `authorisedRoles`: string[]
- `requiredFields`: string[]
- `maxDurationDays`: number
- `auditLogEndpoint`: string

## Compliance

- `violationWebhook`: string
- `routing.absolute|strong|contextual`: strings (emails/queues)
- `humanReviewTopics`: string[]
- `zeroToleranceTerms`: string[]
- `geographicOverrides?`: per-market additions

## Preflight

- `preflight.question1`
- `preflight.question2`
- `preflight.question3`
