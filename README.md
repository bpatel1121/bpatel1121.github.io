# brijpatel.dev , personal site

Static, no build step, no dependencies. Three files do everything.

```
index.html    the single-page site
styles.css    design system + layout
main.js       intro reveal, scrollspy, progress bar, theme switch, edge bounce
```

## Deploy to GitHub Pages

1. Create a repo named **`bpatel1121.github.io`** (a user site , it serves at the root URL).
2. Push these files to the `main` branch:

   ```bash
   git init
   git add .
   git commit -m "personal site"
   git branch -M main
   git remote add origin https://github.com/bpatel1121/bpatel1121.github.io.git
   git push -u origin main
   ```

3. In the repo: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.
4. Live at `https://bpatel1121.github.io` in a minute or two.

If you'd rather use a project repo (e.g. `github.com/bpatel1121/site`), it works
identically but serves at `bpatel1121.github.io/site/` , no config change needed
since every link is relative.

### Custom domain (optional)

Add a file named `CNAME` containing just your domain (e.g. `brijpatel.dev`),
then point an `ALIAS`/`ANAME` record at `bpatel1121.github.io` , or four `A`
records at `185.199.108-111.153`. Enable "Enforce HTTPS" in Settings → Pages.

## Editing

**Adding a resume PDF** , drop `resume.pdf` next to `index.html` and add a
button in the hero's `.hero__cta`:

```html
<a class="btn" href="resume.pdf" target="_blank" rel="noopener">Résumé (PDF)</a>
```

**Colours and themes** , every colour is a variable at the top of `styles.css`.
The accent is `--gold: #d8a657`. Change that one value and the whole site follows.

Three themes ship: the default gold, `light`, and `cyberpunk`. Each is a block of
variable overrides keyed off an attribute on `<html>`:

```css
html[data-theme="light"] { --bg: #fff1e5; --gold: #a15c12; ... }
```

The switcher in the nav sets that attribute, exactly the way the hyprland repo
repoints a symlink to re-skin every surface at once. To add a fourth theme, copy a
block, change the values, and add one button in the nav with a matching
`data-set`. The choice is remembered in `localStorage` inside a try/catch, so it
degrades quietly in private browsing.

Contrast is audited per theme: every text token clears 4.5:1 against its own
background, and the chart's two series clear the colour-vision separation
threshold in all three.

## Local preview

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Motion

Three pieces, all of which switch off under `prefers-reduced-motion` and all of
which degrade to a fully visible page with JavaScript disabled (see the
`<noscript>` block in `index.html`).

**Intro.** `<html>` carries `is-booting` until the webfonts resolve or 900ms
passes, whichever comes first, so the name never rises, swaps font, and jumps.
Then the eyebrow rule draws itself, the two words of the name rise out of their
own masks 110ms apart, the hero glow blooms, and the nav fades in last. Adjust
the beats with the `--d` values on the hero elements.

**Scroll-edge bounce.** Past the top or the bottom, the page gives a little and
springs back. How far it gives is set by wheel velocity with diminishing returns,
capped at 64px; a soft glow at that edge scales with the same number. Desktop
only, because touch platforms already rubber-band natively and stacking a
transform on top of that reads as lag. Tune `MAX`, `K` and `D` in `main.js`.

**Reveals.** Sections fade up once on first intersection, then stop being
watched.
