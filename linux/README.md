# HannahFiles for Linux

HannahFiles for Linux is a **joke** fancy terminal file manager (GPLv3), based on [superfile](https://github.com/yorukot/superfile) (© Yorukot, MIT — see [LICENSE](LICENSE), [NOTICE.md](NOTICE.md)).

Binary name: `hannahfiles`. Config lives in `~/.config/hannahfiles`.

## Install (from CI)

- **Tagged releases** (`v*`): download the `.deb`, `.rpm`, or `.tar.gz` from the GitHub release, or install the MSIX-equivalent below for Windows.
- **Every push**: snapshot `tar.gz` + packages are in the `HannahFiles-linux-snapshot` workflow artifact.

Install the `.deb` with `sudo dpkg -i hannahfiles_*.deb` (or the `.rpm` with your package manager).

## Build from source

Requirements: Go 1.26+ (see `go.mod`).

```bash
cd linux
go build -o ./bin/hannahfiles .
./bin/hannahfiles
```

`dev.sh` (`make dev`) is the upstream dev entrypoint (tests + build).

## Rename status (vs upstream superfile)

- [x] Go module: `github.com/tejaskhanna989/hannahfiles/linux`
- [x] Binary: `hannahfiles` (was `spf`)
- [x] Config/cache/data/state dirs: `~/.config/hannahfiles` etc. (were `superfile`)
- [x] CLI name, help text, log file, shell integration (`cd_on_quit`), VHS tapes, testsuite
- [x] `.desktop` entry, AppStream metainfo (ID `io.github.tejaskhanna989.hannahfiles`, license `GPL-3.0-only`), app icon
- [x] Update-check URLs point at this repo's releases
- [x] Version injected at release time via ldflags (`src/config.CurrentVersion`)
- [ ] Upstream `README`/docs inside this folder were replaced by this file — full docs TBD
