/* =========================================================
   MG3i TRAINER – JEDNOTNÉ HLAVIČKY OBRAZOVEK
   Samostatný soubor, bez prodlužování app.js.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  const hiddenGlobalMenuButton =
    document.getElementById("screen-top-menu-btn");

  const navTimer =
    document.getElementById("nav-timer");

  /* Každé pravé tlačítko otevírá stejné globální menu. */
  document
    .querySelectorAll(".screen-local-menu")
    .forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        hiddenGlobalMenuButton?.click();
      });
    });

  /* Hlavní Statistiky a Nastavení se šipkou vracejí na Timer. */
  [
    "backFromStatsScreen",
    "backFromSettingsScreen"
  ].forEach(function (buttonId) {
    document
      .getElementById(buttonId)
      ?.addEventListener("click", function () {
        navTimer?.click();
      });
  });

  console.log("screenHeaders.js načten");
});
