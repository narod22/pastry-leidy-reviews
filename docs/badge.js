/*
 * Pastry Leidy Google reviews badge.
 * Floating badge (bottom-left) that opens a panel with every Google review.
 * Data comes from reviews.json next to this file, refreshed weekly by a GitHub Action.
 * Everything renders inside a shadow root so Wix styles can't leak in or out.
 */
(function () {
  if (window.__plReviewsBadge) return;
  window.__plReviewsBadge = true;

  var script = document.currentScript;
  var base = script && script.src ? script.src.replace(/[^/]*(\?.*)?$/, "") : "";
  var DATA_URL = (script && script.getAttribute("data-src")) || base + "reviews.json";
  var PAGE_SIZE = 12;

  var PLUM = "#995D7F";
  var PLUM_DARK = "#7d4a67";
  var STAR = "#F08C2E";
  var FONT = "'futura-lt-w01-book', 'Futura', 'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif";

  var G_LOGO =
    '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>';

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function stars(n, size) {
    var out = "";
    for (var i = 1; i <= 5; i++) {
      var fill = n >= i ? 1 : n >= i - 0.5 ? 0.5 : 0;
      var id = "h" + Math.random().toString(36).slice(2, 8);
      out +=
        '<svg class="star" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true">' +
        (fill === 0.5
          ? '<defs><linearGradient id="' + id + '"><stop offset="50%" stop-color="' + STAR + '"/><stop offset="50%" stop-color="#D9D9D9"/></linearGradient></defs>'
          : "") +
        '<path fill="' + (fill === 1 ? STAR : fill === 0.5 ? "url(#" + id + ")" : "#D9D9D9") +
        '" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';
    }
    return '<span class="stars" role="img" aria-label="' + n + ' out of 5 stars">' + out + "</span>";
  }

  function ago(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    var days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days < 1) return "today";
    if (days < 2) return "yesterday";
    if (days < 7) return days + " days ago";
    if (days < 14) return "a week ago";
    if (days < 31) return Math.floor(days / 7) + " weeks ago";
    if (days < 61) return "a month ago";
    if (days < 365) return Math.floor(days / 30.4) + " months ago";
    if (days < 730) return "a year ago";
    return Math.floor(days / 365) + " years ago";
  }

  var CSS =
    ":host{all:initial}" +
    "*{box-sizing:border-box;font-family:" + FONT + "}" +
    // Badge layout: [Google logo] | [rating, stars, count] | [up arrow], matching the old app.
    ".wrap{position:fixed;left:16px;bottom:16px;z-index:2147483000}" +
    ".badge{display:flex;align-items:stretch;min-height:66px;padding:0;margin:0;background:#fff;" +
    "border:1px solid #ececec;border-radius:8px;box-shadow:0 4px 18px rgba(0,0,0,.14);" +
    "cursor:pointer;color:#222;text-align:left;transition:box-shadow .15s ease}" +
    ".badge:hover{box-shadow:0 6px 24px rgba(0,0,0,.2)}" +
    ".badge:focus-visible,.btn:focus-visible,.more:focus-visible,.close:focus-visible{outline:2px solid " + PLUM + ";outline-offset:2px}" +
    ".badge .g{display:flex;align-items:center;justify-content:center;width:70px;flex:none;border-right:1px solid #ececec}" +
    ".badge .g svg{width:34px;height:34px}" +
    ".badge .mid{display:flex;flex-direction:column;justify-content:center;padding:10px 20px 10px 18px}" +
    ".badge .score{display:flex;align-items:center;gap:8px;font-size:20px;line-height:1;color:" + STAR + "}" +
    ".badge .count{font-size:12px;letter-spacing:.06em;color:#333;margin-top:7px;text-transform:uppercase}" +
    ".badge .up{display:flex;align-items:center;justify-content:center;width:54px;flex:none;border-left:1px solid #ececec;color:#b5b5b5;transition:color .15s}" +
    ".badge:hover .up{color:" + PLUM + "}" +
    ".badge .up svg{width:20px;height:20px}" +
    ".stars{display:inline-flex;gap:1px;vertical-align:middle}" +
    ".panel{position:fixed;left:16px;bottom:16px;z-index:2147483001;width:400px;max-width:calc(100vw - 32px);" +
    "height:min(640px,calc(100vh - 32px));background:#fff;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.25);" +
    "display:flex;flex-direction:column;overflow:hidden;color:#222}" +
    ".panel[hidden]{display:none}" +
    ".head{padding:18px 18px 14px;border-bottom:1px solid #eee;background:#faf5f8;position:relative}" +
    ".head .row{display:flex;align-items:center;gap:10px}" +
    ".head .g{width:28px;height:28px;flex:none}.head .g svg{width:100%;height:100%}" +
    ".head h2{font-size:17px;margin:0;font-weight:600;letter-spacing:.01em}" +
    ".head .sum{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:15px}" +
    ".head .sum b{font-size:22px;font-weight:600}" +
    ".head .sub{font-size:12px;color:#666;margin-top:4px}" +
    ".actions{display:flex;gap:8px;margin-top:12px}" +
    ".btn{flex:1;display:inline-flex;justify-content:center;align-items:center;padding:9px 10px;border-radius:6px;font-size:12px;" +
    "letter-spacing:.08em;text-transform:uppercase;text-decoration:none;border:1px solid " + PLUM + ";cursor:pointer}" +
    ".btn.primary{background:" + PLUM + ";color:#fff}.btn.primary:hover{background:" + PLUM_DARK + ";border-color:" + PLUM_DARK + "}" +
    ".btn.ghost{background:#fff;color:" + PLUM + "}.btn.ghost:hover{background:#f6eef3}" +
    ".close{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;background:transparent;font-size:22px;color:#555;cursor:pointer;border-radius:50%}" +
    ".close:hover{background:rgba(0,0,0,.06)}" +
    ".list{overflow-y:auto;flex:1;padding:4px 18px 12px;-webkit-overflow-scrolling:touch}" +
    ".rev{padding:14px 0;border-bottom:1px solid #f0f0f0}" +
    ".rev:last-child{border-bottom:0}" +
    ".who{display:flex;align-items:center;gap:10px}" +
    ".av{width:36px;height:36px;border-radius:50%;flex:none;object-fit:cover;background:" + PLUM + ";color:#fff;" +
    "display:flex;align-items:center;justify-content:center;font-size:15px}" +
    ".name{font-size:14px;font-weight:600;color:#222;text-decoration:none}" +
    "a.name:hover{text-decoration:underline}" +
    ".when{font-size:12px;color:#777;margin-left:6px}" +
    ".meta{display:flex;align-items:center;margin-top:3px}" +
    ".txt{font-size:14px;line-height:1.5;color:#333;margin:8px 0 0;white-space:pre-line}" +
    ".txt.clamp{display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}" +
    ".rm{background:none;border:0;padding:0;margin-top:4px;color:" + PLUM + ";font-size:13px;cursor:pointer}" +
    ".reply{margin:10px 0 0 12px;padding:8px 10px;border-left:2px solid #e3cfdb;font-size:13px;color:#555;line-height:1.45}" +
    ".reply b{display:block;font-size:12px;color:#333;margin-bottom:2px}" +
    ".reply.clamp .rt{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}" +
    ".reply.clamp{cursor:pointer}" +
    ".more{display:block;width:100%;margin:12px 0 4px;padding:10px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:13px;color:#333;cursor:pointer}" +
    ".more:hover{background:#fafafa}" +
    ".foot{font-size:11px;color:#888;text-align:center;padding:8px;border-top:1px solid #eee}" +
    "@media (max-width:600px){" +
    // Phones: full-width bar across the bottom of the screen, like the old app.
    ".wrap{left:0;right:0;bottom:0}" +
    ".badge{width:100%;min-height:78px;border-radius:10px 10px 0 0;border-bottom:0;" +
    "padding-bottom:env(safe-area-inset-bottom);box-shadow:0 -2px 16px rgba(0,0,0,.14)}" +
    ".badge .g{width:80px}.badge .g svg{width:40px;height:40px}" +
    ".badge .mid{flex:1}.badge .score{font-size:24px}.badge .star{width:22px;height:22px}.badge .count{font-size:14px}" +
    ".badge .up{width:68px}.badge .up svg{width:24px;height:24px}" +
    ".panel{left:0;right:0;bottom:0;width:100%;max-width:100%;height:85vh;border-radius:14px 14px 0 0}}" +
    "@media (prefers-reduced-motion:reduce){.badge{transition:none}}";

  function render(data) {
    var place = data.place || {};
    // Highest rated first, newest first within each rating. Every review is still shown.
    var reviews = (data.reviews || []).slice().sort(function (a, b) {
      return (b.stars - a.stars) || (new Date(b.date) - new Date(a.date));
    });
    var rating = Number(place.rating || 0);
    var count = Number(place.reviewsCount || reviews.length);
    var ratingText = rating.toFixed(1);

    var host = document.createElement("div");
    host.id = "pl-reviews-badge";
    document.body.appendChild(host);
    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

    root.innerHTML =
      "<style>" + CSS + "</style>" +
      '<div class="wrap">' +
      '<button class="badge" type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="Rated ' + ratingText +
      " out of 5 from " + count + ' Google reviews. Open reviews.">' +
      '<span class="g">' + G_LOGO + "</span>" +
      '<span class="mid"><span class="score">' + ratingText + " " + stars(rating, 18) + "</span>" +
      '<span class="count">' + count + " reviews</span></span>" +
      '<span class="up" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg></span></button>' +
      "</div>" +
      '<div class="panel" role="dialog" aria-modal="false" aria-label="Google reviews for Pastry Leidy" hidden>' +
      '<div class="head"><div class="row"><span class="g">' + G_LOGO + "</span><h2>" + esc(place.name || "Pastry Leidy") + "</h2></div>" +
      '<div class="sum"><b>' + ratingText + "</b>" + stars(rating, 20) + "</div>" +
      '<div class="sub">Based on ' + count + " Google reviews &middot; Highest rated first</div>" +
      '<div class="actions">' +
      (place.writeReviewUrl ? '<a class="btn primary" target="_blank" rel="noopener" href="' + esc(place.writeReviewUrl) + '">Write a review</a>' : "") +
      (place.url ? '<a class="btn ghost" target="_blank" rel="noopener" href="' + esc(place.url) + '">See on Google</a>' : "") +
      "</div>" +
      '<button class="close" type="button" aria-label="Close reviews">&times;</button></div>' +
      '<div class="list" tabindex="0"></div>' +
      '<div class="foot">Reviews from Google</div>' +
      "</div>";

    var wrap = root.querySelector(".wrap");
    var badge = root.querySelector(".badge");
    var panel = root.querySelector(".panel");
    var list = root.querySelector(".list");
    var shown = 0;

    function reviewHtml(r) {
      var initial = esc((r.name || "?").trim().charAt(0).toUpperCase());
      var avatar = r.photo
        ? '<img class="av" alt="" loading="lazy" referrerpolicy="no-referrer" src="' + esc(r.photo) + '" data-i="' + initial + '">'
        : '<span class="av" aria-hidden="true">' + initial + "</span>";
      var name = r.url
        ? '<a class="name" target="_blank" rel="noopener" href="' + esc(r.url) + '">' + esc(r.name) + "</a>"
        : '<span class="name">' + esc(r.name) + "</span>";
      return (
        '<article class="rev"><div class="who">' + avatar + "<div>" + name +
        '<div class="meta">' + stars(r.stars, 14) + '<span class="when">' + esc(ago(r.date)) + "</span></div></div></div>" +
        (r.text ? '<p class="txt clamp">' + esc(r.text) + "</p>" : "") +
        (r.reply
          ? '<div class="reply clamp" title="Show full response"><b>Response from Pastry Leidy</b><span class="rt">' + esc(r.reply) + "</span></div>"
          : "") +
        "</article>"
      );
    }

    function showMore() {
      var old = list.querySelector(".more");
      if (old) old.remove();
      var html = reviews.slice(shown, shown + PAGE_SIZE).map(reviewHtml).join("");
      shown = Math.min(shown + PAGE_SIZE, reviews.length);
      list.insertAdjacentHTML("beforeend", html);
      list.querySelectorAll("img.av:not([data-bound])").forEach(function (img) {
        img.setAttribute("data-bound", "1");
        img.addEventListener("error", function () {
          var s = document.createElement("span");
          s.className = "av";
          s.textContent = img.getAttribute("data-i");
          img.replaceWith(s);
        });
      });
      list.querySelectorAll(".txt.clamp:not([data-checked])").forEach(function (p) {
        p.setAttribute("data-checked", "1");
        if (p.scrollHeight > p.clientHeight + 2) {
          var b = document.createElement("button");
          b.className = "rm";
          b.type = "button";
          b.textContent = "Read more";
          b.addEventListener("click", function () {
            var open = p.classList.toggle("clamp");
            b.textContent = open ? "Read more" : "Show less";
          });
          p.after(b);
        }
      });
      list.querySelectorAll(".reply.clamp:not([data-bound])").forEach(function (d) {
        d.setAttribute("data-bound", "1");
        d.addEventListener("click", function () { d.classList.remove("clamp"); d.removeAttribute("title"); });
      });
      if (shown < reviews.length) {
        var m = document.createElement("button");
        m.className = "more";
        m.type = "button";
        m.textContent = "Show more reviews (" + (reviews.length - shown) + " more)";
        m.addEventListener("click", showMore);
        list.appendChild(m);
      }
    }

    function open() {
      panel.hidden = false;
      wrap.style.visibility = "hidden";
      badge.setAttribute("aria-expanded", "true");
      if (!shown) showMore();
      root.querySelector(".close").focus();
    }
    function close() {
      panel.hidden = true;
      wrap.style.visibility = "";
      badge.setAttribute("aria-expanded", "false");
      badge.focus();
    }

    badge.addEventListener("click", open);
    root.querySelector(".close").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) close();
    });
  }

  function start() {
    fetch(DATA_URL, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) { if (data && data.reviews && data.reviews.length) render(data); })
      .catch(function (e) { if (window.console) console.warn("Pastry Leidy reviews badge:", e); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
