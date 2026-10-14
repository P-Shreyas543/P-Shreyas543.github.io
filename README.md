# Projectify Zone — website

Marketing site for Projectify Zone, served by GitHub Pages at <https://p-shreyas543.github.io/>.
Plain HTML/CSS/JS: no build step, no dependencies. Push to `main` and it's live.

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | The landing page (all content lives here) |
| `assets/css/main.css` | Styles; colours and fonts are tokens at the top of the file |
| `assets/js/main.js` | Theme toggle, mobile menu, scroll effects, hero animation |
| `assets/img/` | Logo, favicons, app icons and the social-share image (`og-image.png`) |
| `404.html` | Page shown for broken links |
| `robots.txt`, `sitemap.xml` | Search-engine discovery |
| `site.webmanifest` | Lets phones "Add to Home Screen" with the right icon |

## Common edits

- **Enquiry form link**: search `index.html` for `forms.gle/QDNKKc8QvhYjbJha7` and replace every occurrence.
- **Brand colours**: change `--accent-1` / `--accent-2` in `assets/css/main.css` (once for dark, once for light).
- **Logo**: replace `assets/img/logo.svg` (and `favicon.svg`). Regenerate the PNG icons if the mark changes.
- **After content changes**: update `<lastmod>` in `sitemap.xml`.

## Preview locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```
