(function(){
  "use strict";
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

  var ICONS = {
    bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"></path></svg>'
  };

  var SUBJECT_COLORS = { dbms:'var(--sage)', os:'var(--brick)', cn:'var(--dusty)', dsa:'var(--plum)', dm:'var(--slate)' };

  var SEED_LIBRARY = [
    { id:'dbms-notes', title:'DBMS Notes', subject:'Database Management Systems', tag:'dbms' },
    { id:'os-notes', title:'Operating Systems Notes', subject:'Operating Systems', tag:'os' },
    { id:'cn-notes', title:'Computer Networks Notes', subject:'Computer Networks', tag:'cn' },
    { id:'dsa-notes', title:'Data Structures & Algorithms Notes', subject:'DSA', tag:'dsa' },
    { id:'dm-notes', title:'Discrete Mathematics Notes', subject:'Discrete Math', tag:'dm' }
  ];

  var BASE_SCALE = 1.2, MIN_SCALE = 0.6, MAX_SCALE = 3.4, STEP = 0.2;

  // In-memory store (this environment has no window.storage; falls back gracefully)
  var memoryStore = {};
  var storage = window.storage || {
    get: function(key){ return Promise.resolve(memoryStore[key] ? { key:key, value:memoryStore[key] } : null); },
    set: function(key, value){ memoryStore[key] = value; return Promise.resolve({ key:key, value:value }); }
  };

  var library = [];
  var sessionFiles = {};
  var current = { id:null, pdfDoc:null, pageNum:1, scale:BASE_SCALE, numPages:0 };
  var saveTimer = null;

  var $ = function(id){ return document.getElementById(id); };
  var clamp = function(n,min,max){ return Math.max(min, Math.min(max, n)); };

  function loadLibrary(){
    var stored = null;
    storage.get('library', false).then(function(res){
      if (res && res.value) { try { stored = JSON.parse(res.value); } catch(e){ stored = null; } }
    }).catch(function(){ stored = null; }).then(function(){
      library = SEED_LIBRARY.map(function(seed){
        var saved = stored && stored.filter(function(d){ return d.id === seed.id; })[0];
        return Object.assign({}, seed, {
          lastPage: saved && saved.lastPage || null,
          totalPages: saved && saved.totalPages || null,
          bookmarked: !!(saved && saved.bookmarked),
          lastReadAt: saved && saved.lastReadAt || null
        });
      });
      renderLibrary();
    });
  }

  function persistLibrary(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){
      var payload = library.map(function(d){
        return { id:d.id, lastPage:d.lastPage, totalPages:d.totalPages, bookmarked:d.bookmarked, lastReadAt:d.lastReadAt };
      });
      storage.set('library', JSON.stringify(payload), false).catch(function(err){
        console.error('Could not save reading progress', err);
      });
    }, 350);
  }

  function renderLibrary(){
    var inProgress = library.filter(function(d){ return d.lastReadAt; })
      .sort(function(a,b){ return b.lastReadAt - a.lastReadAt; })[0];

    var card = $('continueCard');
    if (inProgress) {
      card.hidden = false;
      $('continueTitle').textContent = inProgress.title;
      $('continueMeta').textContent = 'Page ' + inProgress.lastPage + (inProgress.totalPages ? ' of ' + inProgress.totalPages : '');
      card.dataset.docId = inProgress.id;
    } else {
      card.hidden = true;
    }

    $('libCount').textContent = library.length + ' resources';

    var grid = $('libraryGrid');
    grid.innerHTML = '';
    library.forEach(function(doc){
      var el = document.createElement('article');
      el.className = 'doc-card';
      el.style.setProperty('--tab-color', SUBJECT_COLORS[doc.tag]);
      var metaBits = [];
      metaBits.push(doc.totalPages ? doc.totalPages + ' pages' : 'Not opened yet');
      if (doc.lastPage) metaBits.push('last read p.' + doc.lastPage);
      el.innerHTML =
        '<h3>' + doc.title + '</h3>' +
        '<p class="doc-subject">' + doc.subject + '</p>' +
        '<p class="doc-meta">' + metaBits.join(' · ') + '</p>' +
        '<div class="doc-card-footer">' +
          '<button class="open-btn" data-action="open" data-id="' + doc.id + '">' + (doc.lastPage ? 'Continue' : 'Open') + '</button>' +
          '<button class="ribbon-toggle' + (doc.bookmarked ? ' active' : '') + '" data-action="bookmark" data-id="' + doc.id + '" aria-pressed="' + doc.bookmarked + '" aria-label="Bookmark ' + doc.title + '">' + ICONS.bookmark + '</button>' +
        '</div>';
      grid.appendChild(el);
    });
  }

  function toggleBookmark(id, btnEl){
    var doc = library.filter(function(d){ return d.id === id; })[0];
    if (!doc) return;
    doc.bookmarked = !doc.bookmarked;
    persistLibrary();
    if (btnEl){
      btnEl.classList.toggle('active', doc.bookmarked);
      btnEl.setAttribute('aria-pressed', doc.bookmarked);
      btnEl.classList.remove('bump'); void btnEl.offsetWidth; btnEl.classList.add('bump');
    }
    if (current.id === id) syncReaderBookmarkUI(doc);
    else renderLibrary();
  }

  function pickFile(){
    return new Promise(function(resolve){
      var input = $('fileInput');
      input.value = '';
      input.onchange = function(){ resolve(input.files[0] || null); };
      input.oncancel = function(){ resolve(null); };
      input.click();
    });
  }

  function openDocument(id, jumpToPage){
    var doc = library.filter(function(d){ return d.id === id; })[0];
    if (!doc) return Promise.resolve();

    var cachedPromise = sessionFiles[id] ? Promise.resolve(sessionFiles[id]) : pickFile().then(function(file){
      if (!file) return null;
      return file.arrayBuffer().then(function(buf){
        return pdfjsLib.getDocument({ data: buf }).promise.then(function(pdfDoc){
          var cached = { file: file, pdfDoc: pdfDoc };
          sessionFiles[id] = cached;
          doc.totalPages = pdfDoc.numPages;
          persistLibrary();
          return cached;
        });
      });
    });

    return cachedPromise.then(function(cached){
      if (!cached) return;
      current.id = id;
      current.pdfDoc = cached.pdfDoc;
      current.numPages = cached.pdfDoc.numPages;
      current.scale = BASE_SCALE;
      current.pageNum = clamp(jumpToPage || doc.lastPage || 1, 1, current.numPages);
      showReaderScreen(doc);
      return renderPage();
    }).catch(function(err){
      console.error('Could not open PDF', err);
      window.alert("That file couldn't be opened. Please choose the matching PDF and try again.");
    });
  }

  function showReaderScreen(doc){
    $('app').classList.add('reader-active');
    $('libraryScreen').hidden = true;
    $('readerScreen').hidden = false;
    $('readerTitle').textContent = doc.title;
    syncReaderBookmarkUI(doc);
  }

  function backToLibrary(){
    if (document.fullscreenElement) document.exitFullscreen();
    $('app').classList.remove('reader-active');
    $('readerScreen').hidden = true;
    $('libraryScreen').hidden = false;
    current.id = null;
    renderLibrary();
  }

  function syncReaderBookmarkUI(doc){
    var btn = $('bookmarkBtn');
    btn.classList.toggle('active', !!doc.bookmarked);
    btn.setAttribute('aria-pressed', !!doc.bookmarked);
  }

  function renderPage(){
    return current.pdfDoc.getPage(current.pageNum).then(function(page){
      var viewport = page.getViewport({ scale: current.scale });
      var canvas = $('pdfCanvas');
      var ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      var shell = $('pageShell');
      shell.classList.remove('page-shell'); void shell.offsetWidth; shell.classList.add('page-shell');
      return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function(){
        $('pageInput').value = current.pageNum;
        $('pageTotal').textContent = current.numPages;
        $('zoomLevel').textContent = Math.round((current.scale / BASE_SCALE) * 100) + '%';
        $('prevPage').disabled = current.pageNum <= 1;
        $('nextPage').disabled = current.pageNum >= current.numPages;
        $('foldPrev').classList.toggle('enabled', current.pageNum > 1);
        $('foldNext').classList.toggle('enabled', current.pageNum < current.numPages);
        updateProgress();
      });
    });
  }

  function updateProgress(){
    var doc = library.filter(function(d){ return d.id === current.id; })[0];
    if (!doc) return;
    doc.lastPage = current.pageNum;
    doc.lastReadAt = Date.now();
    persistLibrary();
  }

  function goToPage(n){
    var target = clamp(n, 1, current.numPages);
    if (target === current.pageNum) return;
    current.pageNum = target;
    renderPage();
  }

  function zoomBy(delta){
    current.scale = clamp(Math.round((current.scale + delta) * 100) / 100, MIN_SCALE, MAX_SCALE);
    renderPage();
  }

  function downloadCurrent(){
    var cached = sessionFiles[current.id];
    var doc = library.filter(function(d){ return d.id === current.id; })[0];
    if (!cached) return;
    var url = URL.createObjectURL(cached.file);
    var a = document.createElement('a');
    a.href = url;
    a.download = cached.file.name || ((doc ? doc.title : 'document') + '.pdf');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
  }

  function toggleFullscreen(){
    var el = $('readerScreen');
    if (!document.fullscreenElement) el.requestFullscreen && el.requestFullscreen();
    else document.exitFullscreen();
  }

  function init(){
    loadLibrary();

    $('libraryGrid').addEventListener('click', function(e){
      var btn = e.target.closest('button[data-action]');
      if (!btn) return;
      var id = btn.dataset.id;
      if (btn.dataset.action === 'open') openDocument(id);
      else if (btn.dataset.action === 'bookmark') toggleBookmark(id, btn);
    });

    $('resumeBtn').addEventListener('click', function(){
      var id = $('continueCard').dataset.docId;
      var doc = library.filter(function(d){ return d.id === id; })[0];
      if (id) openDocument(id, doc ? doc.lastPage : null);
    });

    $('backBtn').addEventListener('click', backToLibrary);
    $('prevPage').addEventListener('click', function(){ goToPage(current.pageNum - 1); });
    $('nextPage').addEventListener('click', function(){ goToPage(current.pageNum + 1); });
    $('foldPrev').addEventListener('click', function(){ goToPage(current.pageNum - 1); });
    $('foldNext').addEventListener('click', function(){ goToPage(current.pageNum + 1); });
    $('zoomIn').addEventListener('click', function(){ zoomBy(STEP); });
    $('zoomOut').addEventListener('click', function(){ zoomBy(-STEP); });
    $('fullscreenBtn').addEventListener('click', toggleFullscreen);
    $('downloadBtn').addEventListener('click', downloadCurrent);
    $('bookmarkBtn').addEventListener('click', function(){ if (current.id) toggleBookmark(current.id, $('bookmarkBtn')); });

    $('pageInput').addEventListener('keydown', function(e){
      if (e.key === 'Enter'){ e.preventDefault(); goToPage(parseInt(e.target.value, 10) || 1); e.target.blur(); }
    });
    $('pageInput').addEventListener('blur', function(e){
      goToPage(parseInt(e.target.value, 10) || current.pageNum);
    });

    document.addEventListener('fullscreenchange', function(){
      var fsBtn = $('fullscreenBtn');
      fsBtn.innerHTML = document.fullscreenElement
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"></path><path d="M16 3v3a2 2 0 0 0 2 2h3"></path><path d="M21 16h-3a2 2 0 0 0-2 2v3"></path><path d="M3 16h3a2 2 0 0 1 2 2v3"></path></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M16 3h3a2 2 0 0 1 2 2v3"></path><path d="M21 16v3a2 2 0 0 1-2 2h-3"></path><path d="M8 21H5a2 2 0 0 1-2-2v-3"></path></svg>';
      fsBtn.setAttribute('aria-label', document.fullscreenElement ? 'Exit full screen' : 'Enter full screen');
    });

    document.addEventListener('keydown', function(e){
      if ($('readerScreen').hidden) return;
      if (document.activeElement === $('pageInput')) return;
      if (e.key === 'ArrowRight') goToPage(current.pageNum + 1);
      else if (e.key === 'ArrowLeft') goToPage(current.pageNum - 1);
      else if (e.key === '+' || e.key === '=') zoomBy(STEP);
      else if (e.key === '-') zoomBy(-STEP);
      else if (e.key.toLowerCase() === 'f') toggleFullscreen();
    });
  }

  init();
})();