# HannahFiles

A file manager for Windows **and** Linux — one repo, one project, GPLv3.

| Platform | Location | Stack |
|----------|----------|-------|
| Windows  | [`windows/`](windows/) | WinUI 3 / Windows App SDK, based on [Files](https://github.com/files-community/Files) |
| Linux    | [`linux/`](linux/)     | Landing here soon |

## License — GPLv3

The whole project is released under the **GNU General Public License v3 or later** ([COPYING](COPYING)).

- Upstream Windows code © Files Community under MIT — attribution preserved in [`LICENSE-MIT`](LICENSE-MIT) (MIT permits GPLv3 redistribution) and [`LICENSE-MPL`](LICENSE-MPL) (MPL-2.0 is GPLv3-compatible).
- See [`windows/README.md`](windows/README.md) for the Windows build, signing, and rebrand status.

## CI

- `HannahFiles CI — Windows` builds the `windows/` tree on Windows runners and uploads the unsigned MSIX.
- Linux CI will be added alongside the Linux code.
