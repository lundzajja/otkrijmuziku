(function () {
  'use strict';

  var overlay  = document.getElementById('welcomeOverlay');
  var enterBtn = document.getElementById('welcomeEnterBtn');
  if (!overlay || !enterBtn) return;

  if (sessionStorage.getItem('otkrijzvuk_visited')) {
    overlay.classList.add('is-hidden');
    return;
  }

  function dismissOverlay() {
    sessionStorage.setItem('otkrijzvuk_visited', '1');
    overlay.classList.add('is-hiding');

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
