/* HannahFiles renderer — tabs, dual-pane, search, tags, favorites, zip, preview */
const $ = (s) => document.querySelector(s);
const state = {
  platform: 'linux', home: '/', sep: '/',
  tabs: [], activeTabId: null,
  dual: false, right: { path: '/', history: [], hi: -1 },
  activePane: 'left',
  files: { left: [], right: [] },
  sel: { left: new Set(), right: new Set() },
  clipboard: null, // {mode:'copy'|'cut', items:[paths]}
  view: localStorage.getItem('hf.view') || 'grid',
  showHidden: localStorage.getItem('hf.hidden') === '1',
  previewOpen: localStorage.getItem('hf.preview') !== '0',
  searchMode: false, searchResults: [],
};
let tabSeq = 1;

const TAGS = ['work', 'personal', 'important', 'media', 'archive'];
const TAG_COLORS = { work: '#4cc9f0', personal: '#80ed99', important: '#f25c5c', media: '#c77dff', archive: '#ffb703' };
const getTags = () => JSON.parse(localStorage.getItem('hf.tags') || '{}');
const setTags = (t) => localStorage.setItem('hf.tags', JSON.stringify(t));
const getFavs = () => JSON.parse(localStorage.getItem('hf.favs') || '[]');
const setFavs = (f) => localStorage.setItem('hf.favs', JSON.stringify(f));

const fmtSize = (b) => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : b < 1073741824 ? (b / 1048576).toFixed(1) + ' MB' : (b / 1073741824).toFixed(2) + ' GB';
const fmtDate = (ms) => new Date(ms).toLocaleString();
const iconFor = (f) => {
  if (f.isDir) return '📁';
  const e = (f.ext || '').toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'].includes(e)) return '🖼️';
  if (['.mp4', '.mkv', '.webm', '.avi'].includes(e)) return '🎬';
  if (['.mp3', '.wav', '.ogg', '.flac'].includes(e)) return '🎵';
  if (['.pdf'].includes(e)) return '📕';
  if (['.zip', '.tar', '.gz', '.7z', '.rar'].includes(e)) return '🗜️';
  if (['.txt', '.md', '.json', '.js', '.html', '.css', '.py', '.log'].includes(e)) return '📄';
  if (['.exe', '.msi', '.deb', '.AppImage'].includes(e)) return '⚙️';
  return '📄';
};
const isWin = () => state.platform === 'win32';
const splitPath = (p) => {
  if (isWin()) { const parts = p.split(/[/\\]+/).filter(Boolean); parts[0] = parts[0] + '\\'; return parts; }
  return p.split('/').filter(Boolean);
};
const joinPath = (...a) => {
  if (window.hannahJoin) return window.hannahJoin(...a);
  // fallback: naive join using sep
  return a.join(state.sep).replace(/\/+/g, '/');
};
const parentOf = (p) => {
  if (isWin()) { if (/^[A-Za-z]:\\?$/.test(p)) return p; const i = p.lastIndexOf('\\'); return i <= 2 ? p.slice(0, 3) : p.slice(0, i); }
  if (p === '/') return '/'; const i = p.lastIndexOf('/'); return i <= 0 ? '/' : p.slice(0, i);
};

// ---------- init ----------
(async function init() {
  applyTheme();
  const info = await window.hannah.info();
  Object.assign(state, info);
  state.right.path = info.homedir;
  addTab(info.homedir);
  await refreshDrives();
  renderSidebar();
  bindUI();
  applyPreviewVisibility();
  updateStatusPlatform();
  await navigate(state.right.path, 'right', true);
  await refreshActive();
})();

function applyTheme() {
  const t = localStorage.getItem('hf.theme') || 'dark';
  document.documentElement.dataset.theme = t;
  const b = $('#btn-theme'); if (b) b.textContent = t === 'dark' ? '🌙' : '☀️';
}

// ---------- tabs ----------
function activeTab() { return state.tabs.find((t) => t.id === state.activeTabId); }
function addTab(p) {
  const t = { id: tabSeq++, path: p, history: [p], hi: 0 };
  state.tabs.push(t); state.activeTabId = t.id;
}
function curPath(pane) {
  if (pane === 'right') return state.right.path;
  return activeTab()?.path || state.home;
}
async function navigate(p, pane = 'left', pushHist = true) {
  if (pane === 'right') {
    state.right.path = p;
    if (pushHist) { state.right.history = state.right.history.slice(0, state.right.hi + 1); state.right.history.push(p); state.right.hi++; }
    await renderPane('right');
  } else {
    const t = activeTab(); if (!t) return;
    t.path = p;
    if (pushHist) { t.history = t.history.slice(0, t.hi + 1); t.history.push(p); t.hi++; }
    await renderPane('left');
  }
  renderTabs(); updatePreview();
}
async function refreshActive() { await renderPane('left'); if (state.dual) await renderPane('right'); renderTabs(); }

// ---------- listing ----------
async function renderPane(pane) {
  const dir = curPath(pane);
  const el = pane === 'left' ? $('#files-left') : $('#files-right');
  const pathEl = pane === 'left' ? $('#pane-left-path') : $('#pane-right-path');
  pathEl.textContent = dir;
  let entries = [];
  try {
    if (state.searchMode && pane === 'left') entries = state.searchResults;
    else entries = await window.hannah.list(dir, { showHidden: state.showHidden });
  } catch (e) { el.innerHTML = `<p class="muted">Cannot open: ${esc(dir)}<br>${esc(String(e))}</p>`; return; }
  state.files[pane] = entries;
  state.sel[pane].clear();
  el.className = 'file-area ' + (state.view === 'grid' ? 'grid' : 'rows') + (state.activePane === pane ? ' active' : '');
  el.innerHTML = '';
  if (!entries.length) { el.innerHTML = '<p class="muted">Empty folder</p>'; }
  const tags = getTags();
  for (const f of entries) {
    const d = document.createElement('div');
    const cut = state.clipboard?.mode === 'cut' && state.clipboard.items.includes(f.path);
    if (state.view === 'grid') {
      d.className = 'card' + (cut ? ' cut' : '');
      d.innerHTML = `<div class="ico">${iconFor(f)}</div><div class="nm">${esc(f.name)}</div>${tagDots(tags[f.path])}`;
    } else {
      d.className = 'row' + (cut ? ' cut' : '');
      const detail = state.view === 'details'
        ? `<span class="sz">${f.isDir ? '—' : fmtSize(f.size)}</span><span class="dt">${f.mtime ? fmtDate(f.mtime) : ''}</span><span class="sz">${esc(f.ext || (f.isDir ? 'folder' : ''))}</span>`
        : `<span class="sz">${f.isDir ? '' : fmtSize(f.size)}</span>`;
      d.innerHTML = `<span>${iconFor(f)}</span><span class="nm">${esc(f.name)} ${tagDots(tags[f.path])}</span>${detail}`;
    }
    d.title = f.path;
    d.onclick = (e) => select(pane, f.path, e.ctrlKey || e.metaKey, e.shiftKey);
    d.ondblclick = () => openEntry(pane, f);
    d.oncontextmenu = (e) => { e.preventDefault(); select(pane, f.path, e.ctrlKey, false, true); showCtx(e.clientX, e.clientY, pane, f); };
    d.dataset.path = f.path;
    el.appendChild(d);
  }
  if (pane === 'left') renderCrumbs();
  updateStatus();
}
function tagDots(list) {
  if (!list?.length) return '';
  return ' ' + list.map((t) => `<span class="tagdot" title="${esc(t)}" style="background:${TAG_COLORS[t] || '#888'}"></span>`).join('');
}
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function select(pane, p, additive, range, forceSingle) {
  state.activePane = pane;
  document.querySelectorAll('.file-area').forEach((x) => x.classList.remove('active'));
  $(pane === 'left' ? '#files-left' : '#files-right').classList.add('active');
  const set = state.sel[pane];
  if (forceSingle) { set.clear(); set.add(p); }
  else if (range) {
    const order = state.files[pane].map((f) => f.path);
    const last = [...set].pop();
    const a = order.indexOf(last), b = order.indexOf(p);
    if (a < 0) set.add(p);
    else { const [lo, hi] = [Math.min(a, b), Math.max(a, b)]; for (let i = lo; i <= hi; i++) set.add(order[i]); }
  }
  else if (additive) { set.has(p) ? set.delete(p) : set.add(p); }
  else { set.clear(); set.add(p); }
  paintSel(pane); updateStatus(); updatePreview();
}
function paintSel(pane) {
  const el = $(pane === 'left' ? '#files-left' : '#files-right');
  el.querySelectorAll('[data-path]').forEach((n) => n.classList.toggle('sel', state.sel[pane].has(n.dataset.path)));
}

async function openEntry(pane, f) {
  if (f.isDir) { state.searchMode = false; $('#search').value = ''; await navigate(f.path, pane); }
  else { try { await window.hannah.open(f.path); } catch (e) { alert('Open failed: ' + e); } }
}

// ---------- crumbs / tabs / sidebar ----------
function renderCrumbs() {
  const dir = curPath('left');
  const c = $('#crumbs'); c.innerHTML = '';
  const mk = (label, p, cls = '') => {
    const s = document.createElement('span'); s.textContent = label; s.className = cls;
    s.onclick = () => { state.searchMode = false; $('#search').value = ''; navigate(p, 'left'); };
    c.appendChild(s);
  };
  if (isWin()) { const parts = splitPath(dir); parts.forEach((pt, i) => { const p = parts.slice(0, i + 1).join('\\').replace(/\\\\/g, '\\'); mk(i === 0 ? pt : '› ' + pt, p, i === 0 ? 'root' : ''); }); }
  else { mk(' / ', '/', 'root'); splitPath(dir).forEach((pt, i, arr) => mk('› ' + pt, '/' + arr.slice(0, i + 1).join('/'))); }
}
function renderTabs() {
  const w = $('#tabs'); w.innerHTML = '';
  for (const t of state.tabs) {
    const d = document.createElement('div');
    d.className = 'tab' + (t.id === state.activeTabId ? ' active' : '');
    const nm = t.path === '/' ? '/' : t.path.split(/[/\\]/).filter(Boolean).pop();
    d.innerHTML = `<span class="t" title="${esc(t.path)}">📁 ${esc(nm)}</span>`;
    d.onclick = async () => { state.activeTabId = t.id; state.searchMode = false; $('#search').value = ''; await renderPane('left'); renderTabs(); };
    const x = document.createElement('button'); x.className = 'x'; x.textContent = '✕';
    x.onclick = (e) => { e.stopPropagation(); if (state.tabs.length === 1) return; state.tabs = state.tabs.filter((k) => k.id !== t.id); if (state.activeTabId === t.id) state.activeTabId = state.tabs[0].id; refreshActive(); };
    d.appendChild(x); w.appendChild(d);
  }
}
async function refreshDrives() {
  const ul = $('#drives'); ul.innerHTML = '';
  try {
    const ds = await window.hannah.drives();
    for (const d of ds) {
      const li = document.createElement('li'); li.textContent = '💽 ' + d.name; li.title = d.path;
      li.onclick = () => navigate(d.path, state.activePane);
      ul.appendChild(li);
    }
  } catch { ul.innerHTML = '<li class="muted">No drives</li>'; }
}
function renderSidebar() {
  const favs = getFavs(), ul = $('#favs'); ul.innerHTML = '';
  if (!favs.length) ul.innerHTML = '<li class="muted">No favorites yet</li>';
  for (const f of favs) {
    const li = document.createElement('li');
    li.innerHTML = `<span>★ ${esc(f.name)}</span>`;
    li.title = f.path; li.onclick = () => navigate(f.path, state.activePane);
    const rm = document.createElement('button'); rm.className = 'mini'; rm.textContent = '✕';
    rm.onclick = (e) => { e.stopPropagation(); setFavs(getFavs().filter((k) => k.path !== f.path)); renderSidebar(); };
    li.appendChild(rm); ul.appendChild(li);
  }
  const tl = $('#taglist'); tl.innerHTML = '';
  for (const t of TAGS) {
    const li = document.createElement('li');
    li.innerHTML = `<span><span class="tagdot" style="background:${TAG_COLORS[t]}"></span>${t}</span>`;
    li.onclick = () => filterByTag(t);
    tl.appendChild(li);
  }
}
async function filterByTag(tag) {
  const tags = getTags();
  const paths = Object.entries(tags).filter(([, v]) => v.includes(tag)).map(([k]) => k);
  const out = [];
  for (const p of paths) { try { out.push(await window.hannah.stat(p)); } catch {} }
  state.searchMode = true; state.searchResults = out;
  await renderPane('left');
}

// ---------- preview ----------
function applyPreviewVisibility() { $('#preview').classList.toggle('hidden', !state.previewOpen); }
async function updatePreview() {
  if (!state.previewOpen) return;
  const body = $('#prev-body');
  const sel = [...(state.sel[state.activePane] || [])];
  if (!sel.length) { body.innerHTML = '<p class="muted">Select a file to preview</p>'; return; }
  const p = sel[sel.length - 1];
  let st; try { st = await window.hannah.stat(p); } catch { body.innerHTML = '<p class="muted">Unavailable</p>'; return; }
  const tags = getTags()[p] || [];
  let html = `<div class="kv"><b>Name</b><span>${esc(st.name)}</span></div>
    <div class="kv"><b>Type</b><span>${st.isDir ? 'Folder' : (st.ext || 'file')}</span></div>
    <div class="kv"><b>Size</b><span>${st.isDir ? '—' : fmtSize(st.size)}</span></div>
    <div class="kv"><b>Modified</b><span>${fmtDate(st.mtime)}</span></div>
    <div class="kv"><b>Tags</b><span>${esc(tags.join(', ') || '—')}</span></div>
    <div class="kv"><b>Path</b><span style="word-break:break-all">${esc(st.path)}</span></div>`;
  if (!st.isDir) {
    const img = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'].includes(st.ext);
    const txt = ['.txt', '.md', '.json', '.js', '.html', '.css', '.py', '.log', '.csv', '.xml', '.yml', '.yaml', '.ini', '.cfg'].includes(st.ext);
    if (img) html += `<p><img src="file://${esc(st.path)}" onerror="this.outerHTML='<p class=muted>Image preview blocked for this file.</p>'"/></p>`;
    else if (txt && st.size < 10 * 1024 * 1024) {
      try { const r = await window.hannah.readText(st.path); html += `<pre>${esc(r.text)}</pre>${r.truncated ? '<p class="muted">Truncated…</p>' : ''}`; }
      catch (e) { html += `<p class="muted">${esc(String(e))}</p>`; }
    } else html += '<p class="muted">No preview for this type. Double-click to open.</p>';
  }
  body.innerHTML = html;
}

// ---------- status / clipboard ----------
function updateStatus() {
  const pane = state.activePane;
  const files = state.files[pane] || [];
  const sel = state.sel[pane] || new Set();
  let selBytes = 0;
  for (const f of files) if (sel.has(f.path)) selBytes += f.size || 0;
  $('#status-items').textContent = `${files.length} item(s) — ${curPath(pane)}`;
  $('#status-sel').textContent = sel.size ? `${sel.size} selected (${fmtSize(selBytes)})` : '';
  $('#status-clip').textContent = state.clipboard ? `📋 ${state.clipboard.mode}: ${state.clipboard.items.length}` : '';
}
function updateStatusPlatform() { $('#status-platform').textContent = state.platform === 'win32' ? 'Windows' : 'Linux'; }

// ---------- modal ----------
let modalResolve = null;
function promptModal(title, def = '') {
  $('#modal-title').textContent = title; $('#modal-input').value = def; $('#modal-wrap').classList.remove('hidden');
  $('#modal-input').focus(); $('#modal-input').select();
  return new Promise((res) => (modalResolve = res));
}
function closeModal(v) { $('#modal-wrap').classList.add('hidden'); modalResolve?.(v); modalResolve = null; }

// ---------- context menu ----------
function showCtx(x, y, pane, f) {
  const c = $('#ctx');
  const sel = [...state.sel[pane]];
  const isDir = f?.isDir;
  c.innerHTML = `
    <div data-a="open">Open</div>
    <div data-a="show">Show in ${isWin() ? 'Explorer' : 'file manager'}</div><hr>
    <div data-a="copy">Copy</div><div data-a="cut">Cut</div>
    <div data-a="paste" style="${state.clipboard ? '' : 'opacity:.4'}">Paste here</div><hr>
    <div data-a="rename">Rename</div><div data-a="fav">★ Add folder to favorites</div>
    <div data-a="tag">🏷 Toggle tag…</div><hr>
    <div data-a="zip">🗜️ Zip selection</div><div data-a="unzip" style="${f && f.ext === '.zip' ? '' : 'opacity:.4'}">Unzip here</div><hr>
    <div data-a="del" style="color:var(--danger)">Delete (to trash)</div>`;
  c.classList.remove('hidden');
  c.style.left = Math.min(x, innerWidth - 210) + 'px'; c.style.top = Math.min(y, innerHeight - 320) + 'px';
  c.onclick = async (e) => {
    const a = e.target.dataset?.a; if (!a) return;
    c.classList.add('hidden');
    await ctxAction(a, pane, f, sel);
  };
  const hide = (e) => { if (!c.contains(e.target)) { c.classList.add('hidden'); document.removeEventListener('click', hide); } };
  setTimeout(() => document.addEventListener('click', hide), 0);
}
async function ctxAction(a, pane, f, sel) {
  const dir = curPath(pane);
  const items = sel.length ? sel : f ? [f.path] : [];
  try {
    if (a === 'open' && f) await openEntry(pane, f);
    if (a === 'show' && f) await window.hannah.showInFolder(f.path);
    if (a === 'copy') state.clipboard = { mode: 'copy', items };
    if (a === 'cut') state.clipboard = { mode: 'cut', items };
    if (a === 'paste' && state.clipboard) await doPaste(dir);
    if (a === 'rename' && f) {
      const n = await promptModal('Rename to:', f.name); if (n && n !== f.name) await window.hannah.rename(f.path, n);
    }
    if (a === 'fav') {
      const target = f?.isDir ? f.path : dir;
      const favs = getFavs();
      if (!favs.find((k) => k.path === target)) { favs.push({ name: target.split(/[/\\]/).filter(Boolean).pop(), path: target }); setFavs(favs); renderSidebar(); }
    }
    if (a === 'tag' && f) {
      const cur = new Set(getTags()[f.path] || []);
      const choice = await promptModal(`Toggle tag (${TAGS.join(', ')}) — current: ${[...cur].join(', ') || 'none'}`, TAGS[0]);
      if (choice) {
        const t = choice.trim().toLowerCase();
        if (TAGS.includes(t)) { cur.has(t) ? cur.delete(t) : cur.add(t); const all = getTags(); all[f.path] = [...cur]; setTags(all); }
      }
    }
    if (a === 'zip' && items.length) {
      const name = await promptModal('Zip name:', 'archive.zip'); if (!name) return;
      const sep = isWin() ? '\\' : '/';
      await window.hannah.zip(items, dir + sep + (name.endsWith('.zip') ? name : name + '.zip'));
    }
    if (a === 'unzip' && f) await window.hannah.unzip(f.path, dir);
    if (a === 'del' && items.length && confirm(`Move ${items.length} item(s) to trash?`)) await window.hannah.del(items);
  } catch (e) { alert('Failed: ' + e); }
  await refreshActive();
}
async function doPaste(destDir) {
  const cb = state.clipboard; if (!cb) return;
  if (cb.mode === 'copy') await window.hannah.copy(cb.items, destDir);
  else { await window.hannah.move(cb.items, destDir); state.clipboard = null; }
  await refreshActive();
}

// ---------- toolbar / events ----------
function bindUI() {
  $('#btn-back').onclick = async () => {
    if (state.activePane === 'right') { if (state.right.hi > 0) { state.right.hi--; state.right.path = state.right.history[state.right.hi]; await renderPane('right'); } }
    else { const t = activeTab(); if (t.hi > 0) { t.hi--; t.path = t.history[t.hi]; state.searchMode = false; await renderPane('left'); renderTabs(); } }
  };
  $('#btn-fwd').onclick = async () => {
    if (state.activePane === 'right') { if (state.right.hi < state.right.history.length - 1) { state.right.hi++; state.right.path = state.right.history[state.right.hi]; await renderPane('right'); } }
    else { const t = activeTab(); if (t.hi < t.history.length - 1) { t.hi++; t.path = t.history[t.hi]; await renderPane('left'); renderTabs(); } }
  };
  $('#btn-up').onclick = () => navigate(parentOf(curPath(state.activePane)), state.activePane);
  $('#btn-new-tab').onclick = () => { addTab(curPath('left')); refreshActive(); };
  $('#btn-new-folder').onclick = async () => {
    const n = await promptModal('New folder name:', 'New folder'); if (!n) return;
    try { await window.hannah.mkdir(curPath(state.activePane), n); await refreshActive(); } catch (e) { alert(e); }
  };
  $('#btn-new-file').onclick = async () => {
    const n = await promptModal('New file name:', 'new.txt'); if (!n) return;
    try { await window.hannah.mkfile(curPath(state.activePane), n); await refreshActive(); } catch (e) { alert(e); }
  };
  $('#btn-view').onclick = (e) => {
    state.view = state.view === 'grid' ? 'list' : state.view === 'list' ? 'details' : 'grid';
    e.target.textContent = state.view === 'grid' ? '⊞' : state.view === 'list' ? '☰' : '≣';
    localStorage.setItem('hf.view', state.view); refreshActive();
  };
  $('#btn-dual').onclick = () => {
    state.dual = !state.dual;
    $('#pane-right').classList.toggle('hidden', !state.dual);
    if (state.dual) navigate(curPath('left'), 'right');
  };
  $('#btn-preview').onclick = () => {
    state.previewOpen = !state.previewOpen;
    localStorage.setItem('hf.preview', state.previewOpen ? '1' : '0');
    applyPreviewVisibility(); updatePreview();
  };
  $('#btn-close-prev').onclick = () => { state.previewOpen = false; localStorage.setItem('hf.preview', '0'); applyPreviewVisibility(); };
  $('#btn-hidden').onclick = (e) => {
    state.showHidden = !state.showHidden;
    localStorage.setItem('hf.hidden', state.showHidden ? '1' : '0');
    e.target.style.opacity = state.showHidden ? 1 : 0.5; refreshActive();
  };
  $('#btn-theme').onclick = () => {
    const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('hf.theme', t); applyTheme();
  };
  $('#btn-add-fav').onclick = () => {
    const p = curPath('left'); const favs = getFavs();
    if (!favs.find((k) => k.path === p)) { favs.push({ name: p.split(/[/\\]/).filter(Boolean).pop() || p, path: p }); setFavs(favs); renderSidebar(); }
  };
  $('#btn-copy-other').onclick = async () => {
    const src = state.activePane === 'left' ? [...state.sel.left] : [...state.sel.right];
    const dst = state.activePane === 'left' ? curPath('right') : curPath('left');
    if (!src.length) return alert('Select files first (in the active pane).');
    try { await window.hannah.copy(src, dst); await refreshActive(); } catch (e) { alert(e); }
  };
  $('#btn-move-other').onclick = async () => {
    const src = state.activePane === 'left' ? [...state.sel.left] : [...state.sel.right];
    const dst = state.activePane === 'left' ? curPath('right') : curPath('left');
    if (!src.length) return alert('Select files first (in the active pane).');
    if (!confirm(`Move ${src.length} item(s)?`)) return;
    try { await window.hannah.move(src, dst); await refreshActive(); } catch (e) { alert(e); }
  };

  let searchT = null;
  $('#search').addEventListener('input', (e) => {
    clearTimeout(searchT);
    searchT = setTimeout(async () => {
      const q = e.target.value.trim();
      if (!q) { state.searchMode = false; await renderPane('left'); return; }
      state.searchMode = true;
      try { state.searchResults = await window.hannah.search(curPath('left'), q); } catch { state.searchResults = []; }
      await renderPane('left');
    }, 350);
  });

  $('#files-left').addEventListener('click', () => { state.activePane = 'left'; syncActivePane(); });
  $('#files-right').addEventListener('click', () => { state.activePane = 'right'; syncActivePane(); });
  document.addEventListener('keydown', async (e) => {
    if (!$('#modal-wrap').classList.contains('hidden')) { if (e.key === 'Enter') closeModal($('#modal-input').value); if (e.key === 'Escape') closeModal(null); return; }
    const pane = state.activePane;
    if (e.key === 'F2') { const p = [...state.sel[pane]].pop(); if (p) { const n = await promptModal('Rename to:', p.split(/[/\\]/).pop()); if (n) { await window.hannah.rename(p, n); refreshActive(); } } }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') state.clipboard = { mode: 'copy', items: [...state.sel[pane]] }, updateStatus(), paintAll();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') state.clipboard = { mode: 'cut', items: [...state.sel[pane]] }, updateStatus(), paintAll();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') { try { await doPaste(curPath(pane)); } catch (err) { alert(err); } }
    if (e.key === 'Delete') { const items = [...state.sel[pane]]; if (items.length && confirm(`Move ${items.length} item(s) to trash?`)) { await window.hannah.del(items); refreshActive(); } }
    if (e.key === 'Enter') { const p = [...state.sel[pane]].pop(); if (p) { try { const st = await window.hannah.stat(p); await openEntry(pane, st); } catch {} } }
    if (e.key === 'Backspace') navigate(parentOf(curPath(pane)), pane);
  });
  $('#modal-ok').onclick = () => closeModal($('#modal-input').value);
  $('#modal-cancel').onclick = () => closeModal(null);
}
function syncActivePane() {
  document.querySelectorAll('.pane').forEach((p) => p.classList.remove('active'));
  $(state.activePane === 'left' ? '#pane-left' : '#pane-right').classList.add('active');
  document.querySelectorAll('.file-area').forEach((x) => x.classList.remove('active'));
  $(state.activePane === 'left' ? '#files-left' : '#files-right').classList.add('active');
}
function paintAll() { paintSel('left'); paintSel('right'); }
