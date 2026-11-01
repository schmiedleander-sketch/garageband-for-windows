#!/bin/bash
set -e

echo "=== Building GarageBand Windows Executable (.exe) ==="
mkdir -p dist/bundle/app

echo "1. Generating Resources & Icons..."
node build-scripts/generate-icons.js
cd build-scripts
x86_64-w64-mingw32-windres resources.rc -O coff -o resources.res

echo "2. Compiling Real Native PE32+ Windows Executable..."
x86_64-w64-mingw32-gcc -mwindows -O2 -static -o ../dist/bundle/GarageBand.exe main_launcher.c resources.res -lshlwapi -lshell32
cd ..

echo "3. Copying Web Application Assets & Shared Dependencies..."
cp -r src/* dist/bundle/app/
cp dist/bundle/GarageBand.exe dist/GarageBand.exe

echo "4. Generating portable zip package..."
cd dist/bundle
zip -r ../GarageBand-Windows-Portable.zip *
cd ../..

echo "Done! Real .exe generated at dist/GarageBand.exe and dist/bundle/GarageBand.exe"
file dist/GarageBand.exe
