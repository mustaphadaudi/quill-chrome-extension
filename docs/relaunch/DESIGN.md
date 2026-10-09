# Dictate design direction v0.2

Status: high-level brand direction approved; final interface mockups and design tokens pending. [BRAND.md](BRAND.md) is the source of truth for brand personality, palette direction and creative boundaries.

Positioning: a clean, premium, useful and credible writing assistant with a satirical fictional brand universe. Keep the core editing experience calm and legible; place character and humour in surrounding brand moments and optional microcopy. Do not imitate Grammarly's visual identity.

## UI principles
- UI should feel native to Chrome and not obstruct writing.
- Inline underlines: restrained, sufficiently contrasted, stable when the page scrolls.
- Suggestion cards: concise explanation, clearly distinguished original/replacement, Accept, Dismiss and optional Undo.
- Toolbar popup: small, high-quality status panel with quick settings and test connection.
- Writing workspace: optional separate view for longer text and rewrite actions.
- Theme: light first with thoughtful dark mode; consistent typography, spacing and motion; reduced-motion support.
- Do not use a conspicuous floating badge on every page before an explicit enable action unless user approves this behaviour.
- Screenshots and browser tests must cover light/dark, narrow layouts, keyboard navigation and zoom.

## Applying the brand to the interface
- Explore cream surfaces, black text and orange accents. Exact colours, contrast-safe combinations and dark-mode equivalents require mockup approval.
- Keep Accept, Dismiss, Undo, consent, permissions, privacy and error recovery direct and unambiguous. Do not use the mascot's authoritarian persona to pressure users into sharing text or accepting edits.
- Use the mascot sparingly around onboarding, headers and completion moments. Inline cards and underlines must prioritise the user's writing and usable controls.
- Separate decorative display typography from readable interface typography. Do not put poster textures or decorative lettering behind correction text.
- Status and suggestion categories must remain understandable without colour alone. Verify contrast, focus visibility, zoom and small-size icon legibility in the proposed designs.

The earlier editorial/teal, technical/blue and creative/violet routes were unapproved explorations and are superseded by the cream/orange/black direction recorded in [DECISIONS.md](DECISIONS.md).

## Next design review
Review two or three original mascot/logo concepts in the same small set of interface mockups: toolbar popup, inline suggestion card, and onboarding/consent. Show a successful correction and an error state, plus light/dark, narrow and zoomed views. Select one route before producing final assets and implementation-ready tokens. The [brand brief](BRAND.md) lists unresolved decisions; the [asset handoff](../../assets/brand/README.md) defines expected deliverables. This review does not authorise application implementation.
