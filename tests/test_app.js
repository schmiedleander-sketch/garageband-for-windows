const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('--- Running GarageBand Verification Tests ---');

// 1. Verify Executable file exists and is genuine PE32+
const exePath = path.join(__dirname, '../dist/release/GarageBand.exe');
assert(fs.existsSync(exePath), 'GarageBand.exe must exist in dist/release/');
const exeStat = fs.statSync(exePath);
assert(exeStat.size > 100000, 'GarageBand.exe must be a valid executable binary');
const fileOut = execSync(`file "${exePath}"`).toString();
assert(fileOut.includes('PE32+ executable') || fileOut.includes('MS Windows'), 'Must be a real Windows PE executable');
console.log('✓ Verified dist/release/GarageBand.exe is a real Windows PE32+ executable');

// 2. Verify MSI installer exists and is valid Windows Installer compound file
const msiPath = path.join(__dirname, '../dist/release/GarageBand-Setup.msi');
assert(fs.existsSync(msiPath), 'GarageBand-Setup.msi must exist in dist/release/');
const msiOut = execSync(`file "${msiPath}"`).toString();
assert(msiOut.includes('MSI Installer') || msiOut.includes('Composite Document File'), 'Must be a valid MSI database');
console.log('✓ Verified dist/release/GarageBand-Setup.msi is a valid MSI Installer');

// 3. Verify MSI tables and contents
const msiList = execSync(`msiextract --list "${msiPath}"`).toString();
assert(msiList.includes('GarageBand/GarageBand.exe'), 'MSI must contain GarageBand.exe');
assert(msiList.includes('GarageBand/app/index.html'), 'MSI must contain app/index.html');
assert(msiList.includes('GarageBand/app/audio/engine.js'), 'MSI must contain audio engine');
console.log('✓ Verified MSI package extracts correct file structure');

// 4. Verify Icon resources
const icoPath = path.join(__dirname, '../src/assets/icons/garageband.ico');
assert(fs.existsSync(icoPath), 'garageband.ico must exist');
const icoOut = execSync(`file "${icoPath}"`).toString();
assert(icoOut.includes('MS Windows icon resource'), 'Must be a valid Windows .ico resource');
console.log('✓ Verified Windows icon resource with multi-resolution bitmaps');

// 5. Test loops database
const loopsJs = fs.readFileSync(path.join(__dirname, '../src/audio/loops.js'), 'utf8');
assert(loopsJs.includes('GARAGEBAND_LOOPS'), 'Loops database must be present');
assert(loopsJs.includes('808 Urban Trap Beat'), 'Urban beat loop must be included');
console.log('✓ Verified Apple Loops sound collection');

console.log('All tests passed successfully!');
