# Dictate design direction v0.2

Status: A+D hybrid brand direction and visual mockups approved as direction only; pixel-perfect UI specifications, interaction specifications and final design tokens pending. [BRAND.md](BRAND.md) is the source of truth for brand personality, palette direction and creative boundaries.

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
- Apply the selected warm cream, vivid orange, charcoal and sand direction, with limited sunset orange and sage accents. Shown hex values remain preliminary until verified; contrast-safe combinations and dark-mode equivalents require approval.
- Keep Accept, Dismiss, Undo, consent, permissions, privacy and error recovery direct and unambiguous. Do not use the mascot's authoritarian persona to pressure users into sharing text or accepting edits.
- Use the original Supreme Editor character primarily in marketing/onboarding and the minimalist crowned-nib emblem for the logo and extension icon. Inline cards and underlines must prioritise the user's writing and usable controls.
- Separate decorative display typography from readable interface typography. Do not put poster textures or decorative lettering behind correction text.
- Status and suggestion categories must remain understandable without colour alone. Verify contrast, focus visibility, zoom and small-size icon legibility in the proposed designs.

The earlier editorial/teal, technical/blue and creative/violet routes were unapproved explorations and are superseded by the cream/orange/black direction recorded in [DECISIONS.md](DECISIONS.md).

## Next design review
The A+D route is selected. The immediate next deliverable is UX flows and interaction specifications before Codex implementation:

- Onboarding and consent: explain checking, permissions and text sharing; define enable, decline and recovery paths.
- Standard inline editing: explicit check → loading → suggestion → accept/dismiss → undo where supported; define selection/focus, keyboard operation, stale results and scroll/resize behaviour.
- Toolbar popup and settings: status, site enable/disable, checking controls and preferences, including persistence and feedback.
- State coverage: empty, success, loading, offline, provider failure and quota exhaustion; keep correction, consent and recovery copy plain.

Review these flows in popup, inline suggestion-card and onboarding/consent mockups with light/dark, narrow, zoomed and keyboard/focus views. Evaluate proposed Bebas Neue headings/Inter body and emblem legibility at actual icon sizes. The approved visual references guide appearance but do not specify exact layouts or behaviour. The [brand brief](BRAND.md) lists unresolved decisions; the [asset handoff](../../assets/brand/README.md) defines expected deliverables. Final requirements, design and technical decisions must be agreed before the first bounded implementation brief. Google Docs remains a high-priority follow-on milestone after standard inline editing works. This review does not authorise application implementation.
