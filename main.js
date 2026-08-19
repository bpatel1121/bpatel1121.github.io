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

  /* --- footer year --------------------------------------------------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
