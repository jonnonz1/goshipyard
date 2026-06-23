#!/bin/sh
# Install the shipyard CLI: detect OS/arch and download the matching binary from
# the latest GitHub release.
#
#   curl -fsSL https://raw.githubusercontent.com/jonnonz1/goshipyard/main/install.sh | sh
#
# Override the install dir with SHIPYARD_INSTALL_DIR (default /usr/local/bin).
set -eu

REPO="jonnonz1/goshipyard"
BIN="shipyard"
DEST="${SHIPYARD_INSTALL_DIR:-/usr/local/bin}"

os=$(uname -s | tr '[:upper:]' '[:lower:]')
arch=$(uname -m)
case "$os" in
  darwin | linux) ;;
  *) echo "Unsupported OS: $os" >&2; exit 1 ;;
esac
case "$arch" in
  arm64 | aarch64) arch=arm64 ;;
  x86_64 | amd64) arch=x64 ;;
  *) echo "Unsupported architecture: $arch" >&2; exit 1 ;;
esac

asset="shipyard-${os}-${arch}"
url="https://github.com/${REPO}/releases/latest/download/${asset}"

echo "Downloading ${asset} …" >&2
tmp=$(mktemp)
curl -fsSL "$url" -o "$tmp"
chmod +x "$tmp"

if [ -w "$DEST" ]; then
  mv "$tmp" "$DEST/$BIN"
else
  echo "Installing to $DEST (requires sudo) …" >&2
  sudo mv "$tmp" "$DEST/$BIN"
fi

echo "Installed $BIN → $DEST/$BIN" >&2
"$DEST/$BIN" --version
