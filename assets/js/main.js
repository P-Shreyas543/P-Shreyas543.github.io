/* ==========================================================================
   Projectify Zone — site interactions
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) {
      // Stagger siblings inside the same grid
      var siblings = el.parentElement ? el.parentElement.querySelectorAll(':scope > .reveal') : [];
      var index = Array.prototype.indexOf.call(siblings, el);
      if (index > 0) el.style.transitionDelay = Math.min(index, 5) * 80 + 'ms';
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- Card spotlight follows pointer ---------- */
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Rotating hero word ---------- */
  var dynamic = document.getElementById('dynamic-text');
  if (dynamic && !reduceMotion) {
    var words = ['reality.', 'prototypes.', 'products.', 'robots.', 'circuits.'];
    var w = 0;
    setInterval(function () {
      if (document.hidden) return;
      dynamic.classList.add('swap');
      setTimeout(function () {
        w = (w + 1) % words.length;
        dynamic.textContent = words[w];
        dynamic.classList.remove('swap');
      }, 350);
    }, 2600);
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

  /* ---------- Neural network canvas ---------- */
  var canvas = document.getElementById('neuro');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var nodes = [];
  var width = 0;
  var height = 0;
  var pointer = { x: -9999, y: -9999 };
  var running = false;
  var visible = true;
  var rafId = null;
  var LINK_DIST = 140;
  var ready = false; // animation waits until the page has finished loading

  function cssRGB(name) {
    return getComputedStyle(root).getPropertyValue(name).trim() || '34, 211, 238';
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var target = Math.round(Math.min(90, (width * height) / 16000));
    nodes = [];
    for (var i = 0; i < target; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.8
      });
    }
  }

  var nodeRGB = cssRGB('--canvas-node');
  var lineRGB = cssRGB('--canvas-line');

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          var alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.35;
          ctx.strokeStyle = 'rgba(' + lineRGB + ',' + alpha.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = 'rgba(' + nodeRGB + ',0.85)';
    for (var k = 0; k < nodes.length; k++) {
      var n = nodes[k];
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function step() {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      // Gentle repulsion from the pointer
      var dx = n.x - pointer.x;
      var dy = n.y - pointer.y;
      var d2 = dx * dx + dy * dy;
      if (d2 < 120 * 120 && d2 > 0) {
        var f = (1 - Math.sqrt(d2) / 120) * 0.6;
        n.x += (dx / Math.sqrt(d2)) * f;
        n.y += (dy / Math.sqrt(d2)) * f;
      }
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    }
    draw();
    rafId = requestAnimationFrame(step);
  }

  function start() {
    if (running || reduceMotion || !ready) return;
    running = true;
    rafId = requestAnimationFrame(step);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  resize();
  draw();

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resize(); draw(); }, 150);
  });

  canvas.parentElement.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
  });
  canvas.parentElement.addEventListener('pointerleave', function () {
    pointer.x = pointer.y = -9999;
  });

  // Redraw with the new palette when the theme changes
  new MutationObserver(function () {
    nodeRGB = cssRGB('--canvas-node');
    lineRGB = cssRGB('--canvas-line');
    if (!running) draw();
  })
    .observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  // Only animate while the hero is on screen and the tab is visible
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !document.hidden) start(); else stop();
    }).observe(canvas);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else if (visible) start();
  });

  // Keep the main thread free for first paint; begin animating once idle
  function begin() {
    ready = true;
    if (visible && !document.hidden) start();
  }
  function onLoaded() {
    if ('requestIdleCallback' in window) requestIdleCallback(begin, { timeout: 2000 });
    else setTimeout(begin, 300);
  }
  if (document.readyState === 'complete') onLoaded();
  else window.addEventListener('load', onLoaded);
})();
