const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const setupIssPath = path.join(__dirname, '../desktop/installer/setup.iss');

try {
  // Read package.json version
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const version = pkg.version;

  // Format version for MyAppVersion (e.g., 1.0.0-beta -> 1.0.0-beta)
  // For Display purposes, Inno Setup handles strings well.
  
  // Read setup.iss
  let setupIssContent = fs.readFileSync(setupIssPath, 'utf-8');

  // Regex to replace MyAppVersion
  const versionRegex = /#define MyAppVersion ".*"/;
  if (versionRegex.test(setupIssContent)) {
    setupIssContent = setupIssContent.replace(versionRegex, `#define MyAppVersion "${version}"`);
  } else {
    console.error('❌ Could not find #define MyAppVersion in setup.iss');
    process.exit(1);
  }

  // Regex to replace OutputBaseFilename to include version (e.g., YT-Deluxe-Setup-v1.0.0-beta)
  const outputRegex = /OutputBaseFilename=.*$/m;
  if (outputRegex.test(setupIssContent)) {
    setupIssContent = setupIssContent.replace(outputRegex, `OutputBaseFilename=YT-Deluxe-Setup-v${version}`);
  } else {
    console.warn('⚠️ Could not find OutputBaseFilename in setup.iss (Skipping output rename)');
  }

  // Write back
  fs.writeFileSync(setupIssPath, setupIssContent, 'utf-8');
  console.log(`✅ Successfully synced setup.iss with package.json version (v${version})`);

} catch (error) {
  console.error('❌ Error syncing version:', error.message);
  process.exit(1);
}
