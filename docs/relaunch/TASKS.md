# Dictate development backlog — clean-slate relaunch

## Stage 0 — groundwork
- [x] Preserve legacy Quill code on main by creating relaunch/clean-slate-v1.
- [x] Record product brief and agent rules.
- [x] Approve product name: Dictate.
- [ ] Complete trademark/domain checks; name approval does not claim clearance or availability.
- [x] Record approved high-level brand direction in [BRAND.md](BRAND.md).
- [x] Establish [visual-asset handoff specifications](../../assets/brand/README.md); no final artwork yet.
- [x] Select A+D hybrid: Supreme Editor character for marketing/onboarding and crowned fountain-pen nib emblem for logo/icon; visual mockups approved as direction only.
- [ ] Transfer the approved reference image and record provenance in the existing asset inventory; transcribe shown preliminary hex values and verify before locking tokens.
- [x] Draft UX flows and interactions for onboarding/consent, inline check/accept/dismiss/undo, popup/settings and loading/empty/error states in [DESIGN.md](DESIGN.md).
- [x] User approved the reviewed look and interaction flow on 2026-10-09; first coding handoff requested.
- [x] Create editable Figma review 01: twelve screens, 29 prototype actions and a repository review-sheet export linked from DESIGN.md.
- [x] Record explicit review approval and release the bounded local-test milestone below.
- [x] Approve review 01 visual hierarchy and basic interaction flows for M1.
- [ ] Finalise production palette tokens, typography/assets and remaining microcopy after development review.
- [ ] Produce and approve final assets with provenance and small-size, light/dark and accessibility checks per the asset handoff.
- [ ] Decide data/inference model and acceptable permissions.
- [ ] Decide framework after a small documented spike.
- [x] Release bounded M1 product scope and implementation brief with acceptance checks; require the engineer to record the technical preflight before implementation.
- [x] Release the first-slice brief and acceptance matrix below for local-test implementation; live inference remains gated.

## Stage 1 — vertical slice
- [ ] Create isolated new source tree and minimal MV3 extension manifest.
- [ ] Add fixture site and test runner.
- [ ] One textarea: capture → explicit check → mapped suggestion → underline → accept/dismiss.
- [ ] Verify actual Chrome rendering, scroll, resize, keyboard use and stale text.
- [ ] Add reliable error and consent states.

## Stage 2 — practical extension
- [ ] Contenteditable and supported rich text fields.
- [ ] Popup/settings, polished UI, light/dark variants.
- [ ] Strong privacy and compatibility review.

## Stage 3 — Google Docs high priority
- [ ] Feasibility spike documented and manually tested.
- [ ] Selected text and safe direct edit.
- [ ] Anchored annotations as a separate experiment, only if reliable.
- [ ] Live account acceptance tests and fallback UX.

## Handoff policy
One primary Codex developer. Each task gets its own completion criteria, tests and small reviewable commit. Add a second agent only for independent work.

## First implementation milestone — M1 local correction slice

Status: **Ready for Codex implementation of M1**, following the user's 2026-10-09 approval of the reviewed look/flow and request to begin coding. This release is scoped to local deterministic checking. It does not select a live AI provider or approve final production assets.

### Start here — implementation handoff

Repository: `mustaphadaudi/quill-chrome-extension`. Base branch: `relaunch/clean-slate-v1`. Read AGENTS.md, PRODUCT.md, DESIGN.md, BRAND.md, DECISIONS.md and the asset inventory before edits. Use the handoff commit supplied by the planning chat as the minimum reference; preserve newer unrelated work. Do not repeat brand exploration or repository-wide legacy analysis.

1. Confirm branch, working-tree state and relevant repository conventions. State a concise plan mapped to UX-01 through UX-13 below.
2. Perform a bounded technical preflight: compare a lean TypeScript/MV3 setup with WXT only as needed. Choose and document the smallest maintainable toolchain, new-source location, exact permission strategy and adapter contract in DECISIONS.md before implementation. Routine build/test choices are delegated to the implementing engineer; a major architectural change still requires approval.
3. Implement M1 in an isolated relaunch directory. Use a deterministic in-process test checker with a conspicuous “Demo checker — no AI processing” label. No external text transmission, credentials, provider billing, telemetry or live inference. Simulate delayed results and errors through test fixtures, not production-looking provider claims.
4. Build the minimal popup/setup, explicit field check, underline, accessible suggestion card, Accept/Dismiss, guarded Undo, cancellation and stale-result handling. Match the reviewed visual hierarchy. Use review colours and type-only/artwork placeholders for development; do not claim final asset approval or replace legacy icons/identifiers. The full illustrated onboarding and settings suite are later polish.
5. Run the acceptance matrix and relevant tests/build. Verify the extension in real Chrome against a disposable local fixture with two textareas. Document exact commands, evidence, limitations and launch instructions. Report unavailable browser or assistive-technology checks rather than claiming they passed.
6. Commit a small reviewable change on the relaunch branch or a feature branch from it. Do not merge, deploy, publish or start the next milestone. End with a completion report and any decisions needed for live AI integration.

### M1 engineering constraints and preflight deliverables

- Use TypeScript and Manifest V3 with minimal dependencies. Preserve the legacy application and main branch.
- Checking is manual and limited to the selected eligible textarea. No whole-page extraction or automatic requests. Store only preferences; keep writing/results transient.
- Use the minimum permissions required for the local fixture and explicit user activation. Do not default to broad all-sites access. Document how the proposed exact-origin site preference relates to actual browser access; never show a persisted permission grant if access is only temporary. Production site-access policy remains subject to review before broadening scope.
- Setup must truthfully describe the local demo checker. User activation/site controls still gate checking; production provider consent is not implemented with placeholder promises.
- Define and test a typed result contract with a text snapshot/version, validated exact ranges and replacement strings. Reject invalid/overlapping/out-of-date edits safely.
- Record an explicit demo input-size limit, finite timeout, and a numeric UI responsiveness target plus measurement environment before testing. These are engineering test parameters, not user-approved provider limits or commercial performance promises.
- Record toolchain rationale and permission/adapter decisions in DECISIONS.md. Ask only if a necessary decision crosses these boundaries; otherwise proceed with the bounded local-test slice.

### Readiness status and deferred gates

- [x] Reviewed visual direction and interaction flow approved for the first slice, including guarded Undo.
- [x] First milestone bounded to local deterministic checking; provider selection does not block M1.
- [x] Existing labelled mockup assets/colours retained for development, without promoting them to final production assets.
- [ ] Implementer records the technical preflight before product edits.
- [ ] Before live inference: select processing model and agree real consent, retention, credentials, permissions and provider limits.
- [ ] Before production polish/release: transfer the original reference, verify palette/font requirements, approve final artwork and complete the broader design/accessibility review.

### Objective and boundaries

Demonstrate one reliable user-initiated correction in an ordinary textarea in real Chrome: setup/consent → select field → Check this field → current suggestion underline/card → Accept or Dismiss → guarded Undo. Keep the legacy Quill source and identifiers intact; use an isolated relaunch source tree whose exact location is decided with the toolchain.

Include a minimal popup/site control, explicit checking, result validation, accessible suggestion review, cancellation and recovery states. Use a deterministic test adapter for reproducible tests. Clearly label fixture output; it is not evidence of working live inference. Live inference is excluded from M1; no provider setup or credentials are needed.

Exclude contenteditable, Google Docs, automatic/debounced checking, batch acceptance, permanent ignore rules, tone modes, full-document rewrites, accounts, paid subscriptions and publication from this first slice. The full settings and illustrated onboarding designs guide later product polish; use the minimal truthful local-demo setup described above for M1.

### Acceptance matrix

| ID | Scenario | Pass condition / required evidence |
| --- | --- | --- |
| UX-01 | Consent missing, site disabled or browser access denied | No check request; clear user-triggered setup/recovery. Capture request assertions, not just disabled-button screenshots. |
| UX-02 | No target, empty target or excluded field | No text sent; appropriate disabled/unsupported state. Include password, read-only and removed-field fixtures. |
| UX-03 | Two textareas; focus one then open popup | Only the intended field is checked and edited. Reopening popup never submits a duplicate request. |
| UX-04 | Deterministic “She go to work.” suggestion | Underline and labelled card show correct text/range; Accept changes only “go” to “goes”, restores focus/caret and leaves other fields untouched. |
| UX-05 | Dismiss, Close and Escape | Dismiss removes only the current suggestion; Close/Escape leave text and suggestion status unchanged; focus returns predictably. |
| UX-06 | Guarded Undo | Immediate Undo restores exact prior text/selection. Intervening typing prevents the app Undo from overwriting new text. Test native undo separately and report incompatibilities. |
| UX-07 | Type while a delayed check runs | Old response is ignored; no stale actionable suggestion, no automatic recheck. Repeat with navigation, field replacement, consent revocation and site disable. |
| UX-08 | Accept one of several suggestions | Remaining annotations are invalidated; Check again is explicit. No stale range application. |
| UX-09 | Cancel or rapidly repeat Check | One active request per field; Cancel invalidates late output; duplicate action cannot apply a result twice. |
| UX-10 | Offline, timeout, quota/auth failure, malformed output and oversize input | Each maps to a safe recoverable state; no endless retries, silent truncation, raw secrets or text loss. |
| UX-11 | Scroll, resize, zoom and long replacement | Card/underline anchor stays correct or safely hides; controls remain usable. Capture real Chrome evidence. |
| UX-12 | Keyboard, accessible labels and announcements | Full check/review/accept/dismiss flow works without a mouse; focus stays predictable; no trap or colour-only meaning. Include assistive-technology/manual checks. |
| UX-13 | Reload/restart and preferences | Approved preferences persist; text/results do not. Re-enabling does not automatically check a field. |

For M1, provider failures and quota/auth responses in UX-10 are simulated adapter scenarios. They verify recovery logic only. UX-01 exercises local-demo activation/access gates, not real provider consent. UX-07 exercises turning off local checking; production consent revocation remains a later integration check. UX-13 applies to implemented preferences only; document any deferred settings explicitly.

### Evidence required for completion

Run relevant unit checks for state transitions/range validation and browser acceptance for the complete textarea interaction. Record exact commands and outcomes, Chrome version, fixture scenarios and screenshots for the agreed visual states. Distinguish mocked provider evidence from actual provider requests, and automated results from manual keyboard/assistive-technology checks. No test has been run or passed merely because this matrix exists.

Summarise any failures and unsupported behaviour. Preserve main; do not merge, deploy or publish. After the first slice passes, extend to contenteditable and practical extension controls, then proceed to the high-priority Google Docs feasibility milestone with a disposable real document and separate live acceptance evidence.
