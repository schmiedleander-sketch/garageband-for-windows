#!/bin/bash
set -e

echo "=== Building GarageBand Windows Executable (.exe) ==="
mkdir -p dist/bundle/app

echo "1. Generating Textures & Icons with Python..."
python3 build-scripts/generate_textures.py

echo "2. Compiling Windows Resources..."
cd build-scripts
x86_64-w64-mingw32-windres resources.rc -O coff -o resources.res

echo "3. Compiling Real Native PE32+ Windows Executable..."
x86_64-w64-mingw32-gcc -mwindows -O2 -fstack-protector -o ../dist/bundle/GarageBand.exe main_launcher.c resources.res -lssp -lshlwapi -lshell32
cd ..

echo "4. Copying libssp-0.dll dependency..."
cp /usr/lib/gcc/x86_64-w64-mingw32/13-posix/libssp-0.dll dist/bundle/libssp-0.dll
cp /usr/lib/gcc/x86_64-w64-mingw32/13-posix/libssp-0.dll dist/libssp-0.dll

echo "5. Copying Web Application Assets & Shared Dependencies..."
cp -r src/* dist/bundle/app/
cp dist/bundle/GarageBand.exe dist/GarageBand.exe

echo "6. Generating portable zip package..."
cd dist/bundle
zip -r ../GarageBand-Windows-Portable.zip *
cd ../..

echo "Done! Real .exe and libssp-0.dll generated at dist/GarageBand.exe and dist/bundle/"
file dist/GarageBand.exe
file dist/bundle/libssp-0.dll
