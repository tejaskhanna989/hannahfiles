# HannahFiles

A file manager for Windows **and** Linux — one repo, one project, GPLv3.

| Platform | Location | Stack |
|----------|----------|-------|
| Windows  | [`windows/`](windows/) | WinUI 3 / Windows App SDK, based on [Files](https://github.com/files-community/Files) |
| Linux    | [`linux/`](linux/)     | Landing here soon |

## License — GPLv3

The whole project is released under the **GNU General Public License v3 or later** ([COPYING](COPYING)).

- Upstream Windows code © Files Community under MIT — attribution preserved in [`LICENSE-MIT`](LICENSE-MIT) (MIT permits GPLv3 redistribution) and [`LICENSE-MPL`](LICENSE-MPL) (MPL-2.0 is GPLv3-compatible).
- Upstream Linux code © Yorukot under MIT — attribution preserved in [`linux/LICENSE`](linux/LICENSE) and [`linux/NOTICE.md`](linux/NOTICE.md).
- See [`windows/README.md`](windows/README.md) for the Windows build, signing, and rebrand status.

## Install

- **Windows**: `HannahFiles CI — Windows` uploads a signed (self-signed cert) MSIX per push — see the workflow artifacts. Double-click to install (first install asks you to trust the certificate). Tagged releases will carry release builds.
- **Linux**: push a `v*` tag for a full GoReleaser release (`.deb`, `.rpm`, `.tar.gz`); every push also uploads a snapshot to the `HannahFiles-linux-snapshot` artifact.

## CI

- `HannahFiles CI — Windows` builds the `windows/` tree on Windows runners and uploads the signed MSIX.
- `HannahFiles CI — Linux` builds the `linux/` tree with GoReleaser (snapshot artifacts per push, full release on `v*` tags).
