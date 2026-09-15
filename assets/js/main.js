/* ============================================================
   Harshvardhan Sikarwar — portfolio interactions
   Ported from the DCLogic component in design/Portfolio.dc.html
   (React refs -> DOM queries, props -> CFG below).
   ============================================================ */
(function () {
  'use strict';

  var reduceMQ = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  /* The design exposed these as editor tweaks (gridSpacing, fogIntensity,
     influence, reduceMotion). Here they are the baked-in defaults. */
  var CFG = {
    spacing: 26,          // hero/contact dot-grid pitch, px
    fog: 1,               // fog plane intensity
    radius: 280,          // cursor influence radius, px
    get reduce() { return reduceMQ.matches; }
  };

  var TONE = '#dbe3dc';   // --paper, "Celadon mist"
  var TAU = Math.PI * 2;

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  function on(el, ev, fn, opt) { if (el) el.addEventListener(ev, fn, opt); }

  function loop(step) {
    var id;
    function run(t) { step(t); id = requestAnimationFrame(run); }
    id = requestAnimationFrame(run);
    return function () { cancelAnimationFrame(id); };
  }

  /* Size a canvas to its box (or a host element's box) at device pixel
     ratio, keeping the 2d context in CSS-pixel coordinates. */
  function fitter(cv, host, onFit) {
    var ctx = cv.getContext('2d');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var box = { w: 1, h: 1 };
    function fit() {
      var b = (host || cv).getBoundingClientRect();
      box.w = Math.max(1, b.width);
      box.h = Math.max(1, b.height);
      cv.width = Math.round(box.w * dpr);
      cv.height = Math.round(box.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (onFit) onFit();
    }
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(host || cv);
    else on(window, 'resize', fit);
    return { ctx: ctx, box: box };
  }

  /* ── fog plane + cursor-warped dot grid (hero, contact) ──── */

  function field(cv, sec, mul) {
    if (!cv || !sec) return;
    var f = fitter(cv, sec);
    var ctx = f.ctx, box = f.box;

    var m = { x: -999, y: -999, cx: -999, cy: -999, s: 0, ts: 0 };
    on(sec, 'pointermove', function (e) {
      var b = sec.getBoundingClientRect();
      m.x = e.clientX - b.left;
      m.y = e.clientY - b.top;
      m.ts = 1;
      if (m.cx < -500) { m.cx = m.x; m.cy = m.y; }
    });
    on(sec, 'pointerleave', function () { m.ts = 0; });
    on(sec, 'pointerenter', function () { m.ts = 1; });

    var blobs = [];
    for (var i = 0; i < 7; i++) {
      blobs.push({
        x: Math.random(), y: Math.random(),
        r: 0.26 + Math.random() * 0.4,
        vx: (Math.random() - 0.5) * 0.000045,
        vy: (Math.random() - 0.5) * 0.00003,
        a: 0.5 + Math.random() * 0.45,
        dark: i % 3 === 0
      });
    }

    loop(function (t) {
      var w = box.w, h = box.h;
      var reduce = CFG.reduce;
      m.s += (m.ts - m.s) * 0.055;
      m.cx += (m.x - m.cx) * 0.12;
      m.cy += (m.y - m.cy) * 0.12;

      var fog = CFG.fog * mul;
      var sp = Math.max(14, CFG.spacing);
      var R = CFG.radius;
      var time = reduce ? 0 : t;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = TONE;
      ctx.fillRect(0, 0, w, h);

      for (var k = 0; k < blobs.length; k++) {
        var b = blobs[k];
        var bx = (b.x + (reduce ? 0 : (b.vx * time) % 1.4)) % 1.4 - 0.2;
        var by = (b.y + (reduce ? 0 : (b.vy * time) % 1.4)) % 1.4 - 0.2;
        var px = bx * w, py = by * h, rr = b.r * Math.max(w, h) * 0.72;
        var g = ctx.createRadialGradient(px, py, 0, px, py, rr);
        if (b.dark) {
          g.addColorStop(0, 'rgba(64,82,79,' + (0.13 * fog) + ')');
          g.addColorStop(1, 'rgba(64,82,79,0)');
        } else {
          g.addColorStop(0, 'rgba(255,255,255,' + (0.95 * b.a * fog) + ')');
          g.addColorStop(0.55, 'rgba(255,255,255,' + (0.4 * b.a * fog) + ')');
          g.addColorStop(1, 'rgba(255,255,255,0)');
        }
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, rr, 0, TAU); ctx.fill();
      }

      if (m.s > 0.01) {
        var gg = ctx.createRadialGradient(m.cx, m.cy, 0, m.cx, m.cy, R * 1.5);
        gg.addColorStop(0, 'rgba(255,255,255,' + (0.9 * m.s) + ')');
        gg.addColorStop(0.45, 'rgba(255,255,255,' + (0.35 * m.s) + ')');
        gg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.arc(m.cx, m.cy, R * 1.5, 0, TAU); ctx.fill();
      }

      var cols = Math.ceil(w / sp) + 2, rows = Math.ceil(h / sp) + 2;
      for (var i2 = 0; i2 < cols; i2++) {
        for (var j = 0; j < rows; j++) {
          var gx = i2 * sp - sp / 2;
          var gy = j * sp - sp / 2 +
            (reduce ? 0 : Math.sin(time * 0.0006 + i2 * 0.28 + j * 0.16) * 1.6);
          var x = gx, y = gy, rad = 1.05, al = 0.16;
          if (m.s > 0.01) {
            var dx = gx - m.cx, dy = gy - m.cy, d = Math.hypot(dx, dy);
            if (d < R) {
              var fr = Math.pow(1 - d / R, 2.1) * m.s;
              x = gx - (dx / (d || 1)) * fr * sp * 1.15;
              y = gy - (dy / (d || 1)) * fr * sp * 1.15;
              rad = 1.05 + fr * 2.3;
              al = 0.16 + fr * 0.62;
            }
          }
          ctx.fillStyle = 'rgba(29,33,31,' + al + ')';
          ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
        }
      }
    });
  }

  /* ── wireframe torus (open source) ──────────────────────── */

  function knot() {
    var cv = $('#knotCanvas');
    if (!cv) return;
    var f = fitter(cv), ctx = f.ctx, box = f.box;

    var mm = { x: 0, y: 0, tx: 0, ty: 0 };
    on(window, 'pointermove', function (e) {
      mm.tx = (e.clientX / window.innerWidth - 0.5) * 1.1;
      mm.ty = (e.clientY / window.innerHeight - 0.5) * 1.1;
    });

    var N = 52, M = 16, R = 1, r = 0.4;
    function pt(u, v) {
      var cu = Math.cos(u), su = Math.sin(u), cv2 = Math.cos(v), sv = Math.sin(v);
      return [(R + r * cv2) * cu, (R + r * cv2) * su, r * sv];
    }

    loop(function (t) {
      var w = box.w, h = box.h, reduce = CFG.reduce;
      mm.x += (mm.tx - mm.x) * 0.05;
      mm.y += (mm.ty - mm.y) * 0.05;
      var a = (reduce ? 0.6 : t * 0.00016) + mm.x * 1.4;
      var b = (reduce ? 0.5 : t * 0.00011) + mm.y * 1.2 + 0.5;
      var ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      var S = Math.min(w, h) * 0.31, cxp = w / 2, cyp = h / 2;

      function proj(p) {
        var x = p[0] * ca - p[1] * sa, y = p[0] * sa + p[1] * ca, z = p[2];
        var y2 = y * cb - z * sb, z2 = y * sb + z * cb;
        var fz = 3.1 / (3.1 + z2);
        return [cxp + x * S * fz, cyp + y2 * S * fz, z2];
      }

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;

      function draw(pts) {
        for (var k = 0; k < pts.length - 1; k++) {
          var p = proj(pts[k]), q = proj(pts[k + 1]);
          var al = 0.06 + Math.max(0, (1 - (p[2] + 1) / 2)) * 0.34;
          ctx.strokeStyle = 'rgba(233,229,218,' + al.toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
        }
      }

      for (var j = 0; j < M; j++) {
        var v = (j / M) * TAU, ring = [];
        for (var i = 0; i <= N; i++) ring.push(pt((i / N) * TAU, v));
        draw(ring);
      }
      for (var i2 = 0; i2 < N; i2 += 2) {
        var u = (i2 / N) * TAU, ring2 = [];
        for (var j2 = 0; j2 <= M; j2++) ring2.push(pt(u, (j2 / M) * TAU));
        draw(ring2);
      }
    });
  }

  /* ── shaded icosahedron (about) ─────────────────────────── */

  function solid() {
    var cv = $('#solidCanvas');
    if (!cv) return;
    var f = fitter(cv), ctx = f.ctx, box = f.box;

    var t0 = (1 + Math.sqrt(5)) / 2;
    var V = [
      [-1, t0, 0], [1, t0, 0], [-1, -t0, 0], [1, -t0, 0],
      [0, -1, t0], [0, 1, t0], [0, -1, -t0], [0, 1, -t0],
      [t0, 0, -1], [t0, 0, 1], [-t0, 0, -1], [-t0, 0, 1]
    ].map(function (p) {
      var l = Math.hypot(p[0], p[1], p[2]);
      return [p[0] / l, p[1] / l, p[2] / l];
    });
    var F = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];

    var mm = { x: 0, y: 0, tx: 0.2, ty: -0.1 };
    on(window, 'pointermove', function (e) {
      var b = cv.getBoundingClientRect();
      mm.tx = ((e.clientX - (b.left + b.width / 2)) / Math.max(200, b.width)) * 1.6;
      mm.ty = ((e.clientY - (b.top + b.height / 2)) / Math.max(200, b.height)) * 1.2;
    });

    loop(function (time) {
      var w = box.w, h = box.h, reduce = CFG.reduce;
      mm.x += (mm.tx - mm.x) * 0.05;
      mm.y += (mm.ty - mm.y) * 0.05;
      var a = (reduce ? 0.7 : time * 0.00022) + mm.x;
      var b = 0.42 + (reduce ? 0 : Math.sin(time * 0.00016) * 0.22) + mm.y;
      var ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      var S = Math.min(w, h) * 0.34, cx = w / 2, cy = h / 2;

      var P = V.map(function (p) {
        var x = p[0] * ca - p[2] * sa, z0 = p[0] * sa + p[2] * ca;
        var y = p[1] * cb - z0 * sb, z = p[1] * sb + z0 * cb;
        var fz = 3.4 / (3.4 + z);
        return [cx + x * S * fz, cy + y * S * fz, z, [x, y, z]];
      });

      ctx.clearRect(0, 0, w, h);
      var L = [-0.42, -0.7, 0.58];

      F.map(function (fc) {
        var A = P[fc[0]], B = P[fc[1]], C = P[fc[2]];
        var u = [B[3][0] - A[3][0], B[3][1] - A[3][1], B[3][2] - A[3][2]];
        var v = [C[3][0] - A[3][0], C[3][1] - A[3][1], C[3][2] - A[3][2]];
        var n = [
          u[1] * v[2] - u[2] * v[1],
          u[2] * v[0] - u[0] * v[2],
          u[0] * v[1] - u[1] * v[0]
        ];
        var nl = Math.hypot(n[0], n[1], n[2]) || 1;
        var lam = Math.max(0, (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / nl);
        return { A: A, B: B, C: C, z: (A[2] + B[2] + C[2]) / 3, lam: lam, front: n[2] / nl < 0 };
      }).sort(function (p, q) {
        return q.z - p.z;
      }).forEach(function (fc) {
        ctx.beginPath();
        ctx.moveTo(fc.A[0], fc.A[1]);
        ctx.lineTo(fc.B[0], fc.B[1]);
        ctx.lineTo(fc.C[0], fc.C[1]);
        ctx.closePath();
        if (fc.front) {
          ctx.fillStyle = 'rgba(29,33,31,' + (0.07 + fc.lam * 0.5).toFixed(3) + ')';
          ctx.fill();
          ctx.strokeStyle = 'rgba(29,33,31,.38)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(29,33,31,.1)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    });
  }

  /* ── per-letter 3D tilt (hero name) ─────────────────────── */

  function letters() {
    var host = $('#name');
    if (!host) return;
    var els = $$('.ltr', host);
    var raf = 0, tx = 0, ty = 0;

    function apply() {
      raf = 0;
      els.forEach(function (el) {
        var b = el.getBoundingClientRect();
        var cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        var dx = Math.max(-1, Math.min(1, (tx - cx) / 520));
        var dy = Math.max(-1, Math.min(1, (ty - cy) / 360));
        var near = Math.max(0, 1 - Math.hypot(tx - cx, ty - cy) / 620);
        el.style.transform =
          'perspective(700px) rotateY(' + (dx * 22).toFixed(2) + 'deg) rotateX(' +
          (-dy * 16).toFixed(2) + 'deg) translateZ(' + (near * 34).toFixed(1) + 'px)';
      });
    }

    on(window, 'pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!raf && !CFG.reduce) raf = requestAnimationFrame(apply);
    });
    on(host, 'pointerleave', function () {
      els.forEach(function (el) { el.style.transform = 'none'; });
    });
  }

  /* ── custom cursor ──────────────────────────────────────── */

  function cursor() {
    var dot = $('#cursorDot'), ring = $('#cursorRing');
    if (!dot || !ring) return;
    if (window.matchMedia && !window.matchMedia('(pointer:fine)').matches) return;

    document.documentElement.style.cursor = 'none';
    var x = -100, y = -100, rx = -100, ry = -100, sc = 1, tsc = 1, shown = 0;

    on(window, 'pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      if (!shown) {
        shown = 1; rx = x; ry = y;
        dot.style.opacity = '1'; ring.style.opacity = '1';
      }
      var t = e.target && e.target.closest ? e.target.closest('[data-cursor]') : null;
      tsc = t ? (t.getAttribute('data-cursor') === 'cta' ? 2.1 : 1.6) : 1;
    });
    on(document, 'pointerleave', function () {
      dot.style.opacity = '0'; ring.style.opacity = '0'; shown = 0;
    });

    loop(function () {
      rx += (x - rx) * 0.16; ry += (y - ry) * 0.16; sc += (tsc - sc) * 0.12;
      dot.style.transform = 'translate3d(' + (x - 3) + 'px,' + (y - 3) + 'px,0)';
      ring.style.transform =
        'translate3d(' + (rx - 17) + 'px,' + (ry - 17) + 'px,0) scale(' + sc.toFixed(3) + ')';
    });
  }

  /* ── reveal on scroll + count-up ────────────────────────── */

  function count(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    var to = parseFloat(el.getAttribute('data-count')) || 0;
    if (CFG.reduce) { el.textContent = String(to); return; }
    var t0 = performance.now(), dur = 1100;
    function step() {
      var p = Math.min(1, (performance.now() - t0) / dur);
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function reveal() {
    var els = $$('[data-reveal]');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { $$('[data-count]', el).forEach(count); });
      return;
    }

    els.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition =
        'opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1)';
    });

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e, i) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.style.transitionDelay = (i * 90) + 'ms';
        el.style.opacity = '1';
        el.style.transform = 'none';
        io.unobserve(el);
        $$('[data-count]', el).forEach(count);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ── card tilt ──────────────────────────────────────────── */

  function tilt() {
    $$('[data-tilt]').forEach(function (card) {
      on(card, 'pointermove', function (e) {
        if (CFG.reduce) return;
        var b = card.getBoundingClientRect();
        var dx = (e.clientX - b.left) / b.width - 0.5;
        var dy = (e.clientY - b.top) / b.height - 0.5;
        card.style.transform =
          'perspective(1100px) rotateY(' + (dx * 5).toFixed(2) + 'deg) rotateX(' +
          (-dy * 4).toFixed(2) + 'deg) translateY(-4px)';
      });
      on(card, 'pointerleave', function () { card.style.transform = 'none'; });
    });
  }

  /* ── scroll progress + nav backdrop ─────────────────────── */

  function progress() {
    var bar = $('#progressBar'), nav = $('#nav'), pill = $('#navPill');
    if (!bar) return;

    function upd() {
      var d = document.documentElement;
      var max = (d.scrollHeight - window.innerHeight) || 1;
      var y = window.scrollY || d.scrollTop || 0;
      bar.style.width = Math.max(0, Math.min(1, y / max)) * 100 + '%';

      var p = Math.max(0, Math.min(1, y / 260));
      if (nav) {
        nav.style.background = 'rgba(250,249,247,' + (0.8 * p).toFixed(3) + ')';
        nav.style.borderColor = 'rgba(29,33,31,' + (0.11 * p).toFixed(3) + ')';
        nav.style.boxShadow = '0 8px 30px rgba(29,33,31,' + (0.07 * p).toFixed(3) + ')';
        var bf = p > 0.04 ? 'blur(' + (14 * p).toFixed(1) + 'px) saturate(1.18)' : 'none';
        nav.style.backdropFilter = bf;
        nav.style.webkitBackdropFilter = bf;
      }
      if (pill) {
        pill.style.background = 'rgba(246,243,234,' + p.toFixed(3) + ')';
        pill.style.borderColor = 'rgba(29,33,31,' + (0.11 * p).toFixed(3) + ')';
      }
    }

    on(window, 'scroll', upd, { passive: true });
    on(window, 'resize', upd);
    upd();
  }

  /* ── social balls: slow roll inside the hero arena ──────── */

  function balls() {
    var arena = $('#arena');
    if (!arena) return;
    var els = $$('[data-ball]', arena);
    if (!els.length) return;

    var W = arena.clientWidth || 300, H = arena.clientHeight || 190;
    function fit() { W = arena.clientWidth || W; H = arena.clientHeight || H; }
    if (window.ResizeObserver) new ResizeObserver(fit).observe(arena);
    else on(window, 'resize', fit);

    function rnd(a, b) { return a + Math.random() * (b - a); }

    var B = els.map(function (el, i) {
      var s = el.offsetWidth || 60;
      return {
        el: el, s: s,
        x: rnd(4, Math.max(6, W - s - 4)),
        y: rnd(4, Math.max(6, H - s - 4)),
        vx: rnd(0.12, 0.34) * (i % 2 ? 1 : -1),
        vy: rnd(0.08, 0.22) * (i % 2 ? -1 : 1),
        rot: rnd(0, 360)
      };
    });

    var m = { x: -999, y: -999, in: 0 };
    on(arena, 'pointermove', function (e) {
      var b = arena.getBoundingClientRect();
      m.x = e.clientX - b.left; m.y = e.clientY - b.top; m.in = 1;
    });
    on(arena, 'pointerleave', function () { m.in = 0; m.x = -999; m.y = -999; });

    loop(function () {
      var still = CFG.reduce;
      for (var i = 0; i < B.length; i++) {
        var b = B[i], rad = b.s / 2;
        if (!still) {
          if (Math.random() < 0.012) {
            b.vx += rnd(-0.06, 0.06);
            b.vy += rnd(-0.05, 0.05);
          }
          if (m.in) {
            var dx0 = (b.x + rad) - m.x, dy0 = (b.y + rad) - m.y;
            var d0 = Math.hypot(dx0, dy0);
            if (d0 < rad + 54 && d0 > 0.1) {
              var f0 = (1 - d0 / (rad + 54)) * 0.5;
              b.vx += (dx0 / d0) * f0;
              b.vy += (dy0 / d0) * f0;
            }
          }
          for (var j = i + 1; j < B.length; j++) {
            var o = B[j], orad = o.s / 2;
            var dx = (b.x + rad) - (o.x + orad);
            var dy = (b.y + rad) - (o.y + orad);
            var d = Math.hypot(dx, dy), min = rad + orad + 2;
            if (d < min && d > 0.1) {
              var push = (min - d) / 2, nx = dx / d, ny = dy / d;
              b.x += nx * push; b.y += ny * push;
              o.x -= nx * push; o.y -= ny * push;
              var k = 0.22;
              b.vx += nx * k; b.vy += ny * k;
              o.vx -= nx * k; o.vy -= ny * k;
            }
          }
          var sp = Math.hypot(b.vx, b.vy), cap = 1.5;
          if (sp > cap) { b.vx = b.vx / sp * cap; b.vy = b.vy / sp * cap; }
          b.vx *= 0.992; b.vy *= 0.992;
          if (sp < 0.06) { b.vx += rnd(-0.05, 0.05); b.vy += rnd(-0.04, 0.04); }
          b.x += b.vx; b.y += b.vy;
          if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx) * 0.86; }
          if (b.x > W - b.s) { b.x = W - b.s; b.vx = -Math.abs(b.vx) * 0.86; }
          if (b.y < 0) { b.y = 0; b.vy = Math.abs(b.vy) * 0.86; }
          if (b.y > H - b.s) { b.y = H - b.s; b.vy = -Math.abs(b.vy) * 0.86; }
          b.rot += (b.vx / (Math.PI * rad)) * 180;
        }
        b.el.style.transform =
          'translate3d(' + b.x.toFixed(2) + 'px,' + b.y.toFixed(2) + 'px,0) rotate(' +
          b.rot.toFixed(2) + 'deg)';
      }
    });
  }

  /* ── services accordion ─────────────────────────────────── */

  function accordion() {
    var btns = $$('.acc__btn');
    if (!btns.length) return;

    function setOpen(btn, open) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      var sign = btn.querySelector('.acc__sign');
      if (sign) sign.textContent = open ? '–' : '+';
      if (panel) panel.hidden = !open;
    }

    btns.forEach(function (btn) {
      on(btn, 'click', function () {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        btns.forEach(function (b) { setOpen(b, false); });
        setOpen(btn, !isOpen);
      });
    });
  }

  /* ── marquee: keep an even track count wider than the viewport ───
     The CSS scrolls the strip by -50%, i.e. exactly half its tracks. That
     half has to be at least viewport-wide or a gap shows at the seam, so on
     wide screens we clone tracks — always in pairs, to keep halves equal. */

  function marquees() {
    $$('.marquee').forEach(function (mq) {
      var tracks = $$('.marquee__track', mq);
      if (!tracks.length) return;
      var one = tracks[0].getBoundingClientRect().width;
      if (!one) return;
      var half = Math.max(1, Math.ceil(window.innerWidth / one));
      var want = half * 2;
      for (var i = tracks.length; i < want; i++) {
        mq.appendChild(tracks[0].cloneNode(true));
      }
    });
  }

  /* ── boot ───────────────────────────────────────────────── */

  function init() {
    field($('#heroCanvas'), $('#top'), 1);
    field($('#footCanvas'), $('#contact'), 0.8);
    knot();
    solid();
    letters();
    cursor();
    reveal();
    tilt();
    progress();
    balls();
    accordion();
    marquees();
    on(window, 'resize', marquees);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
