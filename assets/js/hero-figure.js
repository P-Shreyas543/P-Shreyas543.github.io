/* ==========================================================================
   Hero figure: takes the prototype apart and puts it back together.
   Geometry, depth keys and spring constants come from tools/hero-figure/build.mjs
   (data-* attributes), so this replays exactly what the build audited.
   ========================================================================== */
(function () {
  'use strict';

  var svg = document.getElementById('pz-figure');
  var fig = document.getElementById('pz-fig');
  var stage = document.getElementById('pz-stage');
  if (!svg || !fig || !stage) return;

  var readout = fig.querySelector('[data-readout]');
  var status = document.getElementById('pz-status');
  var buttons = fig.querySelectorAll('[data-select]');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');

  var ORDER = svg.getAttribute('data-order').split(' ');
  var spring = svg.getAttribute('data-spring').split(' ').map(Number);
  var STAGGER = spring[0], STIFF = spring[1], DAMP = spring[2], SUB = spring[3];

  var NAMES = {
    enclosure: 'Enclosure · cover, tray and screws',
    pcb: 'Custom PCB · 86 × 50 mm, 2 layers',
    firmware: 'Firmware · microcontroller module',
    connectivity: 'Connectivity · 2.4 GHz antenna'
  };
  var SPOKEN = {
    enclosure: 'Enclosure highlighted: the 3D-printed cover, tray and screws.',
    pcb: 'Custom PCB highlighted: the circuit board and its components.',
    firmware: 'Firmware highlighted: the microcontroller module that runs it.',
    connectivity: 'Connectivity highlighted: the module\'s wireless antenna.'
  };

  // ---------- Items ----------
  var layer = svg.querySelector('.it').parentNode;
  var items = Array.prototype.map.call(svg.querySelectorAll('.it'), function (el) {
    var ride = el.getAttribute('data-ride');
    return {
      el: el,
      ride: ride,
      piece: el.getAttribute('data-piece'),
      k: parseFloat(el.getAttribute('data-k')),
      l: ride ? parseFloat(el.getAttribute('data-l')) : 0,
      mx: ride ? parseFloat(el.getAttribute('data-mx')) : 0,
      my: ride ? parseFloat(el.getAttribute('data-my')) : 0,
      hold: el.querySelector('.pz-hold')
    };
  });
  var moveOf = {};
  items.forEach(function (it) { if (it.ride && !moveOf[it.ride]) moveOf[it.ride] = [it.mx, it.my]; });

  // ---------- Springs (one per assembly, staggered like the build's audit) ----------
  var springs = {};
  ORDER.forEach(function (id) { springs[id] = { x: 1, v: 0, target: 1, pending: null }; });
  var apart = true, clock = 0;

  function setApart(value) {
    apart = value;
    var goal = value ? 1 : 0, index = 0;
    var list = value ? ORDER : ORDER.slice().reverse();
    list.forEach(function (id) {
      var s = springs[id];
      if (s.target === goal) s.pending = null;
      else s.pending = { value: goal, at: clock + (still.matches ? 0 : index++ * STAGGER) };
    });
    announce();
    run();
  }

  function step(dt, calm) {
    var moving = false;
    ORDER.forEach(function (id) {
      var s = springs[id];
      if (s.pending && clock >= s.pending.at) { s.target = s.pending.value; s.pending = null; }
      if (s.pending) moving = true;
      if (calm) { s.x = s.target; s.v = 0; return; }
      var h = dt / SUB;
      for (var i = 0; i < SUB; i++) {
        s.v += (STIFF * (s.target - s.x) - DAMP * s.v) * h;
        s.x += s.v * h;
      }
      if (Math.abs(s.target - s.x) < 1e-3 && Math.abs(s.v) < 1e-3) { s.x = s.target; s.v = 0; }
      if (s.x !== s.target) moving = true;
    });
    return moving;
  }

  // ---------- Drawing ----------
  var drawnOrder = items.slice();
  function place() {
    items.forEach(function (it) {
      if (!it.ride) return;
      var s = springs[it.ride].x;
      if (s === 0) it.el.removeAttribute('transform');
      else it.el.setAttribute('transform', 'translate(' + (it.mx * s).toFixed(2) + ' ' + (it.my * s).toFixed(2) + ')');
      if (it.hold) {
        // The shank's clip belongs to the cover: offset it by (cover − screws) so it stays on the cover's top face.
        var c = moveOf.cover, sc = springs.cover.x;
        var dx = c[0] * sc - it.mx * s, dy = c[1] * sc - it.my * s;
        it.hold.setAttribute('transform', 'translate(' + dx.toFixed(2) + ' ' + dy.toFixed(2) + ')');
      }
    });
    var next = items.slice().sort(function (a, b) {
      return (a.k + a.l * (a.ride ? springs[a.ride].x : 0)) - (b.k + b.l * (b.ride ? springs[b.ride].x : 0));
    });
    var changed = next.some(function (it, i) { return it !== drawnOrder[i]; });
    if (changed) {
      var frag = document.createDocumentFragment();
      next.forEach(function (it) { frag.appendChild(it.el); });
      layer.appendChild(frag);
      drawnOrder = next;
    }
    var pending = ORDER.some(function (id) { return springs[id].pending || springs[id].x !== springs[id].target; });
    var text;
    if (focus) text = NAMES[focus];
    else if (pending) text = apart ? 'taking apart' : 'closing up';
    else text = apart ? 'apart · 3 assemblies lifted' : 'assembled · demo-ready';
    if (readout.textContent !== text) readout.textContent = text;
  }

  // ---------- Highlight ----------
  var focus = null;
  function select(piece) {
    focus = piece;
    if (piece) fig.setAttribute('data-focus', piece); else fig.removeAttribute('data-focus');
    items.forEach(function (it) {
      if (piece && it.piece === piece) it.el.setAttribute('data-on', ''); else it.el.removeAttribute('data-on');
    });
    Array.prototype.forEach.call(buttons, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-select') === piece)); });
    place();
  }

  function announce() {
    if (!status) return;
    status.textContent = focus ? SPOKEN[focus]
      : apart ? 'Prototype taken apart: screws, cover and circuit board lifted.'
      : 'Prototype assembled.';
  }

  // ---------- Loop ----------
  var frame = 0, last = 0, visible = false;
  function tick(now) {
    var dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    clock += dt;
    if (touring) tour(dt);
    var moving = step(dt, still.matches);
    place();
    frame = visible && (moving || touring) ? requestAnimationFrame(tick) : 0;
  }
  function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }

  // ---------- Idle tour: apart, each part in turn, back together ----------
  var TOUR = [
    [3.4, function () { select(null); setApart(true); }],
    [1.5, function () { select('enclosure'); }],
    [1.5, function () { select('pcb'); }],
    [1.5, function () { select('firmware'); }],
    [1.5, function () { select('connectivity'); }],
    [3.0, function () { select(null); setApart(false); }]
  ];
  var touring = false, tourAt = 0, tourStep = -1, idleTimer = 0;
  function tour(dt) {
    tourAt -= dt;
    if (tourAt > 0) return;
    tourStep = (tourStep + 1) % TOUR.length;
    tourAt = TOUR[tourStep][0];
    TOUR[tourStep][1]();
  }
  function startTour(delay) {
    clearTimeout(idleTimer);
    if (still.matches) return;
    // Start from the first step (take it apart), whatever state the visitor left it in.
    idleTimer = setTimeout(function () { touring = true; tourStep = -1; tourAt = 0; run(); }, delay);
  }
  function takeOver() { touring = false; clearTimeout(idleTimer); }

  // ---------- Input ----------
  stage.addEventListener('pointerenter', function (e) {
    if (e.pointerType !== 'mouse') return;
    takeOver(); select(null); setApart(true);
  });
  stage.addEventListener('pointerleave', function (e) {
    if (e.pointerType !== 'mouse') return;
    setApart(false); startTour(3600);
  });
  stage.addEventListener('click', function (e) {
    if (e.pointerType === 'mouse') return; // hover already did it
    takeOver(); select(null); setApart(!apart); startTour(6000);
  });
  stage.addEventListener('keydown', function (e) {
    var pieces = Object.keys(NAMES), i = pieces.indexOf(focus);
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); takeOver(); select(null); setApart(!apart); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); takeOver(); setApart(true); select(pieces[(i + 1) % pieces.length]); announce(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); takeOver(); setApart(true); select(pieces[(i - 1 + pieces.length) % pieces.length]); announce(); }
    else if (e.key === 'Escape') { takeOver(); select(null); announce(); }
    else return;
    startTour(6000);
  });
  Array.prototype.forEach.call(buttons, function (b) {
    b.addEventListener('click', function () {
      var piece = b.getAttribute('data-select');
      takeOver();
      setApart(true);
      select(focus === piece ? null : piece);
      announce();
      startTour(6000);
    });
  });

  new IntersectionObserver(function (entries) {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible) run();
  }, { rootMargin: '120px 0px' }).observe(stage);

  place();
  startTour(1400);
})();
