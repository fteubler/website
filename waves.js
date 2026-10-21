/* waves.js — animated layered waves behind the page content.
   Requires d3 v7 loaded before this file. */
(function () {
  'use strict';

  var canvas = document.getElementById('wave-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* One entry per wave layer.
     y     = vertical position as a fraction of the viewport height
     amp   = amplitude in px
     len   = wavelength in px
     speed = phase drift in radians per ms (negative flows the other way) */
  var layers = [
    { rgb: [47, 74, 143],  alpha: 0.14, amp: 34, len: 1100, speed:  0.00022, phase: 0.0, y: 0.62 },
    { rgb: [107, 58, 122], alpha: 0.12, amp: 44, len:  820, speed: -0.00016, phase: 1.9, y: 0.78 },
    { rgb: [143, 42, 74],  alpha: 0.10, amp: 28, len:  620, speed:  0.00031, phase: 3.4, y: 0.90 }
  ];

  var width = 0, height = 0, step = 5;

  function rgba(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    step = width > 1600 ? 8 : 5;
  }

  /* Two summed sines give a less mechanical crest than a single sine. */
  function waveY(layer, x, t) {
    var a = Math.sin((x / layer.len) * Math.PI * 2 + t * layer.speed + layer.phase);
    var b = Math.sin((x / (layer.len * 0.47)) * Math.PI * 2 - t * layer.speed * 1.7 + layer.phase * 2);
    return height * layer.y + layer.amp * a + layer.amp * 0.4 * b;
  }

  function draw(t) {
    ctx.clearRect(0, 0, width, height);

    layers.forEach(function (layer) {
      var top = height * layer.y - layer.amp * 1.5;

      /* filled body of the wave, down to the bottom edge */
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (var x = 0; x <= width + step; x += step) {
        ctx.lineTo(x, waveY(layer, x, t));
      }
      ctx.lineTo(width, height);
      ctx.closePath();

      var g = ctx.createLinearGradient(0, top, 0, height);
      g.addColorStop(0, rgba(layer.rgb, layer.alpha));
      g.addColorStop(1, rgba(layer.rgb, layer.alpha * 0.1));
      ctx.fillStyle = g;
      ctx.fill();

      /* crisp crest line on top of the fill */
      ctx.beginPath();
      for (var x2 = 0; x2 <= width + step; x2 += step) {
        var y = waveY(layer, x2, t);
        if (x2 === 0) ctx.moveTo(x2, y); else ctx.lineTo(x2, y);
      }
      ctx.strokeStyle = rgba(layer.rgb, Math.min(layer.alpha * 2.6, 0.5));
      ctx.lineWidth = 1.25;
      ctx.stroke();
    });
  }

  var timer = null;

  function start() {
    stop();
    timer = d3.timer(function (elapsed) { draw(elapsed); });
  }

  function stop() {
    if (timer) { timer.stop(); timer = null; }
  }

  function applyMotionPreference() {
    if (reduced.matches) { stop(); draw(0); }
    else start();
  }

  window.addEventListener('resize', function () {
    resize();
    if (!timer) draw(0);
  });

  if (reduced.addEventListener) reduced.addEventListener('change', applyMotionPreference);
  else if (reduced.addListener) reduced.addListener(applyMotionPreference);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else applyMotionPreference();
  });

  resize();
  applyMotionPreference();
})();