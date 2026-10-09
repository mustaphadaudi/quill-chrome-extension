# Decision log

- 2026-10-09 — Clean-sheet implementation in a new branch. Existing main and Quill history preserved.
- 2026-10-09 — Google Docs is a priority milestone after ordinary inline writing correction works.
- 2026-10-09 — Do not finalise name, brand, framework or provider before evaluating trade-offs.
- 2026-10-09 — ChatGPT owns product planning; GitHub holds approved decisions; Codex primarily implements and tests.
- 2026-10-09 — No public release, deployment, spending, credential exposure or merge without approval.

## Dictate brand approval — 2026-10-09

- **Dictate** is the approved product name. This supersedes the earlier deferral of name selection only; trademark/domain checks remain open, and framework/provider selection is still deferred.
- Approved high-level direction: an original fictional authoritarian mascot obsessed with good writing; satirical open-world-game-style humour; cream/orange/black palette direction; clean premium core UI with humour in surrounding microcopy and the brand universe. [BRAND.md](BRAND.md) is the canonical brief.
- Rockstar/GTA is a tonal reference only. Do not copy protected branding, logos, characters, typography, UI or artwork, or imply affiliation.
- The earlier unapproved visual routes in DESIGN.md are superseded. Exact colours, fonts, mascot appearance/name, logo, final copy and interface mockups are not yet approved. No finished brand assets are established by this decision.
- Approval source: the user's explicit documentation-update request following “Review Dictate Relaunch Status”. Any earlier concept image is exploratory, not an approved production asset.
- Product scope, privacy requirements, Google Docs sequencing and implementation/release approval boundaries remain unchanged.

## Dictate A+D hybrid approval — 2026-10-09

- The user approved the refined A+D hybrid following “Branch · Review Dictate Relaunch Status” (conversation `6ac8c154-5d00-83eb-b625-1e7115774ef9`) and explicitly requested this repository update. **Dictate** remains the approved product name.
- This supersedes the earlier unselected mascot/logo route and fictional institution status: A's original fictional **Supreme Editor** general (moustache, sunglasses, ceremonial cap, writing-themed decorations) serves marketing/onboarding; D's minimalist **crowned fountain-pen nib**, orange/black with a strong Dictate wordmark, supplies the logo and extension-icon direction.
- Approve the fictional **Ministry of Clarity** setting and witty propaganda-inspired voice around a clear, restrained correction UI. Do not copy GTA/Rockstar proprietary elements or real authoritarian insignia. [BRAND.md](BRAND.md) owns the detailed direction.
- Palette direction: warm cream, vivid orange, charcoal and sand, with limited sunset orange and sage accents. Shown hex values are preliminary, not implementation-locked until verified. They could not be read from the inaccessible reference; transcription and verification remain pending. Bebas Neue headings and Inter body are proposed.
- Visual mockups are approved **as direction only**, not pixel-perfect UI specifications or final production vector assets. Source reference: `/mnt/data/dictate_authoritarian_grammar_playful_design.png`; source asset transfer pending. See the existing [asset inventory](../../assets/brand/README.md) for provenance and transfer status.
- Immediate next step: UX flows and interaction specifications before Codex implementation. Google Docs remains a high-priority follow-on milestone after standard inline editing works. No product code, merge or deployment is authorised by this documentation decision.

## UX planning work — 2026-10-09

- The user explicitly approved pushing the brand documentation and requested the UX flows and related planning work. Brand commit `7e926e2` was pushed to `relaunch/clean-slate-v1`.
- Drafted the interaction contract in the existing [DESIGN.md](DESIGN.md) and a provisional first-textarea implementation brief/acceptance matrix in [TASKS.md](TASKS.md); no parallel specification document or product code was created.
- Proposed manual whole-field checking, site opt-in, stale-result invalidation, explicit rechecking and guarded Undo are **recommendations pending review**, not recorded user approvals. UX drafting does not select a provider, framework or permission architecture.
- Visual frames, final tokens/assets and technical readiness gates remain open. The Google Docs high-priority follow-on and no-merge/no-deployment boundaries are unchanged.
