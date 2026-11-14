# Naveen Huggi — Portfolio

Personal portfolio site, built with pure HTML/CSS/JS and deployed via GitHub Pages.

## Stack
- Vanilla HTML5, CSS (custom properties / OKLCH colour, CSS Grid), vanilla JS
- **Cobalt** design theme (Hallmark v2.0.0 · modern-minimal)
- Zero build tools — no npm, no bundler. Just push and it's live.

## Local preview
Open `index.html` directly in a browser.

## Deploy to GitHub Pages

1. Create a new repo on GitHub (e.g. `NaveenHuggi.github.io` for the apex URL, or any repo name for `NaveenHuggi.github.io/<repo-name>/`)
2. Push this folder:
   ```bash
   git remote add origin https://github.com/NaveenHuggi/<repo-name>.git
   git push -u origin main
   ```
3. In repo Settings → Pages → Source: **Deploy from branch** → `main` / `/ (root)`

## Updating the portfolio

| What to update | Where |
| :--- | :--- |
| Projects | `index.html` → `<!-- Work -->` section, each `<article class="project">` |
| Research / certificates | `index.html` → `<!-- Research -->` section |
| Skills | `index.html` → `<!-- Skills -->` section `.skill-row` items |
| Contact email | `index.html` → `href="mailto:..."` |
| LinkedIn / GitHub links | `index.html` → nav, about, footer |
| Colour tokens | `tokens.css` → `:root` block |
| Layout / typography | `style.css` |

## Files
```
naveen-portfolio/
├── index.html      # Main page
├── tokens.css      # Design tokens (colours, fonts, spacing)
├── base.css        # Reset, component primitives, animations
├── style.css       # Page layout and section styles
└── README.md
```
