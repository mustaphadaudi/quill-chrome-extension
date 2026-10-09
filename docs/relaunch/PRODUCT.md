# Dictate — product requirements v0.2

Status: M1 local-test implementation released; broader product remains in discovery. **Dictate** is the approved product name, with an approved high-level [brand direction](BRAND.md). Final interface design and technical choices remain open. This is a clean-sheet implementation while preserving Quill v0.x on the main branch. Name approval does not imply completed trademark or domain checks.

## Product promise
A fast, private-by-design writing assistant that flags spelling, grammar and clarity problems in text fields, explains corrections, and applies approved edits without breaking the user's writing.

## Intended platforms
1. Chrome Manifest V3 extension for standard textareas and contenteditable fields.
2. Google Docs integrated support, deliberately following stable ordinary-editor functionality.
3. Future supported sites based on verified compatibility, not assumptions.

## MVP acceptance
- Enable/disable extension and site support.
- Detect eligible editable text fields without intercepting passwords or sensitive non-writing fields.
- Check text on explicit user action first; optional debounced checking later.
- Display anchored visible underlines and accessible suggestion cards.
- Explain one suggested correction; accept and dismiss without scrambling text, selection, or unrelated formatting.
- Handle editing, scrolling, resizing and stale results safely.
- Handle API failures, latency, quota exhaustion and offline states visibly; do not retry endlessly.
- Privacy: explicit user consent, minimal permissions, secure key handling; never commit keys.
- Automated tests and real Chrome fixture acceptance required.

## Google Docs milestone
- Document a feasibility spike: safe reading of selected document text, text/range mapping and permission requirements, then verified edit acceptance and geometry anchoring.
- Demonstrate one actual supported interaction in a disposable real Docs document before extending to live red underlines.
- Preserve a supported sidebar/manual option when full inline functionality is not feasible; no silent promise of universal Docs compatibility.

## Out of scope for MVP
Paid subscriptions, user accounts, public Chrome Web Store publication, AI-generated advertising and broad agentic browsing.

## Key decisions still open
Trademark and domain research for Dictate; privacy and AI inference approach (local vs BYO API); WXT vs lean TypeScript toolchain; final design approval. Remaining visual decisions and asset requirements are tracked in [BRAND.md](BRAND.md) and the [asset handoff](../../assets/brand/README.md).

## M1 implementation handoff

[DESIGN.md](DESIGN.md) now defines proposed onboarding, consent, field-checking, correction, popup/settings and recovery flows. Recommended defaults are explicit whole-field checking, site opt-in, invalidation after text changes, no automatic recheck and guarded Undo. The user approved the reviewed look/flow and requested implementation on 2026-10-09. These behaviours now guide M1, including guarded Undo.

[TASKS.md](TASKS.md) releases the first-textarea milestone using a labelled deterministic local demo checker, with a technical preflight and measurable acceptance scenarios. No live inference or credentials are included in M1. Contenteditable follows that slice; Google Docs remains a high-priority follow-on. Tone modes, a separate rewrite workspace and automatic checking are deferred from the first slice rather than silently included in the implementation brief. Source image transfer, verified palette values, production assets, broader interface approval and live-inference choices remain open.
