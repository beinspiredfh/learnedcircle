(function registerLearnedCircleApp() {
  let deferredInstallPrompt = null;

  function updateInstallControls(message) {
    document.querySelectorAll("[data-install-status]").forEach(function (status) {
      status.textContent = message;
    });
  }

  function setInstallButtonsEnabled(isEnabled) {
    document.querySelectorAll("[data-install-app]").forEach(function (button) {
      button.setAttribute("aria-disabled", String(!isEnabled));
    });
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    setInstallButtonsEnabled(true);
    updateInstallControls("Ready to install on this device.");
  });

  window.addEventListener("appinstalled", function () {
    deferredInstallPrompt = null;
    setInstallButtonsEnabled(false);
    updateInstallControls("LearnedCircle has been installed on this device.");
  });

  document.addEventListener("click", async function (event) {
    const installButton = event.target.closest("[data-install-app]");
    if (!installButton) return;

    if (!deferredInstallPrompt) {
      updateInstallControls("If no install prompt appears, use your browser menu and choose Add to Home Screen.");
      return;
    }

    deferredInstallPrompt.prompt();
    const result = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    setInstallButtonsEnabled(false);
    updateInstallControls(result.outcome === "accepted" ? "Installation started." : "You can install later from this button.");
  });

  setInstallButtonsEnabled(false);
  updateInstallControls("Open in Chrome, Edge or Safari to add LearnedCircle to your home screen.");

  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/service-worker.js").catch(function () {
      // The website must continue working even if app installation support is unavailable.
    });
  });
})();
