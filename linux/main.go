package main

import (
	"embed"

	"github.com/tejaskhanna989/hannahfiles/linux/src/cmd"
)

var (
	//go:embed src/hannahfiles_config/*
	content embed.FS
)

func main() {
	cmd.Run(content)
}
