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

    .vh-card { background: var(--vh-card); border: 1px solid var(--vh-border); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 6px; }
    .vh-stars { font-size: 14px; letter-spacing: 1px; }
    .vh-content { color: var(--vh-text); font-size: 13px; line-height: 1.6; flex: 1; }
    .vh-content.vh-clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .vh-content.vh-clamp.vh-expanded { -webkit-line-clamp: unset; display: block; }
    .vh-read-more { background: none; border: none; padding: 0; margin-top: 2px; font-size: 12px; cursor: pointer; }
    .vh-read-more:hover { text-decoration: underline; }
    .vh-author { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
    .vh-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .vh-initials { width: 32px; height: 32px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
    .vh-name { font-weight: 600; color: var(--vh-heading); font-size: 12px; }
    .vh-title { color: var(--vh-muted); font-size: 11px; }
    .vh-date { color: var(--vh-dimmed); font-size: 10px; margin-top: 1px; }

    /* Grid */
    .vh-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 640px) { .vh-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .vh-grid { grid-template-columns: repeat(3, 1fr); } }

    /* Carousel */
    .vh-carousel-wrap { position: relative; }
    .vh-carousel { overflow-x: auto; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .vh-carousel::-webkit-scrollbar { display: none; }
    .vh-carousel-track { display: flex; gap: 16px; padding: 4px; }
    .vh-carousel-track .vh-card { min-width: min(200px, 44vw); max-width: 280px; flex-shrink: 0; }
    .vh-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--vh-border); background: var(--vh-card); color: var(--vh-text); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2; line-height: 1; }
    .vh-nav:hover { opacity: 0.8; }
    .vh-prev { left: -18px; }
    .vh-next { right: -18px; }
    .vh-dots { display: flex; justify-content: center; gap: 6px; margin-top: 14px; }
    .vh-dot { width: 8px; height: 8px; border-radius: 50%; border: none; cursor: pointer; padding: 0; transition: background 0.2s; }
    .vh-dot.active { transform: scale(1.25); }

    /* List */
    .vh-list { display: flex; flex-direction: column; gap: 12px; }
    .vh-list .vh-card { border-radius: 8px; border-left: 4px solid var(--vh-brand); }

    /* Single */
    .vh-single { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 24px; }
    .vh-single .vh-stars { font-size: 24px; letter-spacing: 3px; }
    .vh-single .vh-content { font-size: 18px; line-height: 1.7; max-width: 600px; margin: 16px 0; }
    .vh-single .vh-avatar, .vh-single .vh-initials { width: 64px; height: 64px; font-size: 24px; }
    .vh-single .vh-author { flex-direction: column; text-align: center; gap: 8px; }
    .vh-single-fade { transition: opacity 0.5s ease; }

    /* Wall (masonry) */
    .vh-wall { column-count: 1; column-gap: 16px; }
    .vh-wall .vh-card { break-inside: avoid; margin-bottom: 16px; }
    @media (min-width: 768px) { .vh-wall { column-count: 2; } }
    @media (min-width: 1024px) { .vh-wall { column-count: 3; } }

    /* Marquee */
    .vh-marquee { overflow: hidden; position: relative; }
    .vh-marquee-track { display: flex; gap: 16px; width: max-content; animation: vh-marquee-scroll var(--vh-marquee-duration, 30s) linear infinite; }
    .vh-marquee:hover .vh-marquee-track { animation-play-state: paused; }
    .vh-marquee-track .vh-card { min-width: min(200px, 44vw); max-width: 280px; flex-shrink: 0; }
    @keyframes vh-marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

    /* Dual Marquee */
    .vh-dual-marquee { display: flex; flex-direction: column; gap: 16px; overflow: hidden; }
    .vh-dual-marquee-row { overflow: hidden; position: relative; }
    .vh-dual-marquee-track { display: flex; gap: 16px; width: max-content; }
    .vh-dual-marquee-track .vh-card { min-width: min(200px, 44vw); max-width: 280px; flex-shrink: 0; }
    .vh-dual-marquee-track--left { animation: vh-dual-marquee-left var(--vh-dual-marquee-duration, 30s) linear infinite; }
    .vh-dual-marquee-track--right { animation: vh-dual-marquee-right var(--vh-dual-marquee-duration, 30s) linear infinite; }
    .vh-dual-marquee:hover .vh-dual-marquee-track--left,
    .vh-dual-marquee:hover .vh-dual-marquee-track--right { animation-play-state: paused; }
    @keyframes vh-dual-marquee-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    @keyframes vh-dual-marquee-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
    @media (min-width: 640px) {
      .vh-carousel-track .vh-card,
      .vh-marquee-track .vh-card,
      .vh-dual-marquee-track .vh-card { min-width: 280px; }
    }

    /* Badge widget */
    .vh-badge-widget { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; color: var(--vh-text); }
    .vh-badge-widget .vh-badge-star { font-size: 16px; }
    .vh-badge-widget .vh-badge-info { color: var(--vh-muted); font-size: 13px; }

    /* Powered-by badge */
    .vh-powered { text-align: center; margin-top: 16px; }
    .vh-powered a { color: var(--vh-dimmed); text-decoration: none; font-size: 11px; }
    .vh-powered a:hover { text-decoration: underline; }

    /* Skeleton */
    @keyframes vh-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
    .vh-skeleton { border-radius: 12px; height: 180px; background: linear-gradient(90deg, var(--vh-border) 25%, var(--vh-card) 50%, var(--vh-border) 75%); background-size: 800px 100%; animation: vh-shimmer 1.5s infinite; }
    .vh-skeleton-row { display: flex; gap: 16px; }
    .vh-skeleton-row .vh-skeleton { min-width: 300px; flex: 1; }
  `;

  function sanitizeColor(c) {
    return /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : "#635BFF";
  }

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

  function buildCard(t, theme, clamp) {
    var brand = sanitizeColor(theme.brandColor || "#635BFF");
    var html = '<div class="vh-card">';

    if (theme.showRating !== false) {
      html += '<div class="vh-stars" style="color:' + brand + '">' + stars(t.rating, brand) + "</div>";
    }

    html += '<div class="vh-content' + (clamp ? ' vh-clamp' : '') + '">' + escapeHtml(t.content) + "</div>";
    if (clamp && t.content && t.content.length > 60) {
      html += '<button class="vh-read-more" style="color:' + brand + '">\u3082\u3063\u3068\u898B\u308B</button>';
    }
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

  function poweredBadge(showBadge) {
    if (!showBadge) return "";
    return '<div class="vh-powered"><a href="' + escapeAttr(baseUrl) + '" target="_blank" rel="noopener noreferrer">Powered by VoiceHub</a></div>';
  }

  function renderList(container, shadow, root, data) {
    var theme = data.widget.theme || {};
    var brand = sanitizeColor(theme.brandColor || "#635BFF");
    var html = '<div class="vh-list" style="--vh-brand:' + brand + '">';
    for (var i = 0; i < data.testimonials.length; i++) {
      html += buildCard(data.testimonials[i], theme);
    }
    html += "</div>" + poweredBadge(data.showBadge);
    root.innerHTML = html;
  }

  function renderSingle(container, shadow, root, data) {
    var theme = data.widget.theme || {};
    var brand = sanitizeColor(theme.brandColor || "#635BFF");
    var testimonials = data.testimonials;
    var t = testimonials[0];

    function singleHtml(t) {
      var html = '<div class="vh-single vh-single-fade">';
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
      html += "</div></div></div>";
      return html;
    }

    root.innerHTML = singleHtml(t) + poweredBadge(data.showBadge);

    // Autoplay fade between testimonials
    if (theme.autoplay && testimonials.length > 1) {
      var current = 0;
      var autoId = setInterval(function () {
        if (!container.isConnected) { clearInterval(autoId); return; }
        var el = shadow.querySelector(".vh-single-fade");
        if (!el) return;
        el.style.opacity = "0";
        setTimeout(function () {
          current = (current + 1) % testimonials.length;
          var wrap = shadow.querySelector(".vh-single-fade");
          if (wrap) {
            wrap.outerHTML = singleHtml(testimonials[current]);
            var newEl = shadow.querySelector(".vh-single-fade");
            if (newEl) { newEl.style.opacity = "0"; setTimeout(function () { newEl.style.opacity = "1"; }, 30); }
          }
        }, 500);
      }, 5000);

      if (typeof MutationObserver !== "undefined" && container.parentNode) {
        var obs = new MutationObserver(function () {
          if (!container.isConnected) { clearInterval(autoId); obs.disconnect(); }
        });
        obs.observe(container.parentNode, { childList: true });
      }
    }
  }

  function renderWall(container, shadow, root, data) {
    var theme = data.widget.theme || {};
    var html = '<div class="vh-wall">';
    for (var i = 0; i < data.testimonials.length; i++) {
      html += buildCard(data.testimonials[i], theme);
    }
    html += "</div>" + poweredBadge(data.showBadge);
    root.innerHTML = html;
  }

  function renderBadgeWidget(container, shadow, root, data) {
    var theme = data.widget.theme || {};
    var brand = sanitizeColor(theme.brandColor || "#635BFF");
    var testimonials = data.testimonials;
    var total = testimonials.length;
    var sum = 0;
    for (var i = 0; i < total; i++) sum += (testimonials[i].rating || 0);
    var avg = total > 0 ? (sum / total).toFixed(1) : "0.0";

    var html = '<div class="vh-badge-widget">';
    html += '<span class="vh-badge-star" style="color:' + brand + '">\u2605</span>';
    html += '<span>' + avg + ' / 5.0</span>';
    html += '<span class="vh-badge-info">(' + total + '\u4EF6\u306E\u304A\u5BA2\u69D8\u306E\u58F0)</span>';
    html += "</div>";
    if (data.showBadge) {
      html += '<div class="vh-powered" style="margin-top:4px;"><a href="' + escapeAttr(baseUrl) + '" target="_blank" rel="noopener noreferrer" style="font-size:10px;">Powered by VoiceHub</a></div>';
    }
    root.innerHTML = html;
  }

  function renderCarousel(container, shadow, root, data) {
    var theme = data.widget.theme || {};
    var brand = sanitizeColor(theme.brandColor || "#635BFF");
    var testimonials = data.testimonials;

    var html = '<div class="vh-carousel-wrap">';
    html += '<button class="vh-nav vh-prev" aria-label="\u524D\u3078">&#8249;</button>';
    html += '<div class="vh-carousel"><div class="vh-carousel-track">';
    for (var i = 0; i < testimonials.length; i++) {
      html += buildCard(testimonials[i], theme);
    }
    html += "</div></div>";
    html += '<button class="vh-nav vh-next" aria-label="\u6B21\u3078">&#8250;</button>';
    html += "</div>";

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

    html += poweredBadge(data.showBadge);
    root.innerHTML = html;

    // Carousel interactivity
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
      var autoplayFn = function () {
        if (!container.isConnected) { clearInterval(autoId); return; }
        var maxS = carousel.scrollWidth - carousel.clientWidth;
        if (carousel.scrollLeft >= maxS - 10) {
          carousel.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          carousel.scrollBy({ left: scrollAmt, behavior: "smooth" });
        }
      };

      var autoId = setInterval(autoplayFn, 4000);

      carousel.addEventListener("mouseenter", function () { clearInterval(autoId); });
      carousel.addEventListener("mouseleave", function () {
        autoId = setInterval(autoplayFn, 4000);
      });

      if (typeof MutationObserver !== "undefined" && container.parentNode) {
        var cleanupObserver = new MutationObserver(function () {
          if (!container.isConnected) {
            clearInterval(autoId);
            cleanupObserver.disconnect();
          }
        });
        cleanupObserver.observe(container.parentNode, { childList: true });
      }
    }
  }

  function renderMarquee(container, shadow, root, data) {
    var theme = data.widget.theme || {};
    var testimonials = data.testimonials;
    var duration = Math.max(testimonials.length * 6, 20) + "s";
    var html = '<div class="vh-marquee"><div class="vh-marquee-track" style="--vh-marquee-duration:' + duration + '">';
    for (var i = 0; i < testimonials.length; i++) {
      html += buildCard(testimonials[i], theme, true);
    }
    // Duplicate for seamless loop
    for (var j = 0; j < testimonials.length; j++) {
      html += buildCard(testimonials[j], theme, true);
    }
    html += "</div></div>" + poweredBadge(data.showBadge);
    root.innerHTML = html;
  }

  function renderDualMarquee(container, shadow, root, data) {
    var theme = data.widget.theme || {};
    var testimonials = data.testimonials;
    var mid = Math.ceil(testimonials.length / 2);
    var rowA = testimonials.slice(0, mid);
    var rowB = testimonials.length > 1 ? testimonials.slice(mid) : testimonials;
    var duration = Math.max(testimonials.length * 6, 20) + "s";

    var html = '<div class="vh-dual-marquee" style="--vh-dual-marquee-duration:' + duration + '">';
    html += '<div class="vh-dual-marquee-row"><div class="vh-dual-marquee-track vh-dual-marquee-track--left">';
    for (var i = 0; i < rowA.length; i++) html += buildCard(rowA[i], theme, true);
    for (var i2 = 0; i2 < rowA.length; i2++) html += buildCard(rowA[i2], theme, true);
    html += '</div></div>';
    html += '<div class="vh-dual-marquee-row"><div class="vh-dual-marquee-track vh-dual-marquee-track--right">';
    for (var j = 0; j < rowB.length; j++) html += buildCard(rowB[j], theme, true);
    for (var j2 = 0; j2 < rowB.length; j2++) html += buildCard(rowB[j2], theme, true);
    html += '</div></div>';
    html += '</div>' + poweredBadge(data.showBadge);
    root.innerHTML = html;
  }

  function renderGrid(container, shadow, root, data) {
    var theme = data.widget.theme || {};
    var html = '<div class="vh-grid">';
    for (var g = 0; g < data.testimonials.length; g++) {
      html += buildCard(data.testimonials[g], theme, true);
    }
    html += "</div>" + poweredBadge(data.showBadge);
    root.innerHTML = html;
  }

  function renderWidget(container, data) {
    var widget = data.widget;
    var testimonials = data.testimonials;
    var theme = widget.theme || {};
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

    shadow.innerHTML = "";
    shadow.appendChild(style);
    shadow.appendChild(root);

    switch (widget.type) {
      case "carousel": renderCarousel(container, shadow, root, data); break;
      case "marquee": renderMarquee(container, shadow, root, data); break;
      case "list": renderList(container, shadow, root, data); break;
      case "single": renderSingle(container, shadow, root, data); break;
      case "wall": renderWall(container, shadow, root, data); break;
      case "dual-marquee": renderDualMarquee(container, shadow, root, data); break;
      case "badge": renderBadgeWidget(container, shadow, root, data); break;
      case "grid":
      default: renderGrid(container, shadow, root, data); break;
    }

    // Read more toggle
    root.addEventListener("click", function(e) {
      var btn = e.target;
      if (!btn || !btn.classList.contains("vh-read-more")) return;
      var content = btn.previousElementSibling;
      if (!content || !content.classList.contains("vh-clamp")) return;
      var isExpanded = content.classList.toggle("vh-expanded");
      btn.textContent = isExpanded ? "\u9589\u3058\u308B" : "\u3082\u3063\u3068\u898B\u308B";
    });
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
            observer.disconnect();
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
