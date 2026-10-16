# Projectify Zone — website

Marketing site for Projectify Zone, served by GitHub Pages at <https://projectifyzone.com/>.
Plain HTML/CSS/JS: no build step, no dependencies. Push to `main` and it's live.

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | The landing page (all homepage content lives here) |
| `assets/css/main.css` | The design system: tokens at the top, then components, responsive rules and print |
| `assets/js/main.js` | Theme toggle, mobile menu, active nav link, sticky mobile CTA, project brief form |
| `assets/js/theme-init.js` | Tiny script in `<head>` that applies the saved theme before first paint |
| `assets/fonts/` | Self-hosted Inter and Space Grotesk (SIL Open Font License, see `LICENSE.txt`) |
| `assets/img/` | Favicons, app icons and the social-share image (`og-image.png`) |
| `brand/` | Logo kit: all logo versions as SVG + PNG, colours and usage guide ([brand/README.md](brand/README.md)) |
| `students.html` | Student mentorship page (linked from the footer only) |
| `thanks.html` | Shown after sending the project brief if JavaScript is off |
| `CNAME` | Custom domain for GitHub Pages (`projectifyzone.com`) |
| `privacy.html` | Privacy policy (India DPDP Act 2023), linked from the footer and the enquiry CTA |
| `404.html` | Page shown for broken links |
| `.nojekyll` | Tells GitHub Pages to serve files as-is instead of running Jekyll |
| `robots.txt`, `sitemap.xml` | Search-engine discovery |
| `site.webmanifest` | Lets phones "Add to Home Screen" with the right icon |

## Common edits

- **Project brief form**: the `<form id="brief-form">` in `index.html` posts to FormSubmit (`action` and
  `data-endpoint`). To change provider, update both attributes and the `connect-src` / `form-action` entries in the
  Content-Security-Policy `<meta>` tag.
- **Prices, contact details**: all in `index.html` (search for `₹`, `99866`, `shreyas@`). Prices also appear in the FAQ.
- **Brand colours**: change `--accent-1` / `--accent-2` in `assets/css/main.css` (once for dark, once for light).
- **Logo**: the header/footer logo is inline SVG in `index.html`; its colours come from `--brand-a` / `--brand-b` in `main.css`. Source files live in `brand/`.
- **After content changes**: update `<lastmod>` in `sitemap.xml`.
- **Header or footer**: the same markup is repeated in all five HTML pages (no build step), so change it in each.
- **After editing CSS or JS**: bump the `?v=5` suffix on the `main.css`, `main.js` and `theme-init.js`
  links in every HTML page so returning visitors don't get a stale cached copy.

## Engineering notes

- **No third-party requests.** Fonts are self-hosted, so pages load faster and visitors' IPs aren't sent to Google.
- **Content Security Policy** is set with a `<meta>` tag on every page (GitHub Pages can't send custom headers).
  It only allows files from this site, so **don't add inline `<script>` or `style="..."` attributes**; put code in
  `assets/js/` and styles in `main.css`. If you add an external service (analytics, a chat widget, an embedded
  form), add its domain to the policy on each page.
- **Accessibility target: WCAG 2.2 AA.** Checked with axe-core in both themes on desktop and mobile.
- **Motion** is limited to short hover/focus transitions and the menu fade; all of it is disabled for visitors who ask for reduced motion.

## Design system

The look is an engineering drawing, derived from the circuit-trace logo:

- **Colour roles:** cyan (`--brand-a`, `--accent`) for traces, links and primary actions; pink (`--brand-b`) only for
  small "pads": highlights, the featured-tier flag, required markers. Neutrals carry everything else. No gradients.
- **Structure:** hairline rules (`--line`) separate content instead of cards with shadows. Cards with a border are
  reserved for things that really are objects: the pricing table, the profile and the form.
- **Type:** Space Grotesk for headings, Inter for text, the system monospace for datasheet-style labels
  (`.overline`, step numbers, form legends). Sizes come from the `--fs-*` scale; body text is capped at `--measure`.
- **Spacing:** the `--space-*` scale and `--section-y` for section padding.
- **Controls:** 6px radius (`--radius`), at least 44px tall, visible focus ring from `--accent`.
- **Hero drawing:** inline SVG (exploded view of a prototype) coloured by the `.d-*` classes, so it follows the theme.
- **Breakpoints:** 1080px (tablet), 900px (navigation collapses, single-column hero), 640px (phone).

## Going live on projectifyzone.com

Do these in order. Merging to `main` before step 1 would send visitors to a domain that doesn't resolve yet.

1. **DNS** at your domain registrar (or Cloudflare, recommended and free):
   - `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA` records for `@` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME` record for `www` → `p-shreyas543.github.io`
   - If using Cloudflare, set these records to **DNS only** (grey cloud) until GitHub has issued the HTTPS certificate.
2. **Merge** the branch into `main`.
3. **GitHub → repo Settings → Pages**: confirm the custom domain shows `projectifyzone.com`, wait for the DNS check
   to pass, then tick **Enforce HTTPS** (the certificate can take up to an hour).
4. **Email**: make sure `shreyas@projectifyzone.com` receives mail. Free options: Cloudflare Email Routing
   (forwards to your Gmail) or Zoho Mail's free plan.
5. **Activate the form**: send one test brief from the live site. FormSubmit emails an activation link to
   `shreyas@projectifyzone.com`; click it, then send another test. After activation FormSubmit gives you a random
   alias. Replace the email in the form's `action` and `data-endpoint` with it so the address isn't in the form code.
6. **Google Search Console**: add `projectifyzone.com`, verify via DNS, and submit `https://projectifyzone.com/sitemap.xml`.

## Preview locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```
