# Frontend handoff — October 8, 2026

Based on the supplied 123.zip, preserving its nine services and full article pages.

## Run and build

- `npm install`
- `npm run dev -- --port 5173`
- `npm run build`

The build regenerates pages with `scripts/pages.mjs`, then applies the shared presentation updates in `scripts/polish.mjs`. Edit source templates and these generators rather than the generated HTML.

## Backend still to connect

Forms validate required fields locally. Medical applications require a license-card file. No form fields or selected files are uploaded or saved, and the frontend explicitly states that requests have not been sent. Replace the submit handler in `src/pages.js` when the backend is ready. Clinic form contact: office@canbycc.org.

Apple Pay, PayPal and Stripe are selection controls only. No payments are processed. The donation form supports one-time, weekly and yearly gifts and a custom amount. Check instructions from the supplied ZIP are retained.

## Imagery

New assets and prompts are documented in IMAGE-ASSETS.md. Photos are illustrative; they should not be represented as actual Canby staff or patients. Each visible content photo has one placement across the canonical pages. The clinic logo is intentionally shared across navigation and footers.

Public-record identifiers are preserved from the supplied clinic content. Registry links are lookup links, not accreditation endorsements.
