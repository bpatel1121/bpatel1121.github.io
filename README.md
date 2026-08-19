# bpatel1121.github.io

Personal site. Static, no build step, no dependencies.

```
index.html    all content
styles.css    design system, layout, print rules
main.js       intro reveal, theme switch, scroll behavior, two widgets
preview.png   1200x630 social card
```

Live at [bpatel1121.github.io](https://bpatel1121.github.io).

## Local preview

```bash
python3 -m http.server 8000
```

## Notes

**Themes.** Three: default, `light`, `cyberpunk`. Each is a block of CSS variable
overrides keyed off a `data-theme` attribute on `<html>`, so one attribute re-skins
every surface at once. Contrast is audited per theme; every text token clears 4.5:1
against its own background.

**Widgets.** Two interactive figures, both plain SVG built in `main.js`.

- *Kelly sizing.* Typical and average bankroll paths are closed form; the faint runs
  behind them are simulated on a fixed seed using the same uniform draws at every
  setting, so moving a slider changes the strategy and not the luck.
- *Conditioning.* A lambda sweep on the damped Gram matrix, n=1000 k=30, each solver
  measured against a float64 QR reference. The data is a labeled array at the top of
  that block; regenerate it from the notebook to update, since the geometry is
  computed from those numbers and will not move on its own.

**Cache busting.** Assets load as `styles.css?v=2` and `main.js?v=2`. GitHub Pages
caches CSS and JS for ten minutes, which can leave a stale stylesheet against fresh
HTML. Bump both numbers when either file changes.

**Motion.** Intro reveal, scroll-edge bounce, and section fades all switch off under
`prefers-reduced-motion`, and the page degrades to fully visible with JavaScript
disabled via the `<noscript>` block in `index.html`.

**Social card.** `og:image` and `twitter:image` point at `preview.png` by absolute
URL, which scrapers require, so the domain is hard-coded. Update those tags plus
`og:url` and the canonical link if the site ever moves.
