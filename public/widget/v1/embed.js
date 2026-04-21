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

    .vh-root { position: relative; width: 100%; box-sizing: border-box; --vh-card-w: 280px; }
    .vh-root.vh-dark { --vh-bg: #1e1e2e; --vh-card: #252536; --vh-border: #2e2e3e; --vh-text: #e0e0e0; --vh-heading: #f0f0f0; --vh-muted: #9ca3af; --vh-dimmed: #6b7280; --vh-shadow: none; }
    .vh-root.vh-light { --vh-bg: transparent; --vh-card: #ffffff; --vh-border: #e5e7eb; --vh-text: #374151; --vh-heading: #111827; --vh-muted: #6b7280; --vh-dimmed: #9ca3af; --vh-shadow: none; }

    .vh-card { background: var(--vh-card); border: 1px solid var(--vh-border); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 8px; box-shadow: var(--vh-shadow); min-height: 180px; }
    .vh-wall .vh-card { min-height: auto; }
    .vh-stars { font-size: 14px; letter-spacing: 1px; }
    .vh-content { color: var(--vh-text); font-size: 13px; line-height: 1.6; }
    .vh-content-wrap { flex: 1; position: relative; }
    .vh-content.vh-clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .vh-read-more { background: none; border: none; padding: 0; margin-top: 2px; font-size: 12px; cursor: pointer; }
    .vh-read-more:hover { text-decoration: underline; }
    .vh-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 999999; animation: vh-fade-in 0.15s ease; }
    .vh-light .vh-modal { background: #fff; }
    .vh-dark .vh-modal { background: #1f2937; }
    .vh-modal { border-radius: 12px; padding: 24px; max-width: 480px; width: calc(100% - 32px); max-height: 80vh; overflow-y: auto; position: relative; box-shadow: 0 8px 32px rgba(0,0,0,0.18); }
    .vh-modal-close { position: absolute; top: 8px; right: 12px; background: none; border: none; font-size: 22px; cursor: pointer; color: var(--vh-muted); line-height: 1; padding: 4px; }
    .vh-modal-close:hover { opacity: 0.7; }
    .vh-modal .vh-content { -webkit-line-clamp: unset; display: block; overflow: visible; }
    @keyframes vh-fade-in { from { opacity: 0; } to { opacity: 1; } }
    .vh-quote { position: absolute; top: -4px; left: -2px; font-size: 32px; line-height: 1; opacity: 0.15; font-family: Georgia, serif; user-select: none; pointer-events: none; }
    .vh-author { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
    .vh-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .vh-initials { width: 36px; height: 36px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; flex-shrink: 0; }
    .vh-name { font-weight: 400; color: var(--vh-dimmed); font-size: 11px; }
    .vh-title { color: var(--vh-muted); font-size: 11px; }
    .vh-date { color: var(--vh-dimmed); font-size: 11px; margin-top: 1px; }

    /* Grid */
    .vh-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(var(--vh-card-w), 1fr)); gap: 16px; }

    /* Carousel */
    .vh-carousel-wrap { position: relative; }
    .vh-carousel { overflow-x: auto; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .vh-carousel::-webkit-scrollbar { display: none; }
    .vh-carousel-track { display: flex; gap: 16px; padding: 4px; }
    .vh-carousel-track .vh-card { width: var(--vh-card-w); flex-shrink: 0; }
    .vh-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--vh-border); background: var(--vh-card); color: var(--vh-text); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2; line-height: 1; }
    .vh-nav:hover { opacity: 0.8; }
    .vh-prev { left: -18px; }
    .vh-next { right: -18px; }
    .vh-dots { display: flex; justify-content: center; gap: 6px; margin-top: 14px; }
    .vh-dot { width: 8px; height: 8px; border-radius: 50%; border: none; cursor: pointer; padding: 0; transition: background 0.2s; }
    .vh-dot.active { transform: scale(1.25); }

    /* List */
    .vh-list { display: flex; flex-direction: column; gap: 12px; align-items: center; }
    .vh-list .vh-card { width: var(--vh-card-w); }

    /* Single */
    .vh-single { display: flex; justify-content: center; }
    .vh-single .vh-card { width: var(--vh-card-w); }
    .vh-single-fade { transition: opacity 0.5s ease; }

    /* Wall (masonry) */
    .vh-wall { column-width: var(--vh-card-w); column-gap: 16px; }
    .vh-wall .vh-card { break-inside: avoid; margin-bottom: 16px; }

    /* Marquee */
    .vh-marquee { overflow: hidden; position: relative; }
    .vh-marquee-track { display: flex; gap: 16px; width: max-content; animation: vh-marquee-scroll var(--vh-marquee-duration, 30s) linear infinite; }
    .vh-marquee:hover .vh-marquee-track { animation-play-state: paused; }
    .vh-marquee-track .vh-card { width: var(--vh-card-w); flex-shrink: 0; }
    @keyframes vh-marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

    /* Dual Marquee */
    .vh-dual-marquee { display: flex; flex-direction: column; gap: 16px; overflow: hidden; }
    .vh-dual-marquee-row { overflow: hidden; position: relative; }
    .vh-dual-marquee-track { display: flex; gap: 16px; width: max-content; }
    .vh-dual-marquee-track .vh-card { width: var(--vh-card-w); flex-shrink: 0; }
    .vh-dual-marquee-track--left { animation: vh-dual-marquee-left var(--vh-dual-marquee-duration, 30s) linear infinite; }
    .vh-dual-marquee-track--right { animation: vh-dual-marquee-right var(--vh-dual-marquee-duration, 30s) linear infinite; }
    .vh-dual-marquee:hover .vh-dual-marquee-track--left,
    .vh-dual-marquee:hover .vh-dual-marquee-track--right { animation-play-state: paused; }
    @keyframes vh-dual-marquee-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    @keyframes vh-dual-marquee-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }

    /* Mobile compact */
    @media (max-width: 639px) {
      .vh-card { padding: 8px; gap: 4px; border-radius: 8px; min-height: 130px; }
      .vh-stars { font-size: 11px; letter-spacing: 0.5px; }
      .vh-content { font-size: 11px; line-height: 1.4; }
      .vh-content.vh-clamp { -webkit-line-clamp: 3; }
      .vh-name { font-size: 10px; }
      .vh-title { font-size: 10px; }
      .vh-date { font-size: 10px; }
      .vh-read-more { font-size: 10px; }
      .vh-quote { font-size: 24px !important; }
      .vh-avatar { width: 28px; height: 28px; }
      .vh-initials { width: 28px; height: 28px; font-size: 12px; }
      .vh-author { gap: 6px; margin-top: 3px; }
      .vh-root { --vh-card-w: min(230px, 60vw); }
      .vh-grid { gap: 8px; grid-template-columns: repeat(2, 1fr); }
      .vh-list { gap: 8px; }
      .vh-wall { column-width: 140px; column-gap: 8px; }
      .vh-wall .vh-card { margin-bottom: 8px; }
      .vh-carousel-track { gap: 12px; }
      .vh-marquee-track { gap: 12px; }
      .vh-dual-marquee { gap: 12px; }
      .vh-dual-marquee-track { gap: 12px; }
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

  function parseCssColor(str) {
    if (!str) return null;
    var hex = str.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (hex) {
      var h = hex[1];
      if (h.length === 3) {
        return {
          r: parseInt(h[0] + h[0], 16),
          g: parseInt(h[1] + h[1], 16),
          b: parseInt(h[2] + h[2], 16)
        };
      }
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16)
      };
    }
    var m = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return null;
    return { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10) };
  }

  function relativeLuminance(r, g, b) {
    var rs = r / 255;
    var gs = g / 255;
    var bs = b / 255;
    rs = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
    gs = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
    bs = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function detectHostColors(el) {
    var result = { mode: "light", bgColor: null, textColor: null, headingColor: null, accentColor: null };
    try {
      // Walk up to find non-transparent background
      var node = el.parentElement;
      while (node && node !== document.documentElement) {
        var bg = window.getComputedStyle(node).backgroundColor;
        if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
          var parsed = parseCssColor(bg);
          if (parsed) {
            result.bgColor = rgbToHex(parsed.r, parsed.g, parsed.b);
            result.mode = relativeLuminance(parsed.r, parsed.g, parsed.b) >= 0.5 ? "light" : "dark";
          }
          break;
        }
        node = node.parentElement;
      }

      // Detect text color from nearest parent
      var textNode = el.parentElement;
      if (textNode) {
        var textRgb = parseCssColor(window.getComputedStyle(textNode).color);
        if (textRgb) {
          result.textColor = rgbToHex(textRgb.r, textRgb.g, textRgb.b);
        }
      }

      // Search for heading and link colors within the nearest section (bgNode),
      // falling back to document-wide search
      var scope = node || document;

      // Detect heading color from nearest scope
      var heading = scope.querySelector("h1, h2, h3");
      if (!heading && scope !== document) heading = document.querySelector("h1, h2, h3");
      if (heading) {
        var headingRgb = parseCssColor(window.getComputedStyle(heading).color);
        if (headingRgb) {
          result.headingColor = rgbToHex(headingRgb.r, headingRgb.g, headingRgb.b);
        }
      }

      // Detect accent color from nearest link
      var link = scope.querySelector("a");
      if (!link && scope !== document) link = document.querySelector("a");
      if (link) {
        var linkRgb = parseCssColor(window.getComputedStyle(link).color);
        if (linkRgb) {
          result.accentColor = rgbToHex(linkRgb.r, linkRgb.g, linkRgb.b);
        }
      }
    } catch (e) {
      // Silently fall back to defaults
    }
    return result;
  }

  function stars(rating, color) {
    var s = "";
    for (var i = 0; i < 5; i++) s += i < rating ? "\u2605" : "\u2606";
    return s;
  }

  function formatDate(d) {
    try {
      var dt = new Date(d);
      return dt.getFullYear() + "\u5E74" + (dt.getMonth() + 1) + "\u6708" + dt.getDate() + "\u65E5";
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

    // Quote mark + content
    html += '<div class="vh-content-wrap">';
    html += '<span class="vh-quote" style="color:' + brand + '">\u201C</span>';
    html += '<div class="vh-content' + (clamp ? ' vh-clamp' : '') + '" style="padding-left:14px">' + escapeHtml(t.content) + '</div>';
    html += '</div>';
    if (clamp && t.content) {
      html += '<button class="vh-read-more" style="color:' + brand + ';padding-left:14px"'
        + ' data-full-content="' + escapeAttr(t.content) + '"'
        + ' data-name="' + escapeAttr(t.name || "\u533F\u540D") + '"'
        + ' data-date="' + (t.submitted_at ? escapeAttr(formatDate(t.submitted_at)) : "") + '"'
        + ' data-rating="' + (t.rating || 0) + '"'
        + '>\u7D9A\u304D\u3092\u8AAD\u3080</button>';
    }

    // Author: name (left) + date (right), no avatar
    html += '<div class="vh-author" style="justify-content:space-between">';
    html += '<span class="vh-name">' + escapeHtml(t.name || "\u533F\u540D") + "</span>";
    if (theme.showDate) html += '<span class="vh-date">' + formatDate(t.submitted_at) + "</span>";
    html += "</div></div>";

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
    var html = '<div class="vh-list">';
    for (var i = 0; i < data.testimonials.length; i++) {
      html += buildCard(data.testimonials[i], theme, true);
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
      return '<div class="vh-single vh-single-fade">' + buildCard(t, theme, true) + '</div>';
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
      html += buildCard(data.testimonials[i], theme, false);
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
      html += buildCard(testimonials[i], theme, true);
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
    // Allow data-type attribute to override widget type (for testing)
    var typeOverride = container.getAttribute("data-type");
    if (typeOverride) widget = Object.assign({}, widget, { type: typeOverride });
    var testimonials = data.testimonials;
    var theme = widget.theme || {};

    // Auto mode: detect host page colors and apply overrides
    var autoOverrides = null;
    if (theme.mode === "auto") {
      var detected = detectHostColors(container);
      autoOverrides = detected;
      // Override brandColor if accent was detected
      if (detected.accentColor) {
        theme = { brandColor: detected.accentColor };
        for (var k in (widget.theme || {})) {
          if (k !== "brandColor") theme[k] = widget.theme[k];
        }
      }
    }

    var mode = theme.mode === "dark" ? "vh-dark"
             : (theme.mode === "auto" && autoOverrides && autoOverrides.mode === "dark") ? "vh-dark"
             : "vh-light";

    var shadow = container.shadowRoot || container.attachShadow({ mode: "open" });
    var style = document.createElement("style");
    style.textContent = CSS;

    // Collect auto-mode CSS variable overrides to apply via inline style
    var autoVars = null;
    if (autoOverrides) {
      autoVars = {};
      autoVars["--vh-bg"] = "transparent";
      autoVars["--vh-border"] = "transparent";
      if (autoOverrides.mode === "dark") {
        autoVars["--vh-card"] = "rgba(255,255,255,0.05)";
        autoVars["--vh-shadow"] = "0 1px 4px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.06)";
      } else {
        autoVars["--vh-card"] = "rgba(255,255,255,0.7)";
        autoVars["--vh-shadow"] = "0 1px 4px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.04)";
      }
      if (autoOverrides.textColor) {
        autoVars["--vh-text"] = autoOverrides.textColor;
        var parsed = parseCssColor(autoOverrides.textColor);
        if (parsed) {
          var mr, mg, mb;
          if (autoOverrides.mode === "dark") {
            mr = Math.round(parsed.r * 0.6);
            mg = Math.round(parsed.g * 0.6);
            mb = Math.round(parsed.b * 0.6);
          } else {
            mr = Math.round(parsed.r + (255 - parsed.r) * 0.4);
            mg = Math.round(parsed.g + (255 - parsed.g) * 0.4);
            mb = Math.round(parsed.b + (255 - parsed.b) * 0.4);
          }
          autoVars["--vh-muted"] = "rgb(" + mr + "," + mg + "," + mb + ")";
        } else {
          autoVars["--vh-muted"] = autoOverrides.textColor;
        }
      }
      if (autoOverrides.headingColor) autoVars["--vh-heading"] = autoOverrides.headingColor;
    }

    var root = document.createElement("div");
    root.className = "vh-root " + mode;

    // Apply auto-mode overrides via inline style (highest specificity)
    if (autoVars) {
      for (var prop in autoVars) {
        root.style.setProperty(prop, autoVars[prop]);
      }
    }

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

    // Check each clamped element: if fits in 4 lines, show full text; otherwise clamp to 3
    var clampEls = shadow.querySelectorAll(".vh-clamp");
    for (var ci = 0; ci < clampEls.length; ci++) {
      var el = clampEls[ci];
      // Temporarily expand to 4 lines to check if content fits
      el.style.webkitLineClamp = "4";
      var nextBtn = el.parentElement && el.parentElement.nextElementSibling;
      if (el.scrollHeight <= el.clientHeight) {
        // Fits in 4 lines: remove clamp, show full text, hide "続きを読む"
        el.classList.remove("vh-clamp");
        el.style.webkitLineClamp = "";
        if (nextBtn && nextBtn.classList.contains("vh-read-more")) {
          nextBtn.style.display = "none";
        }
      } else {
        // Exceeds 4 lines: revert to 3-line clamp, show "続きを読む"
        el.style.webkitLineClamp = "";
      }
    }

    // Read more → open modal (appended to document.body for mobile compatibility)
    root.addEventListener("click", function(e) {
      var btn = e.target;
      if (!btn || !btn.classList.contains("vh-read-more")) return;

      var brand = sanitizeColor(theme.brandColor || "#635BFF");
      var fullContent = btn.getAttribute("data-full-content") || "";
      var rName = btn.getAttribute("data-name") || "\u533F\u540D";
      var date = btn.getAttribute("data-date") || "";
      var rating = parseInt(btn.getAttribute("data-rating") || "0", 10);
      var isDark = root.classList.contains("vh-dark");
      var modalBg = isDark ? "#1f2937" : "#fff";
      var textColor = isDark ? "#e0e0e0" : "#374151";
      var mutedColor = isDark ? "#6b7280" : "#9ca3af";

      var overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:999999;animation:vh-fade-in 0.15s ease;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif";

      var modal = document.createElement("div");
      modal.style.cssText = "background:" + modalBg + ";border-radius:12px;padding:24px;max-width:480px;width:calc(100% - 32px);max-height:80vh;overflow-y:auto;position:relative;box-shadow:0 8px 32px rgba(0,0,0,0.18)";

      var closeBtn = document.createElement("button");
      closeBtn.textContent = "\u00D7";
      closeBtn.style.cssText = "position:absolute;top:8px;right:12px;background:none;border:none;font-size:22px;cursor:pointer;color:" + mutedColor + ";line-height:1;padding:4px";

      var html = "";
      if (theme.showRating !== false) {
        html += '<div style="font-size:14px;letter-spacing:1px;color:' + brand + '">' + stars(rating, brand) + '</div>';
      }
      html += '<div style="position:relative;margin-top:8px">';
      html += '<span style="position:absolute;top:-4px;left:-2px;font-size:32px;line-height:1;opacity:0.15;font-family:Georgia,serif;color:' + brand + '">\u201C</span>';
      html += '<div style="padding-left:14px;font-size:13px;line-height:1.6;color:' + textColor + ';white-space:pre-wrap;word-break:break-word">' + escapeHtml(fullContent) + '</div>';
      html += '</div>';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px">';
      html += '<span style="font-size:11px;color:' + mutedColor + '">' + escapeHtml(rName) + '</span>';
      if (theme.showDate && date) html += '<span style="font-size:11px;color:' + mutedColor + ';opacity:0.7">' + date + '</span>';
      html += '</div>';

      modal.innerHTML = html;
      modal.insertBefore(closeBtn, modal.firstChild);
      overlay.appendChild(modal);

      function closeModal() { if (overlay.parentNode) overlay.remove(); }
      overlay.addEventListener("click", function(ev) { if (ev.target === overlay) closeModal(); });
      closeBtn.addEventListener("click", closeModal);

      // Remove existing modal
      var existing = document.querySelector("[data-vh-modal]");
      if (existing) existing.remove();

      overlay.setAttribute("data-vh-modal", "1");
      document.body.appendChild(overlay);
    });
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  function showSkeleton(container, themeAttr) {
    var shadow = container.attachShadow({ mode: "open" });
    var style = document.createElement("style");
    style.textContent = CSS;
    var skeletonMode = "vh-light";
    if (themeAttr === "dark") {
      skeletonMode = "vh-dark";
    } else if (themeAttr === "auto") {
      // Synchronously detect background luminance for skeleton
      try {
        var node = container.parentElement;
        while (node && node !== document.documentElement) {
          var bg = window.getComputedStyle(node).backgroundColor;
          if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
            var parsed = parseCssColor(bg);
            if (parsed && relativeLuminance(parsed.r, parsed.g, parsed.b) < 0.5) {
              skeletonMode = "vh-dark";
            }
            break;
          }
          node = node.parentElement;
        }
      } catch (e) {
        // Fall back to light
      }
    }
    var root = document.createElement("div");
    root.className = "vh-root " + skeletonMode;
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

    var themeAttr = el.getAttribute("data-theme") || "light";
    showSkeleton(el, themeAttr);

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
