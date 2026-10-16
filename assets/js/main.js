/* ==========================================================================
   Projectify Zone — site interactions
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- Theme toggle ---------- */
  var themeBtn = document.getElementById('theme-toggle');

  function syncThemeLabel() {
    if (!themeBtn) return;
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    themeBtn.setAttribute('aria-label', 'Switch to ' + next + ' theme');
  }

  if (themeBtn) {
    syncThemeLabel();
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('pz-theme', next); } catch (e) {}
      syncThemeLabel();
    });
  }

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.getElementById('menu-toggle');
  var navLinks = document.getElementById('nav-links');

  function setMenu(open) {
    if (!menuBtn || !navLinks) return;
    navLinks.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', function () {
      setMenu(!navLinks.classList.contains('open'));
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('click', function (e) {
      if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setMenu(false);
    });
  }

  /* ---------- Header state on scroll ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 10);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Active nav link ---------- */
  var sectionLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if ('IntersectionObserver' in window && sectionLinks.length) {
    var linkFor = {};
    sectionLinks.forEach(function (a) { linkFor[a.getAttribute('href').slice(1)] = a; });

    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = linkFor[entry.target.id];
        if (link && entry.isIntersecting) {
          sectionLinks.forEach(function (a) { a.classList.remove('active'); });
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(linkFor).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) navObserver.observe(el);
    });
  }

  /* ---------- Mobile sticky call-to-action ---------- */
  var mobileCta = document.getElementById('mobile-cta');
  if (mobileCta && 'IntersectionObserver' in window) {
    var inView = new Set();
    var watched = document.querySelectorAll('.hero, #contact, .site-footer');
    var ctaObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) inView.add(entry.target); else inView.delete(entry.target);
      });
      mobileCta.classList.toggle('show', inView.size === 0);
    });
    watched.forEach(function (el) { ctaObserver.observe(el); });
  }

  /* ---------- Project brief form ---------- */
  var form = document.getElementById('brief-form');
  if (form && window.fetch && window.FormData) {
    var statusEl = document.getElementById('form-status');
    var submitBtn = form.querySelector('[type="submit"]');
    var submitLabel = submitBtn.innerHTML;

    function setStatus(msg, kind) {
      statusEl.textContent = msg;
      statusEl.className = 'form-status' + (kind ? ' ' + kind : '');
    }

    // Clear the error state as soon as a field is corrected
    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true' && e.target.checkValidity()) {
        e.target.removeAttribute('aria-invalid');
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var invalid = Array.prototype.filter.call(form.elements, function (el) {
        var bad = el.willValidate && !el.checkValidity();
        if (bad) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
        return bad;
      });
      if (invalid.length) {
        setStatus('Please fill in the highlighted fields.', 'err');
        invalid[0].focus();
        return;
      }

      var data = {};
      new FormData(form).forEach(function (value, key) { data[key] = value; });
      if (data._honey) return; // bot

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      setStatus('');

      fetch(form.getAttribute('data-endpoint'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            if (!res.ok || body.success === false || body.success === 'false') throw new Error(body.message || res.status);
          });
        })
        .then(function () {
          form.reset();
          setStatus('Thanks! Your brief has been sent. I\'ll reply within one working day.', 'ok');
        })
        .catch(function () {
          setStatus('Sorry, that didn\'t go through. Please email shreyas@projectifyzone.com or message on WhatsApp.', 'err');
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitLabel;
        });
    });
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
