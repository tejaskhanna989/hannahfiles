# HannahFiles

HannahFiles is a file manager for **Windows**, built on [Files](https://github.com/files-community/Files) (© Files Community, MIT licensed).

## License — GPLv3

This fork is released under the **GNU General Public License v3 or later**. See [COPYING](COPYING) for the full text.

Upstream license files are preserved as required:

- [LICENSE-MIT](LICENSE-MIT) — Files Community code (MIT). MIT permits redistribution under GPLv3 provided the copyright notice is kept.
- [LICENSE-MPL](LICENSE-MPL) — Mozilla Public License 2.0 covering some upstream files (MPL-2.0 is GPLv3-compatible).

Modifications vs upstream are tracked in git history (`DisplayName`/identity rebrand to HannahFiles, app tiles regenerated from `brand/logo.svg`-equivalent artwork, this README, `COPYING`).

## Requirements (Windows only)

> Note: Files is a WinUI 3 / Windows App SDK app. It builds and runs on **Windows only** — there is no Linux build for this codebase.

- Windows 10 version 1809 (build 17763) or later / Windows 11
- Visual Studio 2022 17.12+ with `.NET desktop development` and `Windows App SDK` workloads
- .NET SDK 10 (`global.json` pins 10.0.102, rolls forward)

## Build

1. Open `Files.slnx` in Visual Studio.
2. Set the startup project to `Files.App`, platform `x64`.
3. Press F5 to run unpackaged, or **Publish → Create App Packages** for a sideload `.msixbundle`.

Signing: sideload packages need a certificate. For dev, Visual Studio generates a test certificate automatically. For releases, sign with your own cert and update the `Publisher="CN=..."` attribute in `src/Files.App/Package.appxmanifest` to match.

CI: `.github/workflows/ci.yml` (from upstream) builds pull requests on Windows runners. The `cd-*` workflows are the upstream release pipelines and need store/sideload secrets configured to run.

## Rebrand status

- [x] App identity: `HannahFilesDev`, display name `HannahFiles` (`Package.appxmanifest`)
- [x] Tiles/icons regenerated from the HannahFiles logo (`Assets/AppTiles/{Dev,Preview,Release}`)
- [ ] In-app strings still say "Files" in places (Settings, About) — follow-up
- [ ] Default-app registration / protocol names still upstream — follow-up

## Credits

All application code © Files Community and contributors (MIT). Fork packaging, branding, and modifications © the HannahFiles contributors (GPLv3).
