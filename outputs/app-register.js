(function registerLearnedCircleApp() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/service-worker.js").catch(function () {
      // The website must continue working even if app installation support is unavailable.
    });
  });
})();
