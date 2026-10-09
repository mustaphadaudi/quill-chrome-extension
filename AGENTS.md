# Relaunch coding-agent instructions

This is a clean-sheet rewrite of a personal writing assistant Chrome extension. Work only on branch `relaunch/clean-slate-v1` or feature branches created from it. Preserve `main` and the legacy implementation. Do not merge or deploy without approval.

Read `docs/relaunch/PRODUCT.md`, `docs/relaunch/DESIGN.md`, and `docs/relaunch/TASKS.md` before significant implementation. Follow the smallest relevant scope; do not repeatedly read old Quill source unless investigating a specific question.

The approved product name is Dictate. Follow `docs/relaunch/BRAND.md` for the approved high-level brand direction and `assets/brand/README.md` for visual-asset status and handoff specifications. High-level direction does not constitute approval of final artwork or UI. Keep legacy Quill assets and application identifiers unchanged until an implementation task explicitly replaces them. Do not begin major implementation until product requirements, final design and technical approach are agreed.

Before implementation: state a concise task plan and acceptance checks. Build one independently verifiable vertical slice at a time. Make no assumptions about Google Docs internal APIs. Verify editor behaviour in real Chrome when possible and distinguish simulations from live acceptance.

Use TypeScript and Manifest V3, with minimal dependencies and restricted permissions. Keep credentials out of source, logs, commits and content-script messages. Never send text to a third-party AI service without clear user consent. Prefer compatibility, correctness, privacy and accessibility to animations.

Run relevant unit and browser checks before completion; report exact commands, passed and failed results, limitations and manual verification still required. Do not claim Google Docs works based only on mocked fixtures. Do not create subagents for routine tasks. Ask before destructive operations, publication, charges or major architecture changes.

Deliver concise summaries, commits, and reviewable diffs rather than full-file chat dumps.
