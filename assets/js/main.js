/* ============================================================
   Amber's Portfolio — shared interactions
   ============================================================ */

(function () {
  'use strict';

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
      let current = targets[0].id;
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

  // ---- 6. Contact dropdown (tap on mobile, click-outside to close) ----
  function initNavDropdown() {
    const dropdown = document.querySelector('.nav__dropdown');
    if (!dropdown) return;
    const trigger = dropdown.querySelector('.nav__dropdown-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const open = dropdown.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdown.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---- 5. Init ----------------------------------------------
  function init() {
    initReveal();
    initActiveNav();
    initSideToc();
    initFloatNav();
    initNavDropdown();
    initPageTransitions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
// ===== Zoomable UI screenshots =====
(function () {
  // 모달 한 번만 생성해서 재사용
  const modal = document.createElement('div');
  modal.className = 'img-modal';
  modal.innerHTML =
    '<button class="img-modal__close" aria-label="Close">&times;</button>' +
    '<img alt="" />';
  document.body.appendChild(modal);

  const modalImg = modal.querySelector('img');

  function open(src, alt) {
    modalImg.src = src;
    modalImg.alt = alt || '';
    modal.classList.add('is-open');
    document.body.classList.add('img-modal-open');
  }
  function close() {
    modal.classList.remove('is-open');
    document.body.classList.remove('img-modal-open');
    modalImg.src = '';
  }

  document.querySelectorAll('img.zoomable').forEach(img => {
    img.addEventListener('click', () => open(img.src, img.alt));
  });

  // 배경/이미지 클릭으로 닫기, X 버튼, ESC
  modal.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
})();
