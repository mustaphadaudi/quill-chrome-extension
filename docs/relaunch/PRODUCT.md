# Writing assistant relaunch — product requirements v0.1

Status: discovery/approval; working title TBD. This is a clean-sheet implementation while preserving Quill v0.x on the main branch.

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
Brand name/trademark and domain research; privacy and AI inference approach (local vs BYO API); WXT vs lean TypeScript toolchain; final design approval.
