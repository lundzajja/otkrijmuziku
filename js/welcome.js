(function () {
  'use strict';

  var overlay  = document.getElementById('welcomeOverlay');
  var enterBtn = document.getElementById('welcomeEnterBtn');
  if (!overlay || !enterBtn) return;

  if (sessionStorage.getItem('otkrijzvuk_visited')) {
    overlay.classList.add('is-hidden');
    return;
  }

  var PLAY_DURATION = 60;

  function startAudio() {
    var audio = new Audio('./a-g-cook-residue.m4a');
    audio.volume = 0.18;
    audio.play().catch(function (err) {
      console.warn('Audio nije mogao da se pusti:', err);
    });

    var startTime = Date.now();
    var ticker = setInterval(function () {
      var elapsed  = (Date.now() - startTime) / 1000;
      var progress = elapsed / PLAY_DURATION;
      if (progress >= 1) {
        audio.volume = 0;
        audio.pause();
        clearInterval(ticker);
        return;
      }
      audio.volume = 0.18 * (1 - progress);
    }, 200);
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
