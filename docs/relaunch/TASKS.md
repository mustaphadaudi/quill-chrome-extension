# Development backlog — clean-slate relaunch

## Stage 0 — groundwork
- [x] Preserve legacy Quill code on main by creating relaunch/clean-slate-v1.
- [x] Record product brief and agent rules.
- [ ] Choose product name (candidate only until legal/domain checks).
- [ ] Approve UI direction and basic user flows.
- [ ] Decide data/inference model and acceptable permissions.
- [ ] Decide framework after a small documented spike.

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
