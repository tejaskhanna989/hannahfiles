#!/usr/bin/env bash

# build the app
if [ "$(go env GOOS)" = "darwin" ]; then
    CGO_ENABLED=1 go build -o ./bin/hannahfiles
else
    CGO_ENABLED=0 go build -o ./bin/hannahfiles
fi
