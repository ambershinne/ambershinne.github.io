/* ============================================================
   Amber's Portfolio — shared interactions
   ============================================================ */

(function () {
  'use strict';

  // ---- 0. Don't restore scroll on reload (start at top) -----
  // Otherwise a refresh keeps the previous scroll position, so content
  // sits under the fixed nav and the top spacing looks like it shrank.
  // Hash-anchor navigation still works.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);

  // ---- 1. Scroll fade-in via IntersectionObserver -----------
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    els.forEach((el) => io.observe(el));
  }

  // ---- 2. Smooth page transition on internal nav clicks -----
  function initPageTransitions() {
    const sameOrigin = (url) => {
      try {
        const u = new URL(url, window.location.href);
        return u.origin === window.location.origin && !u.hash;
      } catch {
        return false;
      }
    };

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || a.target === '_blank') return;
      if (!sameOrigin(href)) return;
      // Only handle internal page hops to .html or root
      if (!/\.html?$|^\/?$|^\//.test(href)) return;

      e.preventDefault();
      document.body.classList.add('is-leaving');
      setTimeout(() => {
        window.location.href = href;
      }, 220);
    });

    // restore on bfcache return
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) document.body.classList.remove('is-leaving');
    });
  }

  // ---- 3. Active nav state ----------------------------------
  function initActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link').forEach((link) => {
      const target = link.getAttribute('href');
      if (!target) return;
      const isActive =
        target === path ||
        (path === '' && target === 'index.html') ||
        (path === 'index.html' && target === 'index.html');
      link.classList.toggle('is-active', isActive);
    });
  }

  // ---- 4. Side TOC active state via scroll position --------
  function initSideToc() {
    const links = document.querySelectorAll('[data-toc-link]');
    if (!links.length) return;
    const targets = [...links]
      .map((a) => {
        const id = a.getAttribute('href').slice(1);
        const el = document.getElementById(id);
        return el ? { id, el, link: a } : null;
      })
      .filter(Boolean);
    if (!targets.length) return;

    const setActive = (id) => {
      links.forEach((a) => {
        a.classList.toggle('is-current', a.getAttribute('href') === '#' + id);
      });
    };

    const onScroll = () => {
      const offset = window.innerHeight * 0.35;
      let current = null; // nothing active until the first section is reached
      for (const t of targets) {
        const rect = t.el.getBoundingClientRect();
        if (rect.top - offset <= 0) current = t.id;
      }
      setActive(current);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- 4b. Floating bottom nav visibility -------------------
  function initFloatNav() {
    const nav = document.querySelector('.floatnav');
    if (!nav) return;
    // Show only after scrolling past the hero
    const hero = document.querySelector('.about-hero-v2');
    const getThreshold = () => {
      if (!hero) return 400;
      const r = hero.getBoundingClientRect();
      return (window.scrollY + r.bottom) - 100; // hero bottom - 100px buffer
    };
    let threshold = getThreshold();
    const onScroll = () => {
      nav.classList.toggle('is-visible', window.scrollY > threshold);
    };
    window.addEventListener('resize', () => { threshold = getThreshold(); });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- 5. Init ----------------------------------------------
  function initStickyNav() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function init() {
    initReveal();
    initStickyNav();
    initActiveNav();
    initSideToc();
    initFloatNav();
    initPageTransitions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ===== Zoomable image modal (gallery + case screenshots) =====
(function () {
  // no zoomable images → no modal (avoids an empty overlay swallowing clicks)
  if (!document.querySelector('.zoomable')) return;
  var modal = document.createElement('div');
  modal.className = 'img-modal';
  modal.innerHTML = '<button class="img-modal__close" aria-label="Close">&times;</button><img alt="" />';
  document.body.appendChild(modal);
  var big = modal.querySelector('img');
  function close() {
    modal.classList.remove('is-open');
    document.body.classList.remove('img-modal-open');
    big.removeAttribute('src');
  }
  document.addEventListener('click', function (e) {
    var z = e.target.closest('.zoomable');
    if (z) {
      e.preventDefault();
      big.src = z.currentSrc || z.src;
      modal.classList.add('is-open');
      document.body.classList.add('img-modal-open');
      return;
    }
    if (modal.classList.contains('is-open')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
})();

// ===== Footer local clock (Berlin) =====
(function () {
  var el = document.querySelector('[data-berlin-clock]');
  if (!el) return;
  function tick() {
    try {
      el.textContent = new Date().toLocaleTimeString('en-US', {
        timeZone: 'Europe/Berlin', hour: 'numeric', minute: '2-digit'
      });
    } catch (e) { el.textContent = ''; }
  }
  tick();
  setInterval(tick, 30000);
})();
