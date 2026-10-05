# HannahFiles 🎤

A **joke** file manager for Windows **and** Linux — one repo, one project, GPLv3.
(Inspired by the legendary Hannah Montana Linux. No affiliation with Disney.)

| Platform | Location | Stack |
|----------|----------|-------|
| Windows  | [`windows/`](windows/) | WinUI 3 / Windows App SDK, based on [Files](https://github.com/files-community/Files) |
| Linux terminal | [`linux/`](linux/) | Terminal UI in Go, based on [superfile](https://github.com/yorukot/superfile) |
| Linux GUI | [`linux-gui/`](linux-gui/) | Electron, pop-star purple, Miley in the preview pane |
| Vibes    | [`wallpapers/`](wallpapers/) | Real Miley-on-stage photos. Sweet nibblets! |

## License — GPLv3

The whole project is released under the **GNU General Public License v3 or later** ([COPYING](COPYING)).

- Upstream Windows code © Files Community under MIT — attribution preserved in [`LICENSE-MIT`](LICENSE-MIT) (MIT permits GPLv3 redistribution) and [`LICENSE-MPL`](LICENSE-MPL) (MPL-2.0 is GPLv3-compatible).
- Upstream Linux code © Yorukot under MIT — attribution preserved in [`linux/LICENSE`](linux/LICENSE) and [`linux/NOTICE.md`](linux/NOTICE.md).
- See [`windows/README.md`](windows/README.md) for the Windows build, signing, and rebrand status.

## Install

- **Windows**: `HannahFiles CI — Windows` uploads a portable ZIP per push (`HannahFiles-windows-x64-portable`). Unzip and run — needs the [Windows App Runtime](https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/downloads) on the machine. (MSIX packaging is currently broken upstream-on-this-toolchain for everyone, so portable it is.)
- **Linux terminal**: push a `v*` tag for a full GoReleaser release (`.deb`, `.rpm`, `.tar.gz`); every push also uploads a snapshot to the `HannahFiles-linux-snapshot` artifact.
- **Linux GUI**: `HannahFiles CI — Linux GUI` builds an AppImage + `.deb` per push; tagged releases attach them too.

## CI

- `HannahFiles CI — Windows` builds the `windows/` tree on Windows runners and uploads the signed MSIX.
- `HannahFiles CI — Linux` builds the `linux/` tree with GoReleaser (snapshot artifacts per push, full release on `v*` tags).
