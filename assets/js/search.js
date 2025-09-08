(function () {
  'use strict';

  // Resolve /search.json robustly without Liquid or hard-coding baseurl
  function resolveIndexUrl() {
    try {
      // Prefer the current script's src to infer base path (works with /<baseurl>/assets/js/search.js)
      var script = document.currentScript || document.querySelector('script[src*="assets/js/search.js"]');
      if (script) {
        var src = new URL(script.getAttribute('src'), window.location.href);
        // Replace trailing /assets/js/search.js[?v=...] with /search.json
        return src.pathname.replace(/\/assets\/js\/search\.js(?:\?.*)?$/, '/search.json');
      }
    } catch (e) { /* ignore */ }
    // Fallback: guess base from the first path segment (/repo/...)
    var parts = window.location.pathname.split('/').filter(Boolean);
    var base = parts.length ? '/' + parts[0] : '';
    return base + '/search.json';
  }

  var INDEX_URL = resolveIndexUrl();

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    var openBtn = document.getElementById('search-open');
    var modal   = document.getElementById('search-modal');
    var input   = document.getElementById('search-input');
    var list    = document.getElementById('search-results');

    if (!openBtn || !modal || !input || !list) return; // modal not present on this page

    var idx = null, docs = [];

    async function ensureIndex() {
      if (idx) return;
      try {
        var res = await fetch(INDEX_URL, { cache: 'no-store' });
        docs = await res.json();
        if (!window.lunr) throw new Error('lunr not loaded');
        idx = lunr(function () {
          this.ref('id');
          this.field('title', { boost: 8 });
          this.field('content');
          this.field('type',   { boost: 2 });
          docs.forEach(function (doc) { this.add(doc); }, this);
        });
      } catch (err) {
        console.error('Search index error:', err);
        list.innerHTML = '<li class="empty">Search unavailable. Try reloading.</li>';
      }
    }

    function render(results) {
      list.innerHTML = '';
      if (!results || !results.length) { list.innerHTML = '<li class="empty">No results</li>'; return; }
      results.slice(0, 12).forEach(function (r) {
        var d = docs.find(function (x) { return String(x.id) === String(r.ref); });
        if (!d) return;
        var li = document.createElement('li');
        li.className = 'result';
        li.innerHTML = '<a href="' + d.url + '">\n' +
                       '  <span class="title">' + d.title + '</span>\n' +
                       '  <span class="meta">' + (d.type || '') + '</span>\n' +
                       '</a>';
        list.appendChild(li);
      });
    }

    async function openModal() {
      await ensureIndex();
      modal.classList.add('open');
      input.value = '';
      list.innerHTML = '';
      input.focus();
    }
    function closeModal() { modal.classList.remove('open'); }

    openBtn.addEventListener('click', openModal);
    document.getElementById('search-close')?.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

    input.addEventListener('input', function (e) {
      if (!idx) return; // not ready yet
      var q = (e.target.value || '').trim();
      if (!q) { list.innerHTML = ''; return; }
      try {
        var results = idx.search(q + '*'); // prefix search
        render(results);
      } catch (err) {
        // Lunr can throw on malformed query; fall back to simple filtering
        var lc = q.toLowerCase();
        render(docs.filter(function (d) {
          return (d.title && d.title.toLowerCase().includes(lc)) ||
                 (d.content && d.content.toLowerCase().includes(lc));
        }).map(function (d) { return { ref: String(d.id) }; }));
      }
    });

    // Cmd/Ctrl+K shortcut
    window.addEventListener('keydown', function (e) {
      var isMac = navigator.platform.toUpperCase().indexOf('MAC')>=0;
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); openModal();
      } else if (e.key === 'Escape') {
        closeModal();
      }
    });
  });
})();