(function () {
  'use strict';

  var canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  var ctx  = canvas.getContext('2d');
  var hero = canvas.parentElement;

  var SPACING      = 60;
  var INFLUENCE    = 250;
  var STRENGTH     = 0.6;
  var BASE_ALPHA   = 0.18;
  var HOVER_ALPHA  = 0.6;

  var mouse       = { x: -9999, y: -9999 };
  var targetMouse = { x: -9999, y: -9999 };

  hero.addEventListener('mousemove', function (e) {
    var rect = hero.getBoundingClientRect();
    targetMouse.x = e.clientX - rect.left;
    targetMouse.y = e.clientY - rect.top + hero.scrollTop;
  });

  hero.addEventListener('mouseleave', function () {
    targetMouse.x = -9999;
    targetMouse.y = -9999;
  });

  function resize() {
    canvas.width  = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  function lerp(a, b, t) { return a + (b - a) * t; }

  function deform(gx, gy) {
    if (mouse.x < 0) return { x: gx, y: gy, t: 0 };
    var dx   = gx - mouse.x;
    var dy   = gy - mouse.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > INFLUENCE) return { x: gx, y: gy, t: 0 };
    var factor = (1 - dist / INFLUENCE);
    factor = factor * factor;
    return {
      x: gx - dx * factor * STRENGTH,
      y: gy - dy * factor * STRENGTH,
      t: factor
    };
  }

  function draw() {
    requestAnimationFrame(draw);

    mouse.x = lerp(mouse.x, targetMouse.x, 0.08);
    mouse.y = lerp(mouse.y, targetMouse.y, 0.08);

    var w = canvas.width;
    var h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    var cols    = Math.ceil(w / SPACING) + 2;
    var rows    = Math.ceil(h / SPACING) + 2;
    var offsetX = (w % SPACING) / 2;
    var offsetY = (h % SPACING) / 2;

    for (var row = 0; row < rows; row++) {
      var gy = offsetY + row * SPACING;
      for (var col = 0; col < cols - 1; col++) {
        var p1 = deform(offsetX + col * SPACING,       gy);
        var p2 = deform(offsetX + (col + 1) * SPACING, gy);
        var t  = (p1.t + p2.t) / 2;
        var a  = BASE_ALPHA + (HOVER_ALPHA - BASE_ALPHA) * t;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = 'rgba(137,204,4,' + a.toFixed(3) + ')';
        ctx.lineWidth   = 0.5 + t * 0.8;
        ctx.stroke();
      }
    }

    for (var col = 0; col < cols; col++) {
      var gx = offsetX + col * SPACING;
      for (var row = 0; row < rows - 1; row++) {
        var p1 = deform(gx, offsetY + row * SPACING);
        var p2 = deform(gx, offsetY + (row + 1) * SPACING);
        var t  = (p1.t + p2.t) / 2;
        var a  = BASE_ALPHA + (HOVER_ALPHA - BASE_ALPHA) * t;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = 'rgba(137,204,4,' + a.toFixed(3) + ')';
        ctx.lineWidth   = 0.5 + t * 0.8;
        ctx.stroke();
      }
    }
  }

  draw();
})();
