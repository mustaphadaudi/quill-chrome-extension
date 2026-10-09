# Dictate visual assets — placeholder and handoff

Status: A+D hybrid visual direction approved; source asset transfer pending. No final Dictate logo, mascot, font files, palette tokens or production exports are present. This directory is a documentation placeholder; it is not referenced by the extension manifest or runtime. Legacy assets in `icons/` remain unchanged.

The [brand brief](../../docs/relaunch/BRAND.md) owns creative direction. [DESIGN.md](../../docs/relaunch/DESIGN.md) owns interface principles. This file owns asset organisation, delivery requirements and approval status.

## Planned structure

Create these subdirectories only when real deliverables exist; the entries below are proposed locations, not links to existing assets:

```text
assets/brand/
  README.md          # inventory and approval record
  concepts/          # versioned references with explicit direction/production approval status
  source/            # editable masters or durable source-design references
  exports/
    logo/            # approved wordmark, symbol and lockups
    mascot/          # approved character illustrations
    icons/           # approved extension icon exports
  previews/          # review sheets and interface mockups
```

## Proposed delivery specification

| Deliverable | Required handoff | Current status |
| --- | --- | --- |
| Logo | Editable vector master, SVG and transparent PNG exports; full-colour and monochrome variants; documented clear space and minimum size | Crowned-nib emblem and strong Dictate wordmark direction selected; final vectors pending |
| Mascot | Editable source or source-design reference, transparent PNG and SVG where appropriate; approved primary pose and expression; usage and crop guidance | Supreme Editor direction selected; final artwork pending |
| Extension icon | Simplified original mark, proposed PNG exports at 16, 32, 48 and 128 px; inspect at native size on light and dark toolbar backgrounds; confirm runtime requirements in the implementation brief | Crowned-nib direction selected; production exports pending |
| Palette and typography | Exact colour values with usage roles and tested contrast combinations; light/dark treatment; font names, weights, fallbacks and licence/source records | Palette direction approved; shown hex values preliminary, transcription/verification pending; Bebas Neue headings/Inter body proposed |
| UI review sheet | Popup, inline suggestion card and onboarding/consent, including success/error states, narrow layouts, focus states, zoom and light/dark variants | Visual mockups approved as direction only; UX flows and interaction specifications pending |
| Voice examples | Approved short examples for brand moments alongside plain functional, privacy and error copy | Illustrative examples only in BRAND.md |

## Approval and provenance

### Approved direction reference — source asset transfer pending

- Source conversation: “Branch · Review Dictate Relaunch Status”, ID `6ac8c154-5d00-83eb-b625-1e7115774ef9`; approval recorded in [DECISIONS.md](../../docs/relaunch/DECISIONS.md) on 2026-10-09.
- User-supplied source path: `/mnt/data/dictate_authoritarian_grammar_playful_design.png`. This path is not accessible in the current workspace; the retrieved conversation exposes no image attachment or shown palette hex values. No reference image has been added to the repository.
- Intended repository destination after transfer: `assets/brand/concepts/dictate_authoritarian_grammar_playful_design.png` (not present; not a production export). Retain the original source and record creator/generation provenance and usage rights when available.
- Approval scope: A+D hybrid visual direction, including reference mockups; **not pixel-perfect UI specifications or final production vector assets**. Do not manufacture a replacement reference image or infer exact hex values from the verbal palette.
- After transfer, inspect the actual reference, transcribe its shown hex values as preliminary and verify them before locking implementation tokens. Full production handoff and UX approval remain outstanding.

### Handoff rules

- Label concepts with a route and version, such as `route-a-v01`; never label a concept as approved before a recorded user decision.
- When assets arrive, extend the inventory above with exact paths, version, creator/source, licence or usage rights, review date and approval reference. For generated artwork, retain generation provenance and review the result before approval.
- Keep editable masters and final exports associated with the same version. Record the selected route in [DECISIONS.md](../../docs/relaunch/DECISIONS.md), then update this inventory.
- Verify small-size legibility, transparency, consistent padding/crops, light/dark appearance and accessible text/control contrast. Do not convey status by colour alone.
- Do not include Rockstar/GTA assets, imitation logos, copied characters, game UI, real authoritarian insignia or unlicensed fonts. Store only original or appropriately licensed deliverables.
- Export dimensions here are handoff targets, not a manifest change. Wiring approved assets into the application requires a separate implementation task.
