/* Brij Patel ,  site behaviour. No dependencies. */
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- boot + hero entrance ------------------------------------------ */
  const root = document.documentElement;
  const boot = () => {
    root.classList.remove('is-booting');
    root.classList.add('is-booted');
    document.querySelectorAll('.anim, .hero__name, .hero__eyebrow, .hero__glow')
      .forEach(el => el.classList.add('is-in'));
  };
  // wait for webfonts so the name does not rise, swap, and jump
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 900))])
      .then(() => requestAnimationFrame(boot));
  } else {
    requestAnimationFrame(boot);
  }

  /* --- reveal on scroll --------------------------------------------- */
  const revealables = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    // stagger siblings inside the same container
    revealables.forEach(el => {
      const sibs = el.parentElement ? [...el.parentElement.children].filter(c => c.classList.contains('reveal')) : [];
      if (sibs.length > 1) el.style.setProperty('--d', Math.min(sibs.indexOf(el), 4));
      io.observe(el);
    });
  }

  /* --- nav state, scrollspy, progress ------------------------------- */
  const nav = document.getElementById('nav');
  const bar = document.getElementById('progress-bar');
  const links = [...document.querySelectorAll('.nav__links a')];
  const targets = links
    .filter(a => a.getAttribute('href').startsWith('#'))
    .map(a => ({ a, el: document.querySelector(a.getAttribute('href')) }))
    .filter(t => t.el);

  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;

    nav.classList.toggle('is-stuck', y > 24);

    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (max > 0 ? Math.min(y / max, 1) * 100 : 0) + '%';

    const line = y + innerHeight * 0.32;
    let current = null;
    for (const t of targets) if (t.el.offsetTop <= line) current = t.a;
    links.forEach(a => a.classList.toggle('is-active', a === current));

    ticking = false;
  };

  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll();

  /* --- hero glow follows the pointer (desktop, motion allowed) ------ */
  const glow = document.querySelector('.hero__glow');
  if (glow && !reduced && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const hero = document.querySelector('.hero');
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      glow.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      glow.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    }, { passive: true });
  }

  /* --- scroll-edge bounce -------------------------------------------- */
  /* Past the top or bottom, the page gives a little. How much depends on
     how hard you pushed, and it springs back on its own. Desktop only:
     touch platforms already rubber-band natively and stacking a transform
     on top of that reads as lag. */
  const rubber = document.getElementById('rubber');
  const edgeT  = document.querySelector('.edge--top');
  const edgeB  = document.querySelector('.edge--bot');
  const fine   = matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (rubber && fine && !reduced) {
    const MAX = 64;        // px of give, asymptotic
    const K   = 0.13;      // spring stiffness
    const D   = 0.80;      // damping
    let offset = 0, vel = 0, raf = 0;

    const frame = () => {
      vel += -offset * K;              // pull toward rest
      vel *= D;
      offset += vel;
      if (Math.abs(offset) < 0.12 && Math.abs(vel) < 0.12) {
        offset = 0; vel = 0; raf = 0;
        rubber.style.transform = '';
        edgeT.style.opacity = edgeB.style.opacity = 0;
        return;
      }
      rubber.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      const lit = Math.min(Math.abs(offset) / (MAX * 0.7), 1);
      edgeT.style.opacity = offset > 0 ? lit : 0;
      edgeB.style.opacity = offset < 0 ? lit : 0;
      raf = requestAnimationFrame(frame);
    };

    addEventListener('wheel', e => {
      const atTop = scrollY <= 0;
      const atBot = Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight;
      const past  = (atTop && e.deltaY < 0) || (atBot && e.deltaY > 0);
      if (!past) return;
      // speed of the push sets how far it gives, with diminishing returns
      const push = -e.deltaY * 0.38;
      offset += push * (1 - Math.min(Math.abs(offset) / MAX, 1) * 0.85);
      offset = Math.max(-MAX, Math.min(MAX, offset));
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
  }

  /* --- theme switcher ------------------------------------------------ */
  /* One attribute on <html> re-skins the page, the same idea as the
     symlink swap in the hyprland repo. Storage is best-effort. */
  const store = {
    get() { try { return localStorage.getItem('theme'); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem('theme', v); } catch (e) { /* private mode */ } }
  };
  const btns = [...document.querySelectorAll('.theme__btn')];
  let themeTimer;

  const applyTheme = (name, animate) => {
    const root = document.documentElement;
    if (animate && !reduced) {
      root.classList.add('is-theming');
      clearTimeout(themeTimer);
      themeTimer = setTimeout(() => root.classList.remove('is-theming'), 500);
    }
    if (name === 'default') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', name);
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.set === name)));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content',
      getComputedStyle(root).getPropertyValue('--bg').trim() || '#0b0b0d');
    store.set(name);
  };

  btns.forEach(b => b.addEventListener('click', () => applyTheme(b.dataset.set, true)));
  const saved = store.get();
  if (saved && btns.some(b => b.dataset.set === saved)) applyTheme(saved, false);


  /* --- Kelly widget --------------------------------------------------- */
  /* The two curves are closed form. The faint runs behind them are simulated
     on a fixed seed, using the same uniform draws at every setting, so moving
     a slider changes the strategy and not the luck (common random numbers). */
  const fig = document.querySelector('[data-kelly]');
  if (fig) {
    const R = 200, W0 = 100, RUNS = 30;
    const X0 = 54, X1 = 612, Y0 = 12, Y1 = 206;

    // one fixed draw matrix, reused for every parameter setting
    const rand = (seed => () => {            // mulberry32
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    })(20251101);
    const U = new Float64Array(RUNS * R);
    for (let i = 0; i < U.length; i++) U[i] = rand();

    const $ = q => fig.querySelector(q);
    const out = {};
    fig.querySelectorAll('[data-out]').forEach(el => out[el.dataset.out] = el);
    const gGrid = $('[data-grid]'), gPaths = $('[data-paths]');
    const pMean = $('[data-mean]'), pTyp = $('[data-typ]'), desc = $('[data-desc]');

    const fmt = w => w >= 1e6  ? w.toExponential(1).replace('e+', ' \u00d7 10^')
                   : w >= 1000 ? Math.round(w).toLocaleString()
                   : w >= 10   ? w.toFixed(0)
                   : w >= 1    ? w.toFixed(2)
                   : w >= 0.001 ? w.toFixed(3)
                   : 'under 0.001';

    const draw = () => {
      const p = +$('[data-in="p"]').value, f = +$('[data-in="f"]').value;
      const up = 1 + f, dn = 1 - f;
      const g  = p * Math.log(up) + (1 - p) * Math.log(dn);   // log growth / round
      const m  = 1 + f * (2 * p - 1);                         // arithmetic growth / round
      const star = Math.max(0, 2 * p - 1);

      // closed-form curves, in log10 wealth
      const typ = [], mean = [];
      for (let t = 0; t <= R; t++) {
        typ.push(Math.log10(W0) + t * g / Math.LN10);
        mean.push(Math.log10(W0) + t * Math.log10(m));
      }

      // sample runs, same draws every time
      const runs = [];
      for (let i = 0; i < RUNS; i++) {
        const path = [Math.log10(W0)];
        let l = Math.log10(W0);
        for (let t = 0; t < R; t++) {
          l += Math.log10(U[i * R + t] < p ? up : dn);
          path.push(l);
        }
        runs.push(path);
      }

      // decade-snapped domain keeps the axis from jittering as you drag
      let lo = Math.min(typ[R], ...runs.map(r => r[R])), hi = Math.max(mean[R], ...runs.map(r => r[R]));
      lo = Math.max(-2, Math.floor(Math.min(lo, 1)));
      hi = Math.min(9,  Math.ceil(Math.max(hi, 3)));
      const sx = t => X0 + (X1 - X0) * t / R;
      const sy = v => Y1 - (Y1 - Y0) * (v - lo) / (hi - lo);
      const d  = a => a.map((v, t) => (t ? 'L' : 'M') + sx(t).toFixed(1) + ' ' + sy(v).toFixed(1)).join('');

      let grid = '';
      for (let e = lo; e <= hi; e++) {
        const y = sy(e).toFixed(1);
        const lab = e >= 6 ? (10 ** (e - 6)) + 'M'
                  : e >= 3 ? (10 ** (e - 3)) + 'k'
                  : e <  0 ? (10 ** e).toFixed(-e)
                  : String(10 ** e);
        grid += `<line x1="${X0}" y1="${y}" x2="${X1}" y2="${y}"/>` +
                `<text class="c-tick" x="${X0 - 8}" y="${(+y + 3.5).toFixed(1)}" style="text-anchor:end">$${lab}</text>`;
      }
      grid += `<text class="c-tick" x="${X0}" y="${Y1 + 22}" style="text-anchor:start">round 0</text>` +
              `<text class="c-tick" x="${X1}" y="${Y1 + 22}" style="text-anchor:end">round ${R}</text>` +
              `<text class="c-tick" x="${X0 - 8}" y="${Y0 - 2}" style="text-anchor:end">bankroll</text>`;
      gGrid.innerHTML = grid;
      gPaths.innerHTML = runs.map(r => `<path class="k-run" d="${d(r)}"/>`).join('');
      pMean.setAttribute('d', d(mean));
      pTyp.setAttribute('d',  d(typ));

      const medFinal = W0 * Math.exp(g * R), avgFinal = W0 * Math.pow(m, R);
      out.p.textContent   = p.toFixed(2);
      out.f.textContent   = f.toFixed(2);
      out.star.textContent = star.toFixed(2);
      out.g.textContent   = (g >= 0 ? '' : '−') + Math.abs(g).toFixed(5);
      out.med.textContent = '$' + fmt(medFinal);
      out.avg.textContent = '$' + fmt(avgFinal);
      out.g.classList.toggle('is-neg', g < 0);
      out.med.classList.toggle('is-neg', medFinal < W0);

      const ratio = star > 0 ? f / star : Infinity;
      out.verdict.textContent =
        g < 0 ? `Growth is negative. The average still climbs to $${fmt(avgFinal)}, carried by a few runaway runs, while the typical run ends at $${fmt(medFinal)} from a $100 start.`
        : ratio > 1.02 ? `Above Kelly. You are giving up growth and buying drawdown.`
        : ratio < 0.98 ? `Below Kelly. Safer ride, slower compounding.`
        : `At the Kelly fraction, which maximises long-run log growth.`;
      desc.textContent = `At p equals ${p.toFixed(2)} and bet fraction ${f.toFixed(2)}, the typical path ends near $${fmt(medFinal)} and the average near $${fmt(avgFinal)} from a starting bankroll of $100.`;
    };

    fig.querySelectorAll('input[type=range]').forEach(i => i.addEventListener('input', draw));
    draw();
  }


  /* --- conditioning divergence explorer -------------------------------- */
  /* Data is a lambda sweep on a fixed operator (n=1000, k=30), each solver
     measured against a float64 QR reference. [kappa, baselineErr, randErr];
     a null baseline means its float32 Cholesky raised. Regenerate from the
     notebook and paste back in to update. */
  const kap = document.querySelector('[data-kappa]');
  if (kap) {
    /* [lambda, kappa, baselineErr|null, randomizedErr], best conditioned first */
    const SWEEP = [
      [1,5.415,1.56e-06,1.865e-07],[0.3162,14.96,1.676e-06,2.064e-07],
      [0.1,45.15,3.97e-06,2.472e-07],[0.03162,140.6,8.543e-06,3.591e-07],
      [0.01,442.5,2.63e-05,7.159e-07],[0.003162,1397,8.59e-05,1.834e-06],
      [0.001,4416,0.000493,5.255e-06],[0.0003162,1.396e+04,0.001937,1.509e-05],
      [0.0001,4.415e+04,0.005682,3.52e-05],[3.162e-05,1.396e+05,0.016,5.167e-05],
      [1e-05,4.415e+05,0.04622,5.896e-05],[3.162e-06,1.396e+06,0.2135,6.474e-05],
      [1e-06,4.415e+06,0.9938,7.64e-05],[3.162e-07,1.396e+07,null,9.55e-05],
      [1e-07,4.415e+07,null,0.0001112],[3.162e-08,1.396e+08,null,0.0001321],
      [1e-08,4.415e+08,null,0.0001996],[3.162e-09,1.396e+09,null,0.0004201],
      [1e-09,4.415e+09,null,0.001057],[3.162e-10,1.396e+10,null,0.002515],
      [1e-10,4.415e+10,null,0.005739],[3.162e-11,1.396e+11,null,0.01412],
      [1e-11,4.415e+11,null,0.03117],[3.162e-12,1.396e+12,null,0.05716],
      [1e-12,4.417e+12,null,0.1067],[3.162e-13,1.398e+13,null,0.1719],
      [1e-13,4.437e+13,null,0.2345],[3.162e-14,1.419e+14,null,0.3651],
      [1e-14,4.651e+14,null,0.7049],[3.162e-15,1.663e+15,null,1.199],
      [1e-15,8.998e+15,null,1.879]
    ];
    const X0 = 54, X1 = 606, Y0 = 14, Y1 = 208;
    const LX0 = 0, LX1 = 16, LY0 = -7, LY1 = 1;          // log10 domains
    const sx = k => X0 + (X1 - X0) * (Math.log10(k) - LX0) / (LX1 - LX0);
    const sy = e => Y1 - (Y1 - Y0) * (Math.log10(e) - LY0) / (LY1 - LY0);

    const q = n => kap.querySelector('[data-' + n + ']');
    const slider = kap.querySelector('[data-in="i"]');
    const o = {};
    kap.querySelectorAll('[data-out]').forEach(el => o[el.dataset.out] = el);

    const pts = SWEEP;                                   // best conditioned first
    const FAIL_K = pts.find(p => p[2] === null)[1];      // first kappa the baseline cannot do

    const line = (sel, f) => pts.filter(f).map((p, i) =>
      (i ? 'L' : 'M') + sx(p[1]).toFixed(1) + ' ' + sy(sel(p)).toFixed(1)).join('');

    const pow10 = e => `10<tspan dy="-4" font-size="7.5">${e}</tspan>`;
    let grid = '';
    for (let e = LX0; e <= LX1; e += 2) {
      const x = sx(10 ** e).toFixed(1);
      const anchor = e === LX1 ? 'end' : e === LX0 ? 'start' : 'middle';
      grid += `<line x1="${x}" y1="${Y0}" x2="${x}" y2="${Y1}"/>` +
              `<text class="c-tick" x="${x}" y="${Y1 + 20}" style="text-anchor:${anchor}">${pow10(e)}</text>`;
    }
    for (let e = LY0; e <= LY1; e += 2)
      grid += `<line x1="${X0}" y1="${sy(10 ** e).toFixed(1)}" x2="${X1}" y2="${sy(10 ** e).toFixed(1)}"/>` +
              `<text class="c-tick" x="${X0 - 8}" y="${(sy(10 ** e) + 3.5).toFixed(1)}" style="text-anchor:end">${pow10(e)}</text>`;
    grid += `<text class="c-tick" x="${X0}" y="${Y1 + 42}" style="text-anchor:start">condition number of the damped Gram matrix</text>` +
            `<text class="c-tick" x="${X0 - 8}" y="${Y0 - 2}" style="text-anchor:end">rel. err</text>`;
    q('grid').innerHTML = grid;

    q('band').setAttribute('x', sx(FAIL_K).toFixed(1));
    q('band').setAttribute('y', Y0);
    q('band').setAttribute('width', (X1 - sx(FAIL_K)).toFixed(1));
    q('band').setAttribute('height', Y1 - Y0);
    q('bandlab').setAttribute('x', (sx(FAIL_K) + 8).toFixed(1));
    q('bandlab').setAttribute('y', Y0 + 14);
    q('bandlab').textContent = 'float32 baseline fails here';

    q('base').setAttribute('d', line(p => p[2], p => p[2] !== null));
    q('rand').setAttribute('d', line(p => p[3], () => true));

    const sci = (v, html = true) => {
      const e = Math.floor(Math.log10(v));
      if (e >= 0 && e < 4) return v >= 100 ? String(Math.round(v)) : v.toPrecision(2);
      const m = (v / 10 ** e).toFixed(1);
      return html ? `${m} \u00d7 10<sup>${e}</sup>` : `${m}e${e}`;
    };
    const plain = v => sci(v, false);

    const draw = () => {
      const [lam, k, b, r] = pts[+slider.value];
      o.kap.innerHTML = sci(k);
      o.lam.innerHTML = sci(lam);
      o.eb.innerHTML  = b === null ? 'fails' : sci(b);
      o.er.innerHTML  = sci(r);
      o.ratio.textContent = b === null ? 'baseline unavailable' : (b / r).toFixed(1) + '\u00d7';
      o.eb.classList.toggle('is-neg', b === null);

      const x = sx(k).toFixed(1);
      q('cursor').setAttribute('x1', x); q('cursor').setAttribute('x2', x);
      q('cursor').setAttribute('y1', Y0); q('cursor').setAttribute('y2', Y1);
      q('dotr').setAttribute('cx', x); q('dotr').setAttribute('cy', sy(r).toFixed(1));
      if (b === null) { q('dotb').setAttribute('r', 0); }
      else { q('dotb').setAttribute('r', 3.5); q('dotb').setAttribute('cx', x); q('dotb').setAttribute('cy', sy(b).toFixed(1)); }

      o.verdict.textContent = b === null
        ? `At \u03ba \u2248 ${plain(k)} the float32 Cholesky no longer factorises, so the baseline returns nothing. The randomized solve still comes back, at ${plain(r)} relative error.`
        : `At \u03ba \u2248 ${plain(k)} both solvers work, and the randomized solve is ${(b / r).toFixed(1)} times more accurate.`;
      q('desc').textContent = o.verdict.textContent;
    };

    slider.max = pts.length - 1;
    slider.value = 0;
    slider.addEventListener('input', draw);
    draw();
  }

  /* --- footer year --------------------------------------------------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
