/* ==========================================================================
   Prototype cost estimator.
   The model is plain data plus one pure function (PZEstimator.estimate), so it
   can be tested without a browser. Everything runs on the visitor's device;
   nothing is sent anywhere unless they choose WhatsApp or email.

   How the numbers work: each answer adds engineer-days to a base for the
   stage. Days x the day rate gives the engineering fee range; the simplest
   build lands exactly on the published "from" prices. Parts and fabrication
   are a separate range, billed at cost. Change the numbers here, nowhere else.
   ========================================================================== */
(function (root) {
  'use strict';

  var DAY_RATE = 5000;          // ₹ per engineer-day (internal; matches the published phase prices)
  var SPREAD = 1.3;             // high end of the fee range = low end x 1.3
  var MIN_FEE = { poc: 50000, prototype: 150000 };
  var BASE_DAYS = { poc: 10, prototype: 30 };
  var BASE_PARTS = { poc: [3000, 8000], prototype: [8000, 20000] };  // dev boards, two PCB batches, prints

  // Each option: [poc days, prototype days], parts [low, high] (₹), a short label for drivers and the message.
  var OPTIONS = {
    start: {
      scratch:  { label: 'Just the idea', factor: 1 },
      devboard: { label: 'A rough dev-board or breadboard version', factor: 0.85 },
      hardware: { label: 'Existing hardware that needs firmware or fixes', factor: 0.75 }
    },
    core: {
      monitor:  { label: 'Measure and report', days: [0, 0], score: 0 },
      control:  { label: 'Measure and act', days: [4, 10], score: 1, driver: 'Control logic and user interface' },
      advanced: { label: 'Demanding: motor control, signal processing or real-time', days: [10, 24], score: 2, driver: 'Demanding core function (real-time, signal processing or motor control)' }
    },
    sensing: {
      few:        { label: '1–2 standard sensors', days: [0, 0], parts: [0, 0], score: 0 },
      several:    { label: '3–6 sensors or inputs', days: [2, 5], parts: [1500, 4000], score: 1, driver: 'Several sensors to integrate and calibrate' },
      specialist: { label: 'Specialist sensing (camera, radar, precision analog)', days: [6, 14], parts: [5000, 20000], score: 2, driver: 'Specialist sensing (camera, radar or precision analog)' }
    },
    links: {
      short: { label: 'Wi-Fi or Bluetooth', days: [2, 4], parts: [0, 1000], score: 1, driver: 'Wi-Fi or Bluetooth connectivity' },
      long:  { label: 'Cellular or LoRa', days: [3, 7], parts: [1500, 4000], score: 1, driver: 'Cellular or LoRa connectivity' },
      wired: { label: 'CAN, Ethernet or RS-485', days: [3, 6], parts: [1000, 3000], score: 1, driver: 'Wired interfaces (CAN, Ethernet or RS-485)' }
    },
    power: {
      mains:    { label: 'Mains or USB', days: [0, 0], parts: [0, 0], score: 0 },
      battery:  { label: 'Rechargeable battery', days: [1, 4], parts: [800, 2500], score: 0, driver: 'Battery charging and power management' },
      lowpower: { label: 'Months on a battery', days: [3, 9], parts: [1500, 4000], score: 1, driver: 'Low-power design for months of battery life' }
    },
    motion: {
      none:   { label: 'No moving parts', days: [0, 0], parts: [0, 0], score: 0 },
      simple: { label: 'Simple outputs (relays, LEDs, display)', days: [1, 2], parts: [500, 1500], score: 0, driver: 'Outputs and display' },
      motors: { label: 'Motors or mechanisms', days: [4, 10], parts: [3000, 10000], score: 1, driver: 'Motors and mechanisms' }
    },
    software: {
      none:      { label: 'Device only', days: [0, 0], score: 0 },
      dashboard: { label: 'Cloud dashboard or simple app', days: [3, 8], score: 1, driver: 'Cloud dashboard or app' }
    },
    enclosure: {
      bench:   { label: 'No enclosure yet', days: [0, 0], parts: [0, 0], score: 0 },
      printed: { label: '3D-printed demo enclosure', days: [1, 3], parts: [1500, 4000], score: 0, driver: 'Demo enclosure design and prints' },
      rugged:  { label: 'Rugged, sealed or wearable enclosure', days: [3, 8], parts: [4000, 12000], score: 1, driver: 'Rugged, sealed or wearable enclosure' }
    }
  };
  var GOALS = {
    feasibility: 'Feasibility sprint',
    poc: 'Proof of concept',
    prototype: 'Investor-ready prototype'
  };

  function round(n, step) { return Math.round(n / step) * step; }

  // answers: { goal, start, core, sensing, links: [..], power, motion, software, enclosure }
  function estimate(a) {
    var links = a.links || [];
    var picks = ['core', 'sensing', 'power', 'motion', 'software', 'enclosure'].map(function (k) { return OPTIONS[k][a[k]]; })
      .concat(links.map(function (l) { return OPTIONS.links[l]; }));
    var score = picks.reduce(function (s, o) { return s + (o.score || 0); }, 0);

    if (a.goal === 'feasibility') {
      var high = Math.min(35000, 20000 + 2500 * score);
      return {
        goal: a.goal,
        fee: [score <= 2 ? 15000 : 20000, high],
        parts: null,
        weeks: score > 4 ? [2, 3] : [1, 2],
        days: null,
        score: score,
        drivers: drivers(picks, 0),
        next: 'feasibility'
      };
    }

    var i = a.goal === 'poc' ? 0 : 1;
    var stage = a.goal;
    var days = BASE_DAYS[stage] + picks.reduce(function (d, o) { return d + (o.days ? o.days[i] : 0); }, 0);
    days = days * OPTIONS.start[a.start].factor;

    var low = Math.max(MIN_FEE[stage], round(days * DAY_RATE, 5000));
    var feeHigh = Math.max(low + 10000, round(days * DAY_RATE * SPREAD, 5000));

    var parts = picks.reduce(function (p, o) {
      return o.parts ? [p[0] + o.parts[0], p[1] + o.parts[1]] : p;
    }, BASE_PARTS[stage].slice());
    parts = [round(parts[0], 500), round(parts[1], 1000)];

    var weeks = stage === 'poc'
      ? [Math.max(3, Math.ceil(days / 4)), Math.ceil(days / 3) + 1]
      : [Math.max(6, Math.ceil(days / 5) + 1), Math.ceil(days / 4) + 2];   // includes PCB fabrication and shipping

    // From scratch, anything beyond a simple proof of concept starts with the sprint: it turns this range into a fixed quote.
    var next = a.start === 'scratch' && (stage === 'prototype' || score >= 3) ? 'feasibility' : stage;

    return { goal: stage, fee: [low, feeHigh], parts: parts, weeks: weeks, days: Math.round(days), score: score, drivers: drivers(picks, i), next: next };
  }

  // The three answers that add the most effort, in plain words
  function drivers(picks, i) {
    return picks.filter(function (o) { return o.driver; })
      .sort(function (x, y) { return (y.days ? y.days[i] : 0) - (x.days ? x.days[i] : 0); })
      .slice(0, 3)
      .map(function (o) { return o.driver; });
  }

  root.PZEstimator = { estimate: estimate, OPTIONS: OPTIONS, GOALS: GOALS, MIN_FEE: MIN_FEE };

  // ---------------------------------------------------------------- Page
  if (typeof document === 'undefined') return;
  var form = document.getElementById('estimator');
  if (!form) return;

  var inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  var out = {
    fee: document.getElementById('est-fee'),
    feeNote: document.getElementById('est-fee-note'),
    parts: document.getElementById('est-parts'),
    partsRow: document.getElementById('est-parts-row'),
    weeks: document.getElementById('est-weeks'),
    next: document.getElementById('est-next'),
    drivers: document.getElementById('est-drivers'),
    driversRow: document.getElementById('est-drivers-row'),
    founding: document.getElementById('est-founding'),
    whatsapp: document.getElementById('est-whatsapp'),
    email: document.getElementById('est-email'),
    status: document.getElementById('est-status')
  };
  var offer = document.querySelector('[data-founding]');
  var foundingOpen = offer && offer.getAttribute('data-founding') === 'open';
  var WA_NUMBER = '919986652218';

  function answers() {
    var data = new FormData(form);
    return {
      goal: data.get('goal'), start: data.get('start'), core: data.get('core'), sensing: data.get('sensing'),
      links: ['short', 'long', 'wired'].filter(function (k) { return data.get('links-' + k); }),
      power: data.get('power'), motion: data.get('motion'),
      software: data.get('software'), enclosure: data.get('enclosure')
    };
  }
  function range(r, unit) { return unit === 'weeks' ? r[0] + '–' + r[1] + ' weeks' : inr.format(r[0]) + ' – ' + inr.format(r[1]); }

  function message(a, r) {
    var O = OPTIONS;
    var lines = [
      'Hi Shreyas, I used the prototype estimator on projectifyzone.com.',
      '',
      'Goal: ' + GOALS[a.goal],
      'Starting point: ' + O.start[a.start].label,
      'Core function: ' + O.core[a.core].label,
      'Sensing: ' + O.sensing[a.sensing].label,
      'Connectivity: ' + (a.links.length ? a.links.map(function (l) { return O.links[l].label; }).join(', ') : 'None'),
      'Power: ' + O.power[a.power].label,
      'Moving parts: ' + O.motion[a.motion].label,
      'Software: ' + O.software[a.software].label,
      'Enclosure: ' + O.enclosure[a.enclosure].label,
      '',
      'Indicative estimate: ' + range(r.fee) + ' engineering' + (r.parts ? ', ' + range(r.parts) + ' parts at cost' : '') + ', ' + range(r.weeks, 'weeks') + '.',
      '',
      'My idea in one line: '
    ];
    return lines.join('\n');
  }

  function render() {
    var a = answers();
    var r = estimate(a);
    out.fee.textContent = range(r.fee);
    out.feeNote.textContent = r.goal === 'feasibility' ? 'Fixed price for the sprint, agreed before it starts.' : 'Engineering fee, indicative.';
    out.partsRow.hidden = !r.parts;
    if (r.parts) out.parts.textContent = range(r.parts);
    out.weeks.textContent = range(r.weeks, 'weeks');

    if (r.goal === 'feasibility') {
      out.next.textContent = 'A feasibility sprint: architecture, components, risks, and a fixed quote for the build.';
    } else if (r.next === 'feasibility') {
      out.next.textContent = 'Start with a feasibility sprint (from ' + inr.format(15000) + '). It checks the hard parts and turns this range into a fixed quote.';
    } else {
      out.next.textContent = 'You can go straight to the ' + GOALS[r.goal].toLowerCase() + '. A short scoping call fixes the price.';
    }

    out.driversRow.hidden = !r.drivers.length;
    out.drivers.textContent = '';
    r.drivers.forEach(function (d) { var li = document.createElement('li'); li.textContent = d; out.drivers.appendChild(li); });

    if (out.founding) {
      out.founding.hidden = !foundingOpen;
      if (foundingOpen) out.founding.textContent = 'With a founding-client slot: ' + inr.format(round(r.fee[0] * 0.8, 500)) + ' – ' + inr.format(round(r.fee[1] * 0.8, 500)) + ' (20% off engineering).';
    }

    var text = message(a, r);
    out.whatsapp.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
    out.email.href = 'mailto:shreyas@projectifyzone.com?subject=' + encodeURIComponent('Prototype estimate: ' + GOALS[a.goal]) + '&body=' + encodeURIComponent(text);
    return r;
  }

  // Announce the new figure to screen readers after the visitor stops changing answers
  var timer = 0;
  form.addEventListener('change', function () {
    var r = render();
    clearTimeout(timer);
    timer = setTimeout(function () {
      out.status.textContent = 'Estimate updated: ' + range(r.fee) + ', ' + range(r.weeks, 'weeks') + '.';
    }, 600);
  });
  // "See my estimate" (shown on narrow screens, where the result sits below the questions) jumps to the result
  var result = document.getElementById('est-result');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    render();
    if (result) { result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); result.focus({ preventScroll: true }); }
  });

  form.classList.add('is-ready');
  render();
})(typeof window !== 'undefined' ? window : globalThis);
