const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hannah', {
  info: () => ipcRenderer.invoke('app:info'),
  drives: () => ipcRenderer.invoke('fs:drives'),
  list: (dirPath, opts = {}) => ipcRenderer.invoke('fs:list', { dirPath, ...opts }),
  stat: (p) => ipcRenderer.invoke('fs:stat', p),
  exists: (p) => ipcRenderer.invoke('fs:exists', p),
  mkdir: (parent, name) => ipcRenderer.invoke('fs:mkdir', { parent, name }),
  mkfile: (parent, name) => ipcRenderer.invoke('fs:mkfile', { parent, name }),
  rename: (oldPath, newName) => ipcRenderer.invoke('fs:rename', { oldPath, newName }),
  del: (paths) => ipcRenderer.invoke('fs:delete', paths),
  copy: (sources, destDir) => ipcRenderer.invoke('fs:copy', { sources, destDir }),
  move: (sources, destDir) => ipcRenderer.invoke('fs:move', { sources, destDir }),
  readText: (filePath) => ipcRenderer.invoke('fs:read-text', { filePath }),
  search: (base, query) => ipcRenderer.invoke('fs:search', { base, query }),
  zip: (sources, outPath) => ipcRenderer.invoke('fs:zip', { sources, outPath }),
  unzip: (zipPath, destDir) => ipcRenderer.invoke('fs:unzip', { zipPath, destDir }),
  open: (p) => ipcRenderer.invoke('fs:open', p),
  showInFolder: (p) => ipcRenderer.invoke('fs:show-in-folder', p),
  pickDir: () => ipcRenderer.invoke('dialog:pick-dir'),
});
