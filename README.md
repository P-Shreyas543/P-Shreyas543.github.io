# Projectify Zone — website

Marketing site for Projectify Zone, served by GitHub Pages at <https://projectifyzone.com/>.
Plain HTML/CSS/JS: no build step, no dependencies. Push to `main` and it's live.
(The one generated part is the hero drawing: see [Hero figure](#hero-figure) below.)

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | The landing page (all homepage content lives here) |
| `assets/css/main.css` | The design system: tokens at the top, then components, responsive rules and print |
| `assets/js/main.js` | Theme toggle, mobile menu, active nav link, sticky mobile CTA, project brief form |
| `assets/js/theme-init.js` | Tiny script in `<head>` that applies the saved theme before first paint |
| `assets/css/figure.css` | Styles for the hero figure (line weights, theme colours, corner labels, legend buttons) |
| `assets/js/hero-figure.js` | Hero figure motion: takes the prototype apart on hover/tap, idle tour, keyboard and legend highlighting |
| `tools/hero-figure/` | Source of the hero drawing (`build.mjs`) and the vendored Anatomy kit it uses (MIT, see `kit/SOURCE.txt`). The site never loads these files |
| `assets/fonts/` | Self-hosted Archivo, variable weight and width (SIL Open Font License, see `LICENSE.txt`). The rupee sign is in a separate 2 KB file |
| `assets/img/` | Favicons, app icons and the social-share image (`og-image.png`) |
| `brand/` | Logo kit: all logo versions as SVG + PNG, colours and usage guide ([brand/README.md](brand/README.md)) |
| `embedded-systems-development.html` | Service page: embedded systems development (any microcontroller, CAN, Ethernet, MQTT, wireless). Linked from the homepage capabilities section and the footer |
| `insights.html` | List of founder guides (articles), linked from the footer |
| `hardware-prototype-cost-india.html`, `poc-vs-prototype-vs-mvp.html` | Founder guides (articles), linked from the homepage FAQ |
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
- **FAQ**: the questions also appear as `FAQPage` structured data in a `<script type="application/ld+json">` block in
  the `<head>` of `index.html`. When you add or change a question, change it there too so the two match word for word.
- **Header or footer**: the same markup is repeated in every HTML page (no build step), so change it in each.
- **Adding a guide (article)**: copy an existing guide such as `poc-vs-prototype-vs-mvp.html`, then change the
  `<title>`, description, canonical URL, Open Graph tags, the `BlogPosting` and `BreadcrumbList` data in the `<head>`,
  and the content. Add it to `insights.html` (the list and its `Blog` data) and to `sitemap.xml`. Keep the
  description under about 155 characters and the title under about 60.
- **Prices** also appear in the service page and the cost guide, as well as `index.html`.
- **After editing CSS or JS**: bump the `?v=6` suffix on the `main.css`, `main.js` and `theme-init.js`
  links in every HTML page so returning visitors don't get a stale cached copy.

## Engineering notes

- **No third-party requests.** Fonts are self-hosted, so pages load faster and visitors' IPs aren't sent to Google.
- **Content Security Policy** is set with a `<meta>` tag on every page (GitHub Pages can't send custom headers).
  It only allows files from this site, so **don't add inline `<script>` or `style="..."` attributes**; put code in
  `assets/js/` and styles in `main.css`. If you add an external service (analytics, a chat widget, an embedded
  form), add its domain to the policy on each page.
- **Accessibility target: WCAG 2.2 AA.** Checked with axe-core in both themes on desktop and mobile.
- **Motion** is limited to short hover/focus transitions, the menu fade and the hero figure. For visitors who ask for
  reduced motion the figure snaps between states and the idle tour is off; everything else is disabled.

## Design system

The look is an engineering drawing on a soldermask-blue board, derived from the circuit-trace logo. The hero drawing is
the one bold element; everything else stays quiet.

- **Colour roles:** dark theme background is soldermask blue (`--bg: #0a1628`); the light theme's text uses the same
  blue. Cyan (`--brand-a`, `--accent`) for traces, links and primary actions; pink (`--brand-b`) only for
  small "pads": highlights, the featured-tier flag, required markers. Neutrals carry everything else. No gradients.
- **Structure:** hairline rules (`--line`) separate content instead of cards with shadows. Cards with a border are
  reserved for things that really are objects: the pricing table, the profile and the form.
- **Type:** one family, Archivo, in three widths. Headlines (`h1`, `h2`, prices) are expanded (`--wdth-display`), like an
  equipment nameplate. Text is normal width. Specs, labels, tables and step numbers are condensed (`--wdth-data`,
  family `--font-data`), like a datasheet. Sizes come from the `--fs-*` scale; body text is capped at `--measure`.
- **Kept out on purpose:** small labels above headings, arrows after link text, "·"-joined phrases, all-caps labels and
  colour-accented words in headlines. Text links get a cyan underline instead of an arrow (`.link-arrow`). Numbers only
  mark real sequences (the four steps in "How it works").
- **Spacing:** the `--space-*` scale and `--section-y` for section padding.
- **Controls:** 6px radius (`--radius`), at least 44px tall, visible focus ring from `--accent`.
- **Hero drawing:** an isometric prototype that comes apart (see below). Its colours come from site tokens in `figure.css`, so it follows the theme.
- **Breakpoints:** 1080px (tablet), 900px (navigation collapses, single-column hero), 640px (phone).

## Hero figure

The homepage drawing is an isometric prototype (enclosure, PCB, microcontroller module, antenna, sitting on a cutting mat
next to the paper sketch it started from). Hover it (or tap it on a phone) and the screws, cover and circuit board lift
off in turn; when nobody is touching it, it tours itself: apart, each part highlighted, back together. The four legend
buttons under it highlight one part each. Keyboard: focus the drawing, then Space/Enter takes it apart or puts it back,
arrow keys step through the parts and Escape clears the highlight.

It's drawn with [Anatomy](https://github.com/wheresryan22/anatomy), a kit for isometric figures, so the geometry is real:
every part is a 3D solid and the build checks that no part ever draws in front of something it's behind, in every frame
of the motion.

- **Edit the drawing:** change `tools/hero-figure/build.mjs` (parts, sizes and which assembly lifts how far are at the
  top), then run `node tools/hero-figure/build.mjs --audit` (Node 18+). It checks the geometry and, if it passes, rewrites
  the SVG in `index.html` between the `<!-- hero-figure:start -->` / `<!-- hero-figure:end -->` markers. Never edit
  that SVG by hand; it's overwritten on the next build.
- **Edit the motion or labels:** `assets/js/hero-figure.js` (the readout text, the tour timing). Spring constants and
  the order the assemblies lift come from the build, as `data-*` attributes on the SVG.
- **Edit colours or line weights:** `assets/css/figure.css`.
- Bump the `?v=` on `figure.css` / `hero-figure.js` in `index.html` after changing them.

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
