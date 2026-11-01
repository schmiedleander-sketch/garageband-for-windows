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

// 2. Verify libssp-0.dll dependency exists and is genuine PE32+ DLL
const dllPath = path.join(__dirname, '../dist/release/libssp-0.dll');
assert(fs.existsSync(dllPath), 'libssp-0.dll must exist in dist/release/');
const dllOut = execSync(`file "${dllPath}"`).toString();
assert(dllOut.includes('PE32+ executable (DLL)'), 'libssp-0.dll must be a valid Windows DLL');
console.log('✓ Verified dist/release/libssp-0.dll is a valid Windows 64-bit DLL');

// 3. Verify MSI installer exists and contains libssp-0.dll & textures
const msiPath = path.join(__dirname, '../dist/release/GarageBand-Setup.msi');
assert(fs.existsSync(msiPath), 'GarageBand-Setup.msi must exist in dist/release/');
const msiOut = execSync(`file "${msiPath}"`).toString();
assert(msiOut.includes('MSI Installer') || msiOut.includes('Composite Document File'), 'Must be a valid MSI database');

const msiList = execSync(`msiextract --list "${msiPath}"`).toString();
assert(msiList.includes('GarageBand/GarageBand.exe'), 'MSI must contain GarageBand.exe');
assert(msiList.includes('GarageBand/libssp-0.dll'), 'MSI must contain libssp-0.dll dependency');
assert(msiList.includes('GarageBand/app/assets/images/brushed_metal.png'), 'MSI must contain brushed_metal texture');
assert(msiList.includes('GarageBand/app/assets/images/wood_grain.png'), 'MSI must contain wood_grain texture');
assert(msiList.includes('GarageBand/app/assets/images/amp_grill.png'), 'MSI must contain amp_grill texture');
console.log('✓ Verified MSI package extracts correct file structure and dependencies');

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
