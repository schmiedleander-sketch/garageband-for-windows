#!/bin/bash
set -e

echo "=== Building GarageBand Windows Installer (.msi) ==="
mkdir -p dist

wixl -v -o dist/GarageBand-Setup.msi installer/GarageBand.wxs
cp dist/GarageBand-Setup.msi dist/GarageBand.msi

echo "MSI built successfully at dist/GarageBand-Setup.msi and dist/GarageBand.msi"
file dist/GarageBand-Setup.msi
msiinfo suminfo dist/GarageBand-Setup.msi
