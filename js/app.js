// ============================================================
// Study Task Manager - shared behaviour
// 1. Home page image switcher
// 2. Live date and time in the footer
// ============================================================

(function () {
  "use strict";

  // Pages inside /pages/ need "../" to reach shared assets.
  var assetPrefix = window.location.pathname.indexOf("/pages/") !== -1 ? "../" : "";

  /* ---------------- Footer clock ---------------- */

  var dateTimeElement = document.getElementById("currentDateTime");

  if (dateTimeElement) {
    var updateDateTime = function () {
      var now = new Date();
      var options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      };
      // Option names copied from the MDN page for Date.toLocaleString.
      dateTimeElement.textContent = now.toLocaleString("en-AU", options);
    };

    updateDateTime();
    // Refresh every second so the clock keeps counting.
    window.setInterval(updateDateTime, 1000);
  }

  /* ---------------- Home page image switcher ---------------- */

  var heroImage = document.getElementById("heroImage");
  var previousButton = document.getElementById("prevImage");
  var nextButton = document.getElementById("nextImage");
  var dotsContainer = document.getElementById("sliderDots");

  if (!heroImage || !previousButton || !nextButton || !dotsContainer) {
    return;
  }

  var images = [
    { file: "study-1.jpg", alt: "A student planning the week in a paper planner" },
    { file: "study-2.jpg", alt: "A laptop with a list of assignments on the screen" },
    { file: "study-3.jpg", alt: "Notes and highlighted reading on a study desk" }
  ];

  var currentIndex = 0;

  // Build one dot per image so the user can jump directly.
  images.forEach(function (image, index) {
    var dot = document.createElement("button");
    dot.type = "button";
    dot.className = "slider-dot";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", "Show image " + (index + 1));
    dot.addEventListener("click", function () {
      showImage(index);
    });
    dotsContainer.appendChild(dot);
  });

  var dots = dotsContainer.querySelectorAll(".slider-dot");

  function showImage(index) {
    // Wrap around in both directions.
    currentIndex = (index + images.length) % images.length;

    heroImage.src = assetPrefix + "images/" + images[currentIndex].file;
    heroImage.alt = images[currentIndex].alt;

    dots.forEach(function (dot, dotIndex) {
      dot.setAttribute("aria-selected", dotIndex === currentIndex ? "true" : "false");
    });
  }

  previousButton.addEventListener("click", function () {
    showImage(currentIndex - 1);
  });

  nextButton.addEventListener("click", function () {
    showImage(currentIndex + 1);
  });

  // Arrow keys are convenient when the slider has focus.
  document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      showImage(currentIndex - 1);
    } else if (event.key === "ArrowRight") {
      showImage(currentIndex + 1);
    }
  });

  showImage(0);
})();
