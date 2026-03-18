(function () {
  "use strict";

  var scriptUrl = document.currentScript?.src || "";
  var baseUrl = "";
  try {
    baseUrl = new URL(scriptUrl).origin;
  } catch (e) {
    baseUrl = window.location.origin;
  }

  var CSS = `
    :host { display: block; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .vh-root { position: relative; }
    .vh-root.vh-dark { --vh-bg: #1e1e2e; --vh-card: #252536; --vh-border: #2e2e3e; --vh-text: #e0e0e0; --vh-heading: #f0f0f0; --vh-muted: #9ca3af; --vh-dimmed: #6b7280; }
    .vh-root.vh-light { --vh-bg: transparent; --vh-card: #ffffff; --vh-border: #e5e7eb; --vh-text: #374151; --vh-heading: #111827; --vh-muted: #6b7280; --vh-dimmed: #9ca3af; }

    .vh-card { background: var(--vh-card); border: 1px solid var(--vh-border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .vh-stars { font-size: 16px; letter-spacing: 2px; }
    .vh-content { color: var(--vh-text); font-size: 14px; line-height: 1.65; flex: 1; }
    .vh-author { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
    .vh-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .vh-initials { width: 40px; height: 40px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; }
    .vh-name { font-weight: 600; color: var(--vh-heading); font-size: 13px; }
    .vh-title { color: var(--vh-muted); font-size: 12px; }
    .vh-date { color: var(--vh-dimmed); font-size: 11px; margin-top: 1px; }

    /* Grid */
    .vh-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 640px) { .vh-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .vh-grid { grid-template-columns: repeat(3, 1fr); } }

    /* Carousel */
    .vh-carousel-wrap { position: relative; }
    .vh-carousel { overflow-x: auto; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .vh-carousel::-webkit-scrollbar { display: none; }
    .vh-carousel-track { display: flex; gap: 16px; padding: 4px; }
    .vh-carousel-track .vh-card { min-width: 300px; max-width: 380px; flex-shrink: 0; }
    .vh-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--vh-border); background: var(--vh-card); color: var(--vh-text); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2; line-height: 1; }
    .vh-nav:hover { opacity: 0.8; }
    .vh-prev { left: -18px; }
    .vh-next { right: -18px; }
    .vh-dots { display: flex; justify-content: center; gap: 6px; margin-top: 14px; }
    .vh-dot { width: 8px; height: 8px; border-radius: 50%; border: none; cursor: pointer; padding: 0; transition: background 0.2s; }
    .vh-dot.active { transform: scale(1.25); }

    /* Badge */
    .vh-badge { text-align: center; margin-top: 16px; }
    .vh-badge a { color: var(--vh-dimmed); text-decoration: none; font-size: 11px; }
    .vh-badge a:hover { text-decoration: underline; }

    /* Skeleton */
    @keyframes vh-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
    .vh-skeleton { border-radius: 12px; height: 180px; background: linear-gradient(90deg, var(--vh-border) 25%, var(--vh-card) 50%, var(--vh-border) 75%); background-size: 800px 100%; animation: vh-shimmer 1.5s infinite; }
    .vh-skeleton-row { display: flex; gap: 16px; }
    .vh-skeleton-row .vh-skeleton { min-width: 300px; flex: 1; }
  `;

  function stars(rating, color) {
    var s = "";
    for (var i = 0; i < 5; i++) s += i < rating ? "\u2605" : "\u2606";
    return s;
  }

  function formatDate(d) {
    try {
      return new Date(d).toLocaleDateString("ja-JP");
    } catch (e) {
      return "";
    }
  }

  function buildCard(t, theme) {
    var brand = theme.brandColor || "#6366f1";
    var html = '<div class="vh-card">';

    if (theme.showRating !== false) {
      html += '<div class="vh-stars" style="color:' + brand + '">' + stars(t.rating, brand) + "</div>";
    }

    html += '<div class="vh-content">' + escapeHtml(t.content) + "</div>";
    html += '<div class="vh-author">';

    if (theme.showAvatar !== false) {
      if (t.avatar_url) {
        html += '<img class="vh-avatar" src="' + escapeAttr(t.avatar_url) + '" alt="' + escapeAttr(t.name) + '">';
      } else {
        var letter = (t.name || "?").charAt(0).toUpperCase();
        html += '<div class="vh-initials" style="background:' + brand + '">' + letter + "</div>";
      }
    }

    html += "<div>";
    html += '<div class="vh-name">' + escapeHtml(t.name) + "</div>";
    var subtitle = [t.title, t.company].filter(Boolean).join(" / ");
    if (subtitle) html += '<div class="vh-title">' + escapeHtml(subtitle) + "</div>";
    if (theme.showDate) html += '<div class="vh-date">' + formatDate(t.submitted_at) + "</div>";
    html += "</div></div></div>";

    return html;
  }

  function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s);
  }

  function renderWidget(container, data) {
    var widget = data.widget;
    var testimonials = data.testimonials;
    var showBadge = data.showBadge;
    var theme = widget.theme || {};
    var brand = theme.brandColor || "#6366f1";
    var mode = theme.mode === "dark" ? "vh-dark" : "vh-light";

    var shadow = container.shadowRoot || container.attachShadow({ mode: "open" });
    var style = document.createElement("style");
    style.textContent = CSS;

    var root = document.createElement("div");
    root.className = "vh-root " + mode;

    if (!testimonials || testimonials.length === 0) {
      root.innerHTML = '<div style="text-align:center;padding:32px;color:var(--vh-dimmed);">\u8868\u793A\u3067\u304D\u308B\u30C6\u30B9\u30C6\u30A3\u30E2\u30CB\u30A2\u30EB\u304C\u3042\u308A\u307E\u305B\u3093</div>';
      shadow.innerHTML = "";
      shadow.appendChild(style);
      shadow.appendChild(root);
      return;
    }

    var html = "";

    if (widget.type === "carousel") {
      html += '<div class="vh-carousel-wrap">';
      html += '<button class="vh-nav vh-prev" aria-label="\u524D\u3078">&#8249;</button>';
      html += '<div class="vh-carousel"><div class="vh-carousel-track">';
      for (var i = 0; i < testimonials.length; i++) {
        html += buildCard(testimonials[i], theme);
      }
      html += "</div></div>";
      html += '<button class="vh-nav vh-next" aria-label="\u6B21\u3078">&#8250;</button>';
      html += "</div>";

      // Dots
      if (testimonials.length > 1) {
        html += '<div class="vh-dots">';
        for (var d = 0; d < testimonials.length; d++) {
          html +=
            '<button class="vh-dot' +
            (d === 0 ? " active" : "") +
            '" data-idx="' +
            d +
            '" style="background:' +
            (d === 0 ? brand : "var(--vh-border)") +
            '" aria-label="' +
            (d + 1) +
            '"></button>';
        }
        html += "</div>";
      }
    } else {
      html += '<div class="vh-grid">';
      for (var g = 0; g < testimonials.length; g++) {
        html += buildCard(testimonials[g], theme);
      }
      html += "</div>";
    }

    if (showBadge) {
      html +=
        '<div class="vh-badge"><a href="' +
        escapeAttr(baseUrl) +
        '" target="_blank" rel="noopener noreferrer">Powered by VoiceHub</a></div>';
    }

    root.innerHTML = html;
    shadow.innerHTML = "";
    shadow.appendChild(style);
    shadow.appendChild(root);

    // Carousel interactivity
    if (widget.type === "carousel") {
      var carousel = shadow.querySelector(".vh-carousel");
      var prevBtn = shadow.querySelector(".vh-prev");
      var nextBtn = shadow.querySelector(".vh-next");
      var dots = shadow.querySelectorAll(".vh-dot");
      var scrollAmt = 320;

      function scrollTo(idx) {
        var cards = shadow.querySelectorAll(".vh-carousel-track .vh-card");
        if (cards[idx]) {
          carousel.scrollTo({ left: cards[idx].offsetLeft - 4, behavior: "smooth" });
        }
      }

      function updateDots() {
        var cards = shadow.querySelectorAll(".vh-carousel-track .vh-card");
        var scrollLeft = carousel.scrollLeft;
        var closest = 0;
        var minDist = Infinity;
        for (var c = 0; c < cards.length; c++) {
          var dist = Math.abs(cards[c].offsetLeft - scrollLeft - 4);
          if (dist < minDist) {
            minDist = dist;
            closest = c;
          }
        }
        for (var dd = 0; dd < dots.length; dd++) {
          dots[dd].classList.toggle("active", dd === closest);
          dots[dd].style.background = dd === closest ? brand : "var(--vh-border)";
        }
      }

      if (prevBtn) prevBtn.addEventListener("click", function () { carousel.scrollBy({ left: -scrollAmt, behavior: "smooth" }); });
      if (nextBtn) nextBtn.addEventListener("click", function () { carousel.scrollBy({ left: scrollAmt, behavior: "smooth" }); });

      for (var di = 0; di < dots.length; di++) {
        dots[di].addEventListener("click", function () { scrollTo(parseInt(this.getAttribute("data-idx"), 10)); });
      }

      carousel.addEventListener("scroll", debounce(updateDots, 100));

      // Autoplay
      if (theme.autoplay !== false && testimonials.length > 1) {
        var autoId = setInterval(function () {
          var maxS = carousel.scrollWidth - carousel.clientWidth;
          if (carousel.scrollLeft >= maxS - 10) {
            carousel.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            carousel.scrollBy({ left: scrollAmt, behavior: "smooth" });
          }
        }, 4000);

        carousel.addEventListener("mouseenter", function () { clearInterval(autoId); });
        carousel.addEventListener("mouseleave", function () {
          autoId = setInterval(function () {
            var maxS = carousel.scrollWidth - carousel.clientWidth;
            if (carousel.scrollLeft >= maxS - 10) {
              carousel.scrollTo({ left: 0, behavior: "smooth" });
            } else {
              carousel.scrollBy({ left: scrollAmt, behavior: "smooth" });
            }
          }, 4000);
        });
      }
    }
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  function showSkeleton(container, isDark) {
    var shadow = container.attachShadow({ mode: "open" });
    var style = document.createElement("style");
    style.textContent = CSS;
    var root = document.createElement("div");
    root.className = "vh-root " + (isDark ? "vh-dark" : "vh-light");
    root.innerHTML =
      '<div class="vh-skeleton-row">' +
      '<div class="vh-skeleton"></div>' +
      '<div class="vh-skeleton"></div>' +
      '<div class="vh-skeleton"></div>' +
      "</div>";
    shadow.appendChild(style);
    shadow.appendChild(root);
  }

  function initWidget(el) {
    var widgetId = el.getAttribute("data-testimonial-widget");
    if (!widgetId) return;

    var darkHint = el.getAttribute("data-theme") === "dark";
    showSkeleton(el, darkHint);

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            observer.unobserve(el);
            fetch(baseUrl + "/api/widgets/" + encodeURIComponent(widgetId))
              .then(function (r) {
                if (!r.ok) throw new Error("HTTP " + r.status);
                return r.json();
              })
              .then(function (data) {
                renderWidget(el, data);
              })
              .catch(function () {
                // Hide widget on error
                el.style.display = "none";
              });
          }
        });
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
  }

  function init() {
    var els = document.querySelectorAll("[data-testimonial-widget]");
    for (var i = 0; i < els.length; i++) {
      initWidget(els[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
