const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const os = require('os');

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'HannahFiles',
    autoHideMenuBar: true,
    backgroundColor: '#1e1e2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  if (process.argv.includes('--dev')) win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---------- helpers ----------
async function statEntry(fullPath) {
  const st = await fs.stat(fullPath);
  return {
    name: path.basename(fullPath),
    path: fullPath,
    isDir: st.isDirectory(),
    isFile: st.isFile(),
    size: st.size,
    mtime: st.mtimeMs,
    ctime: st.ctimeMs,
    ext: st.isDirectory() ? '' : path.extname(fullPath).toLowerCase(),
  };
}

async function copyRecursive(src, dest) {
  await fs.cp(src, dest, { recursive: true, errorOnExist: false });
}

// ---------- IPC ----------
ipcMain.handle('app:info', () => ({
  platform: process.platform, // 'win32' | 'linux'
  homedir: os.homedir(),
  sep: path.sep,
}));

ipcMain.handle('fs:drives', async () => {
  if (process.platform === 'win32') {
    const drives = [];
    // Probe A-Z for existing roots
    for (let c = 65; c <= 90; c++) {
      const d = String.fromCharCode(c) + ':\\';
      try {
        await fs.stat(d);
        drives.push({ name: d, path: d });
      } catch {}
    }
    return drives.length ? drives : [{ name: 'C:\\', path: 'C:\\' }];
  }
  // Linux: root, home, /media/*, /mnt/*, /run/media/$USER/*
  const roots = [{ name: 'Root (/)', path: '/' }];
  const home = os.homedir();
  roots.push({ name: `Home (${home})`, path: home });
  const candidates = ['/media', `/media/${os.userInfo().username}`, `/run/media/${os.userInfo().username}`, '/mnt'];
  for (const c of candidates) {
    try {
      const entries = await fs.readdir(c);
      for (const e of entries) {
        const p = path.join(c, e);
        try {
          const st = await fs.stat(p);
          if (st.isDirectory()) roots.push({ name: e, path: p });
        } catch {}
      }
    } catch {}
  }
  return roots;
});

ipcMain.handle('fs:list', async (_e, { dirPath, showHidden = false, sortBy = 'name', sortDir = 'asc' }) => {
  const entries = await fs.readdir(dirPath);
  const out = [];
  for (const name of entries) {
    if (!showHidden && name.startsWith('.')) continue;
    const full = path.join(dirPath, name);
    try {
      out.push(await statEntry(full));
    } catch {
      out.push({ name, path: full, isDir: false, isFile: false, size: 0, mtime: 0, error: true });
    }
  }
  const dir = sortDir === 'desc' ? -1 : 1;
  out.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1; // dirs first
    let v = 0;
    if (sortBy === 'size') v = a.size - b.size;
    else if (sortBy === 'mtime') v = a.mtime - b.mtime;
    else if (sortBy === 'type') v = a.ext.localeCompare(b.ext);
    else v = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    return v * dir;
  });
  return out;
});

ipcMain.handle('fs:stat', async (_e, p) => statEntry(p));

ipcMain.handle('fs:exists', async (_e, p) => {
  try { await fs.stat(p); return true; } catch { return false; }
});

ipcMain.handle('fs:mkdir', async (_e, { parent, name }) => {
  const p = path.join(parent, name);
  await fs.mkdir(p, { recursive: false });
  return p;
});

ipcMain.handle('fs:mkfile', async (_e, { parent, name }) => {
  const p = path.join(parent, name);
  await fs.writeFile(p, '', { flag: 'wx' });
  return p;
});

ipcMain.handle('fs:rename', async (_e, { oldPath, newName }) => {
  const np = path.join(path.dirname(oldPath), newName);
  await fs.rename(oldPath, np);
  return np;
});

ipcMain.handle('fs:delete', async (_e, paths) => {
  // Prefer OS trash, fall back to rm
  const results = [];
  for (const p of paths) {
    try {
      await shell.trashItem(p);
      results.push({ path: p, ok: true, trashed: true });
    } catch {
      try {
        await fs.rm(p, { recursive: true, force: true });
        results.push({ path: p, ok: true, trashed: false });
      } catch (err) {
        results.push({ path: p, ok: false, error: String(err) });
      }
    }
  }
  return results;
});

ipcMain.handle('fs:copy', async (_e, { sources, destDir }) => {
  for (const src of sources) {
    const dest = path.join(destDir, path.basename(src));
    if (path.resolve(src) === path.resolve(dest)) throw new Error('Source and destination are the same: ' + src);
    // prevent copying a dir into itself
    if (path.resolve(dest).startsWith(path.resolve(src) + path.sep)) throw new Error('Cannot copy a folder into itself');
    await copyRecursive(src, dest);
  }
  return true;
});

ipcMain.handle('fs:move', async (_e, { sources, destDir }) => {
  for (const src of sources) {
    const dest = path.join(destDir, path.basename(src));
    if (path.resolve(src) === path.resolve(dest)) continue;
    if (path.resolve(dest).startsWith(path.resolve(src) + path.sep)) throw new Error('Cannot move a folder into itself');
    try {
      await fs.rename(src, dest);
    } catch {
      await copyRecursive(src, dest);
      await fs.rm(src, { recursive: true, force: true });
    }
  }
  return true;
});

ipcMain.handle('fs:read-text', async (_e, { filePath, maxBytes = 200000 }) => {
  const st = await fs.stat(filePath);
  if (st.size > 10 * 1024 * 1024) throw new Error('File too large to preview (>10MB)');
  const fh = await fs.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(Math.min(st.size, maxBytes));
    await fh.read(buf, 0, buf.length, 0);
    return { size: st.size, truncated: st.size > maxBytes, text: buf.toString('utf8').slice(0, 50000) };
  } finally {
    await fh.close();
  }
});

ipcMain.handle('fs:search', async (_e, { base, query, maxResults = 200 }) => {
  const q = query.toLowerCase();
  const results = [];
  async function walk(dir, depth) {
    if (depth > 6 || results.length >= maxResults) return;
    let entries;
    try { entries = await fs.readdir(dir); } catch { return; }
    for (const name of entries) {
      if (results.length >= maxResults) return;
      const full = path.join(dir, name);
      if (name.toLowerCase().includes(q)) {
        try { results.push(await statEntry(full)); } catch {}
      }
      // recurse into dirs (skip hidden + node_modules)
      if (name.startsWith('.') || name === 'node_modules') continue;
      try {
        const st = await fs.stat(full);
        if (st.isDirectory()) await walk(full, depth + 1);
      } catch {}
    }
  }
  await walk(base, 0);
  return results;
});

ipcMain.handle('fs:zip', async (_e, { sources, outPath }) => {
  const AdmZip = require('adm-zip');
  const zip = new AdmZip();
  for (const src of sources) {
    const st = await fs.stat(src);
    if (st.isDirectory()) zip.addLocalFolder(src, path.basename(src));
    else zip.addLocalFile(src);
  }
  zip.writeZip(outPath);
  return outPath;
});

ipcMain.handle('fs:unzip', async (_e, { zipPath, destDir }) => {
  const AdmZip = require('adm-zip');
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(destDir, true);
  return destDir;
});

ipcMain.handle('fs:open', async (_e, p) => {
  const res = await shell.openPath(p);
  if (res) throw new Error(res);
  return true;
});

ipcMain.handle('fs:show-in-folder', (_e, p) => {
  shell.showItemInFolder(p);
  return true;
});

ipcMain.handle('dialog:pick-dir', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
  return r.canceled ? null : r.filePaths[0];
});
