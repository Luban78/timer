/* =========================================================
   CUBE TRAINER – JEDNOTNÉ MODÁLY
   Nahrazuje nativní alert/confirm u uživatelských akcí.
   ========================================================= */

(function () {
  const queue = [];
  let activeRequest = null;

  function getElements() {
    return {
      overlay: document.getElementById("app-dialog-modal"),
      box: document.querySelector("#app-dialog-modal .app-dialog-box"),
      icon: document.getElementById("app-dialog-icon"),
      title: document.getElementById("app-dialog-title"),
      message: document.getElementById("app-dialog-message"),
      confirm: document.getElementById("app-dialog-confirm"),
      cancel: document.getElementById("app-dialog-cancel")
    };
  }

  function normalizeOptions(options) {
    if (typeof options === "string") {
      return { title: "Cube Trainer", message: options };
    }

    return options || {};
  }

  function closeDialog(result) {
    const elements = getElements();
    if (!elements.overlay || !activeRequest) return;

    elements.overlay.classList.remove("is-open");
    elements.overlay.hidden = true;

    const resolve = activeRequest.resolve;
    activeRequest = null;
    resolve(result);

    window.setTimeout(showNext, 0);
  }

  function showNext() {
    if (activeRequest || queue.length === 0) return;

    const elements = getElements();
    if (!elements.overlay) {
      const request = queue.shift();
      request.resolve(true);
      return;
    }

    activeRequest = queue.shift();
    const options = activeRequest.options;

    const hasCancel = Boolean(options.cancelText);
    const type = options.type || (hasCancel ? "warning" : "success");

    elements.box.dataset.type = type;
    elements.icon.textContent = options.icon || (hasCancel ? "?" : "✓");
    elements.title.textContent = options.title || "Cube Trainer";
    elements.message.textContent = options.message || "";
    elements.confirm.textContent = options.confirmText || "OK";
    elements.cancel.textContent = options.cancelText || "Zrušit";
    elements.cancel.hidden = !hasCancel;

    elements.overlay.hidden = false;
    requestAnimationFrame(function () {
      elements.overlay.classList.add("is-open");
      elements.confirm.focus();
    });
  }

  function enqueue(options) {
    return new Promise(function (resolve) {
      queue.push({ options: normalizeOptions(options), resolve });
      showNext();
    });
  }

  window.showAppDialog = function (options) {
    return enqueue(options);
  };

  window.confirmAppDialog = function (options) {
    const normalized = normalizeOptions(options);
    normalized.cancelText = normalized.cancelText || "Zrušit";
    normalized.confirmText = normalized.confirmText || "Potvrdit";
    normalized.type = normalized.type || "warning";
    return enqueue(normalized);
  };

  document.addEventListener("DOMContentLoaded", function () {
    const elements = getElements();
    if (!elements.overlay) return;

    elements.confirm.addEventListener("click", function () {
      closeDialog(true);
    });

    elements.cancel.addEventListener("click", function () {
      closeDialog(false);
    });

    elements.overlay.addEventListener("pointerdown", function (event) {
      if (event.target !== elements.overlay || !activeRequest) return;
      if (activeRequest.options.cancelText) closeDialog(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !activeRequest) return;
      closeDialog(activeRequest.options.cancelText ? false : true);
    });
  });
})();
