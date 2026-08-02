(function () {
  "use strict";

  var revealEls = document.querySelectorAll("[data-reveal]");
  var prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-revealed");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  revealEls.forEach(function (el) {
    observer.observe(el);
  });
})();

(function () {
  "use strict";

  // Hero demo task rows are real toggle buttons - clicking one checks it
  // off, purely client-side, purely decorative. No state is saved and
  // nothing loops; it is meant as a single "try it" gesture, not a demo
  // that runs itself.
  var tasks = document.querySelectorAll(".demo-task");

  tasks.forEach(function (task) {
    task.addEventListener("click", function () {
      var pressed = task.getAttribute("aria-pressed") === "true";
      task.setAttribute("aria-pressed", String(!pressed));
    });
  });
})();

(function () {
  "use strict";

  // The "מבולגן / עם Kivun" toggle above the pain list - a real, accessible
  // toggle button (same aria-pressed idiom as .demo-task above) that flips
  // the whole list's content via a single class on the section. One click,
  // no loop, no timer.
  var toggle = document.querySelector(".relate-toggle");
  var relateSection = document.querySelector(".relate");
  if (toggle && relateSection) {
    var marks = relateSection.querySelectorAll(".relate-x");
    toggle.addEventListener("click", function () {
      var pressed = toggle.getAttribute("aria-pressed") === "true";
      var next = !pressed;
      toggle.setAttribute("aria-pressed", String(next));
      relateSection.classList.toggle("is-after", next);
      marks.forEach(function (mark) {
        mark.textContent = next ? "✓" : "✕";
      });
    });
  }
})();

(function () {
  "use strict";

  // The hero demo card's "עודכן עכשיו" label is a real, one-time-computed
  // timestamp (the visitor's own local time), not decoration - it's meant
  // to read as "this is happening right now", not as a looping/ticking
  // clock (which would be exactly the kind of small perpetual effect this
  // page deliberately avoids). It only ever gets set once, on load.
  var stamp = document.querySelector(".demo-stamp");
  if (!stamp) return;
  try {
    var time = new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    stamp.textContent = "עודכן היום · " + time;
  } catch (e) {
    /* leave the static "עודכן עכשיו" fallback already in the HTML */
  }
})();

(function () {
  "use strict";

  // A subtle perspective tilt that follows the cursor on the three phone
  // screenshots - desktop/fine-pointer only, skipped under
  // prefers-reduced-motion. Resets flat on mouseleave; driven entirely by
  // pointer position, never a timer or loop.
  var prefersReducedMotionTilt =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasFinePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  if (!prefersReducedMotionTilt && hasFinePointer) {
    var shots = document.querySelectorAll(".how-shot img");
    shots.forEach(function (img) {
      img.addEventListener("mousemove", function (e) {
        var rect = img.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        img.style.setProperty("--tilt-y", (px * 14).toFixed(2) + "deg");
        img.style.setProperty("--tilt-x", (py * -14).toFixed(2) + "deg");
      });
      img.addEventListener("mouseleave", function () {
        img.style.setProperty("--tilt-x", "0deg");
        img.style.setProperty("--tilt-y", "0deg");
      });
    });
  }
})();

(function () {
  "use strict";

  // The line connecting the 3 stations fills in as the visitor scrolls
  // past it - tied to scroll position, not a timer, so it never runs on
  // its own and never loops. See the .step:not(:last-child)::after rules
  // in styles.css for how --route-progress and each station's --seg turn
  // into an actual drawn length.
  var row = document.querySelector(".steps-row");
  if (!row) return;
  var prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  var ticking = false;
  function update() {
    ticking = false;
    var rect = row.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var start = vh * 0.8;
    var end = vh * 0.3;
    var span = rect.height + (start - end);
    var progress = span > 0 ? ((start - rect.top) / span) * 2 : 0;
    progress = Math.max(0, Math.min(2, progress));
    row.style.setProperty("--route-progress", String(progress));
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();

(function () {
  "use strict";

  // The price and the "7 years" stat count up from 0 the first time they
  // scroll into view - once, never again (unobserve after firing). The
  // HTML's static text is already the correct target value (99.90, 7) so
  // no-JS and reduced-motion visitors see the right number immediately;
  // this only zeroes them out at runtime, right before animating back up,
  // so there's no flash of the real number before the count starts.
  var prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var counters = document.querySelectorAll("[data-count-to]");
  if (!counters.length || prefersReducedMotion || !("IntersectionObserver" in window)) return;

  function format(n, decimals) {
    return decimals ? n.toFixed(decimals) : String(Math.round(n));
  }

  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count-to"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var duration = 900;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = format(target * eased, decimals);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = format(target, decimals);
      }
    }
    window.requestAnimationFrame(step);
  }

  counters.forEach(function (el) {
    el.textContent = format(0, parseInt(el.getAttribute("data-decimals") || "0", 10));
  });

  var countObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach(function (el) {
    countObserver.observe(el);
  });
})();

(function () {
  "use strict";

  // Native <details> snaps open/closed with zero transition. This animates
  // the height via the Web Animations API on click - a real layout property,
  // not transform/opacity, but the exception is deliberate: it only runs on
  // an infrequent, direct user click (never automatically), for ~220ms, on
  // one small element - exactly the case the "animate transform/opacity
  // only" rule is not aimed at. Skipped entirely under reduced-motion,
  // where the native instant toggle already does the right thing.
  var prefersReducedMotionFaq =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotionFaq) return;
  if (!("animate" in document.createElement("div"))) return;

  document.querySelectorAll(".faq-item").forEach(function (item) {
    var summary = item.querySelector("summary");
    if (!summary) return;
    var anim = null;
    var closing = false;
    var expanding = false;

    summary.addEventListener("click", function (e) {
      e.preventDefault();
      item.style.overflow = "hidden";
      if (!item.open) {
        openItem();
      } else {
        shrinkItem();
      }
    });

    function shrinkItem() {
      closing = true;
      var startHeight = item.offsetHeight + "px";
      var endHeight = summary.offsetHeight + "px";
      if (anim) anim.cancel();
      anim = item.animate({ height: [startHeight, endHeight] }, { duration: 220, easing: "cubic-bezier(.16,1,.3,1)" });
      anim.onfinish = function () { onFinish(false); };
      anim.oncancel = function () { closing = false; };
    }

    function openItem() {
      item.style.height = item.offsetHeight + "px";
      item.open = true;
      window.requestAnimationFrame(expandItem);
    }

    function expandItem() {
      expanding = true;
      var startHeight = item.offsetHeight + "px";
      var endHeight = item.scrollHeight + "px";
      if (anim) anim.cancel();
      anim = item.animate({ height: [startHeight, endHeight] }, { duration: 220, easing: "cubic-bezier(.16,1,.3,1)" });
      anim.onfinish = function () { onFinish(true); };
      anim.oncancel = function () { expanding = false; };
    }

    function onFinish(isOpen) {
      item.open = isOpen;
      anim = null;
      closing = false;
      expanding = false;
      item.style.height = "";
      item.style.overflow = "";
    }
  });
})();
