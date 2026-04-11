(function () {
  'use strict';

  var overlay  = document.getElementById('welcomeOverlay');
  var enterBtn = document.getElementById('welcomeEnterBtn');
  if (!overlay || !enterBtn) return;

  // Ako je korisnik već posetio sajt — sakrij overlay bez zvuka
  if (sessionStorage.getItem('otkrijzvuk_visited')) {
    overlay.classList.add('is-hidden');
    return;
  }

  var PLAY_DURATION = 60; // sekundi — koliko dugo pesma svira

  function startAudio() {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    var ctx = new AudioCtx();

    // Učitaj m4a fajl
    fetch('./a-g-cook-residue.m4a')
      .then(function (res) { return res.arrayBuffer(); })
      .then(function (arrayBuffer) { return ctx.decodeAudioData(arrayBuffer); })
      .then(function (audioBuffer) {
        var source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        var gainNode = ctx.createGain();
        var now      = ctx.currentTime;

        // Počinje blago (0.35), postepeno se stišava tokom cele pesme do tišine
        gainNode.gain.setValueAtTime(0.18, now);
        gainNode.gain.linearRampToValueAtTime(0, now + PLAY_DURATION);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start(0);
        source.stop(now + PLAY_DURATION);

        source.onended = function () {
          try { ctx.close(); } catch (e) { /* ignore */ }
        };
      })
      .catch(function (err) {
        console.warn('Audio nije mogao da se učita:', err);
      });
  }

  function dismissOverlay() {
    sessionStorage.setItem('otkrijzvuk_visited', '1');
    overlay.classList.add('is-hiding');
    startAudio();

    overlay.addEventListener('transitionend', function () {
      overlay.classList.add('is-hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }, { once: true });
  }

  enterBtn.addEventListener('click', dismissOverlay);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.classList.contains('is-hidden')) {
      dismissOverlay();
    }
  });
})();
