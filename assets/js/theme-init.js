/* Runs in <head>, before first paint: apply the saved or system theme so the page never flashes the wrong colours. */
(function () {
  try {
    var saved = localStorage.getItem('pz-theme');
    var theme = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
