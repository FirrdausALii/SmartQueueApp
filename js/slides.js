(function () {
  "use strict";

  var track = document.getElementById("slide-track");
  var toc = document.getElementById("slide-toc");
  var select = document.getElementById("slide-select");
  var counter = document.getElementById("slide-counter");
  var progressFill = document.getElementById("slide-progress-fill");
  var btnPrev = document.getElementById("slide-prev");
  var btnNext = document.getElementById("slide-next");
  var btnPresent = document.getElementById("slide-present");

  if (!track) return;

  var slides = Array.from(track.querySelectorAll(".slide"));
  var total = slides.length;
  var current = 0;
  var touchStartX = 0;
  var touchStartY = 0;

  var viewport = document.querySelector(".slide-viewport");
  var viewportH = 0;

  function measureViewport() {
    if (!viewport) return 0;
    viewportH = viewport.clientHeight;
    slides.forEach(function (slide) {
      slide.style.height = viewportH + "px";
    });
    return viewportH;
  }

  function buildToc() {
    if (!toc && !select) return;

    slides.forEach(function (slide, i) {
      var title = slide.getAttribute("data-title") || "Slide " + (i + 1);
      var section = slide.getAttribute("data-section") || "";

      if (toc) {
        if (section && (i === 0 || slides[i - 1].getAttribute("data-section") !== section)) {
          var heading = document.createElement("li");
          heading.className = "toc-section";
          heading.textContent = section;
          toc.appendChild(heading);
        }
        var li = document.createElement("li");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = (i + 1) + ". " + title;
        btn.setAttribute("data-index", i);
        btn.addEventListener("click", function () { goTo(i); });
        li.appendChild(btn);
        toc.appendChild(li);
      }

      if (select) {
        var opt = document.createElement("option");
        opt.value = i;
        opt.textContent = (i + 1) + ". " + title;
        select.appendChild(opt);
      }
    });
  }

  function updateUi() {
    measureViewport();
    track.style.transform = "translateY(-" + current * viewportH + "px)";

    if (counter) {
      counter.innerHTML = "Slide <strong>" + (current + 1) + "</strong> of <strong>" + total + "</strong>";
    }
    if (progressFill) {
      progressFill.style.width = ((current + 1) / total * 100) + "%";
    }
    if (btnPrev) btnPrev.disabled = current === 0;
    if (btnNext) btnNext.disabled = current === total - 1;
    if (select) select.value = current;

    if (toc) {
      toc.querySelectorAll("button").forEach(function (btn) {
        btn.classList.toggle("active", parseInt(btn.getAttribute("data-index"), 10) === current);
      });
      var activeBtn = toc.querySelector("button.active");
      if (activeBtn) activeBtn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    slides.forEach(function (slide, i) {
      slide.setAttribute("aria-hidden", i !== current ? "true" : "false");
    });

    if (location.hash !== "#slide-" + (current + 1)) {
      history.replaceState(null, "", "#slide-" + (current + 1));
    }
  }

  function goTo(index) {
    if (index < 0 || index >= total) return;
    current = index;
    if (slides[current]) slides[current].scrollTop = 0;
    updateUi();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function parseHash() {
    var match = location.hash.match(/^#slide-(\d+)$/);
    if (match) {
      var n = parseInt(match[1], 10) - 1;
      if (n >= 0 && n < total) current = n;
    }
  }

  function togglePresent() {
    document.body.classList.toggle("slides-present");
    var isPresent = document.body.classList.contains("slides-present");
    if (btnPresent) {
      btnPresent.setAttribute("aria-pressed", isPresent ? "true" : "false");
      btnPresent.title = isPresent ? "Exit present mode" : "Present mode";
    }
    if (isPresent && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(function () {});
    } else if (!isPresent && document.fullscreenElement) {
      document.exitFullscreen().catch(function () {});
    }
  }

  buildToc();
  parseHash();
  updateUi();

  if (btnPrev) btnPrev.addEventListener("click", prev);
  if (btnNext) btnNext.addEventListener("click", next);
  if (btnPresent) btnPresent.addEventListener("click", togglePresent);
  if (select) select.addEventListener("change", function () { goTo(parseInt(select.value, 10)); });

  document.addEventListener("keydown", function (e) {
    if (e.target.matches("input, textarea, select")) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      prev();
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(total - 1);
    } else if (e.key === "f" || e.key === "F") {
      togglePresent();
    }
  });

  var swipeViewport = document.querySelector(".slide-viewport");
  if (swipeViewport) {
    swipeViewport.addEventListener("touchstart", function (e) {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    swipeViewport.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].screenX - touchStartX;
      var dy = e.changedTouches[0].screenY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) next();
        else prev();
      }
    }, { passive: true });
  }

  window.addEventListener("resize", function () {
    measureViewport();
    track.style.transform = "translateY(-" + current * viewportH + "px)";
  });

  window.addEventListener("hashchange", parseHash);
  document.addEventListener("fullscreenchange", function () {
    if (!document.fullscreenElement) {
      document.body.classList.remove("slides-present");
      if (btnPresent) btnPresent.setAttribute("aria-pressed", "false");
    }
  });
})();
