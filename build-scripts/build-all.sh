#!/bin/bash
set -e

echo "=== Running Full GarageBand for Windows Build ==="
bash build-scripts/build-exe.sh
bash build-scripts/build-msi.sh

echo "=== Packaging Release Artifacts ==="
mkdir -p dist/release
cp dist/GarageBand.exe dist/release/
cp dist/bundle/libssp-0.dll dist/release/
cp dist/GarageBand-Setup.msi dist/release/
cp dist/GarageBand.msi dist/release/
cp dist/GarageBand-Windows-Portable.zip dist/release/

echo "Build complete! Release artifacts in dist/release/:"
ls -lh dist/release/
