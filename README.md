# CKF Foundation website

Education. Health. Opportunity. A legacy that lives on.

* `public/` the site (static HTML/CSS/JS, deployed by Vercel). `public/index.html` is the page.
* `api/submit.js` serverless function: website form → Google Sheet (see `integrations/google-sheets/SETUP.md`).
* `integrations/google-sheets/` Apps Script + setup steps.
* `scripts/` generators: `build-map.cjs` (dotted maps from GADM boundaries), `build-brand-pack.cjs` (logos, icons, PDF guide).
* `brand-pack/` generated brand pack (also delivered as a zip).
* `archive/` the four earlier design concepts and their brand sheet (not deployed).

Trustee photos live in `public/assets/trustees/`. To add one, drop a 4:5 colour portrait with the exact filename used in `index.html` (for example `onyema-okonjo.jpg`); until then a monogram is shown.

Credits: Dr. Ngozi Okonjo-Iweala photo, World Trade Organization, Wikimedia Commons, CC BY-SA 2.0. Map boundaries: GADM 4.1. Other photographs are illustrative Unsplash stock and should be replaced with CKF photography. Fonts: Hanken Grotesk and Cormorant Garamond (SIL OFL).
