function hf
    set os $(uname -s)

    if test "$os" = "Linux"
        set hf_last_dir "$HOME/.local/state/hannahfiles/lastdir"
    end

    if test "$os" = "Darwin"
        set hf_last_dir "$HOME/Library/Application Support/hannahfiles/lastdir"
    end

    command hannahfiles $argv

    if test -f "$hf_last_dir"
        source "$hf_last_dir"
        rm -f -- "$hf_last_dir" >> /dev/null
    end
end
