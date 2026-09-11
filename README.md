# hunch — landing page

Pre-launch waitlist page for **hunch**, a platform for single-ingredient superfoods.
Flagship release: hunch fiber (psyllium husk). Static site, no build step — plain HTML/CSS/JS.

## Structure

- `index.html` — the page (hero, problem, solution, waitlist, footer)
- `styles.css` — all styling (cream/olive/lime palette, Plus Jakarta Sans throughout)
- `script.js` — waitlist form submit handling + footer year
- `CNAME` — empty placeholder; add your real domain here before running paid ads
- `.nojekyll` — tells GitHub Pages to serve the files as-is (skip Jekyll processing)

## Before launch

1. **Formspree**: in `index.html`, replace the form's `action="https://formspree.io/f/YOUR_FORM_ID"`
   with your real Formspree endpoint.
2. **Custom domain**: put your domain (e.g. `gethunch.com`) as the only line in `CNAME`, then
   configure DNS per [GitHub's custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).
3. **OG url**: update the `og:url` meta tag in `index.html` once the real domain is live.

## Local preview

Just open `index.html` in a browser — no server or build step required.

## Deploy

Pushes to `main` serve automatically via GitHub Pages (configured to serve from the repo root).
