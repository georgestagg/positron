#!/usr/bin/env bash
#
# Copyright (c) Microsoft Corporation. All rights reserved.
#
realdir() {
	SOURCE=$1
	while [ -h "$SOURCE" ]; do
		DIR=$(dirname "$SOURCE")
		SOURCE=$(readlink "$SOURCE")
		[[ $SOURCE != /* ]] && SOURCE=$DIR/$SOURCE
	done
	echo "$( cd -P "$(dirname "$SOURCE")" >/dev/null 2>&1 && pwd )"
}

ROOT="$(dirname "$(dirname "$(realdir "$0")")")"

APP_NAME="@@APPNAME@@"
# --- Start Positron ---
POSITRON_VERSION="@@POSITRONVERSION@@"
BUILD_NUMBER="@@BUILDNUMBER@@"
# --- End Positron ---
VERSION="@@VERSION@@"
COMMIT="@@COMMIT@@"
EXEC_NAME="@@APPNAME@@"
CLI_SCRIPT="$ROOT/out/server-cli.js"
# --- Start Positron ---
"$ROOT/node" "$CLI_SCRIPT" "$APP_NAME" "$POSITRON_VERSION" "$BUILD_NUMBER" "$VERSION" "$COMMIT" "$EXEC_NAME" "--openExternal" "$@"
# --- End Positron ---
