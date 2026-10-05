# HannahFiles

Cross-platform file manager for **Windows and Linux** built with Electron.

## Features

- Tabs + dual-pane (⇄ copy/move between panes)
- Grid / list / details views, sorting (dirs-first), show-hidden
- Copy / cut / paste (Ctrl+C/X/V), rename (F2), delete to OS trash, new file/folder
- Recursive search in current folder
- Preview panel: text + image, file metadata
- ★ Favorites, 🏷 tags (work/personal/important/media/archive)
- 🗜️ Zip / unzip (adm-zip)
- Dark / light mode
- Windows drives (C:\…) + Linux roots (/, ~, /media, /mnt)

## Run

```bash
npm install
npm start
```

## Build installers

```bash
npm run dist:win    # .exe installer + portable (on Windows, or with wine)
npm run dist:linux  # AppImage + .deb (on Linux)
npm run dist:all    # both
```

Output goes to `dist/`.

## Stack

- Electron (main + preload bridge, no nodeIntegration in renderer)
- Plain HTML/CSS/JS, no build step
- `adm-zip` for archives

## Notes

- Delete uses OS trash first (`shell.trashItem`), falls back to permanent delete.
- Tags/favorites/theme stored in `localStorage`.
