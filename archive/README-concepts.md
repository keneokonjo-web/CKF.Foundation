# CKF Foundation: website concepts

Four standalone homepage concepts, a brand sheet, logos, wordmarks and icons for the
Obi (Prof.) Chukuka Okonjo and Prof. Kamene Okonjo Foundation (CKF).

> Education. Health. Opportunity. A legacy that lives on.

## View them

Open `index.html` in a browser (no build step), or run `python3 -m http.server` in this folder.

| File | Concept | Base reference | Fonts |
|---|---|---|---|
| `concepts/1-canopy.html` | Canopy | Hempel Foundation | Hanken Grotesk |
| `concepts/2-roots.html` | Roots | The Martin Family Initiative (themfi.ca) | Cormorant Garamond, Inter |
| `concepts/3-clearing.html` | Clearing | Velux Fonden | Instrument Sans, EB Garamond |
| `concepts/4-momentum.html` | Momentum | KLABU | Anton, Archivo |

Each page lists its fonts, colours and borrowed ingredients in an HTML comment at the top and in the
on-page **Design notes** button (bottom-left). Solvatten and ONE are mixed into several concepts (see `index.html`).

## Brand

`brand.html` shows everything; files are in `assets/brand/` (SVG, with PNGs in `assets/brand/png/`).

* **Logo A, swallow**: your supplied silhouette, traced to a clean vector (`mark-bird-*.svg`).
* **Logo B, pillars**: an arch holding three rising pillars for Education, Health, Opportunity (`mark-pillars-*.svg`).
* **Wordmarks** (one per concept, text converted to outlines so no font is needed): `wordmark-*`, full-name versions `fullname-*`, and 16 lock-ups `lockup-*`.
* **Icons**: `icon-*` and `favicon.svg`.

Regenerate with `npm install` then `npm run brand` (see `scripts/build-brand.cjs`).

## Structure

```
index.html            comparison hub
brand.html            logos, wordmarks, icons, font specimens
concepts/             the four concepts + shared/ (data.js, common.js, base.css, fonts.css)
assets/               img/ (stock photos), fonts/ (self-hosted woff2), brand/, thumbs/
scripts/              brand generator
```

## Honesty notes

* Copy is taken from the CKF mission, vision and tagline. Stories and "ways to apply" are marked **Sample**.
* No impact numbers are invented. The only figures shown are structural (3 pillars, 5 programme areas, 1 home community).
* Photos are illustrative Unsplash stock, not Nigerian or CKF-specific. Replace them with real CKF photography before launch.
* Two references were not reachable from the build environment: `hempel.foundation` (captured at `hempelfoundation.com`) and `dmfi.ca` (read as "the MFI", themfi.ca). `one.org` sits behind a bot check, so ONE's influence comes from its known approach, not a live capture.
* Reference sites were used only for ideas (layout, type mood, motion, structure). No text, images, logos or code were copied.
