hannahfiles() {
    os=$(uname -s)

    # Linux
    if [[ "$os" == "Linux" ]]; then
        export HF_LAST_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/hannahfiles/lastdir"
    fi

    # macOS
    if [[ "$os" == "Darwin" ]]; then
        export HF_LAST_DIR="$HOME/Library/Application Support/hannahfiles/lastdir"
    fi

    command hannahfiles "$@"

    [ ! -f "$HF_LAST_DIR" ] || {
        . "$HF_LAST_DIR"
        rm -f -- "$HF_LAST_DIR" > /dev/null
    }
}
