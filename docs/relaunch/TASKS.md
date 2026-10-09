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
- [ ] Next: specify UX flows and interactions for onboarding/consent, inline check/accept/dismiss/undo, popup/settings and loading/empty/error states before Codex implementation.
- [ ] Approve final UI direction, basic user flows, palette tokens, typography and microcopy boundaries using [DESIGN.md](DESIGN.md).
- [ ] Produce and approve final assets with provenance and small-size, light/dark and accessibility checks per the asset handoff.
- [ ] Decide data/inference model and acceptable permissions.
- [ ] Decide framework after a small documented spike.
- [ ] Confirm product requirements and prepare the first bounded Codex implementation brief with acceptance checks once design and technical decisions are agreed.

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
