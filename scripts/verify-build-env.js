#!/usr/bin/env node

/**
 * Post-build environment verification script
 * Verifies that environment variables were correctly embedded in the build
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 POST-BUILD ENVIRONMENT VERIFICATION');
console.log('=====================================');

const distPath = path.join(process.cwd(), 'dist');
const electronDistPath = path.join(process.cwd(), 'dist-electron');

// Check if build directories exist
if (!fs.existsSync(distPath)) {
  console.error('❌ dist directory not found. Build may have failed.');
  process.exit(1);
}

if (!fs.existsSync(electronDistPath)) {
  console.error('❌ dist-electron directory not found. Build may have failed.');
  process.exit(1);
}

console.log('✅ Build directories exist');

// Find and analyze main JS files
function findJSFiles(dir) {
  const files = [];
  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.js') && !item.includes('.map')) {
        files.push(fullPath);
      }
    }
  }
  traverse(dir);
  return files;
}

const jsFiles = findJSFiles(distPath);
console.log(`📁 Found ${jsFiles.length} JS files in dist`);

// Environment variables to check
const envVarsToCheck = [
  'VITE_API_BASE_URL',
  'VITE_APP_VERSION',
  'VITE_STRIPE_PRICE_ID',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_STRIPE_PRODUCT_ID'
];

console.log('\n🔍 Checking for embedded environment variables...');

const findings = {};

for (const jsFile of jsFiles) {
  try {
    const content = fs.readFileSync(jsFile, 'utf8');
    
    for (const envVar of envVarsToCheck) {
      if (!findings[envVar]) {
        findings[envVar] = {
          found: false,
          files: [],
          values: new Set()
        };
      }

      // Look for the actual values (not the variable names)
      if (envVar === 'VITE_API_BASE_URL') {
        const apiUrlMatches = content.match(/(https?:\/\/[a-zA-Z0-9.-]+(?:\.[a-zA-Z]{2,})?(?::\d+)?(?:\/[^\s"']*)?)/g);
        if (apiUrlMatches) {
          findings[envVar].found = true;
          findings[envVar].files.push(path.relative(process.cwd(), jsFile));
          apiUrlMatches.forEach(url => findings[envVar].values.add(url));
        }
      } else if (envVar === 'VITE_APP_VERSION') {
        // Look for version patterns
        const versionMatches = content.match(/(\d+\.\d+\.\d+)/g);
        if (versionMatches) {
          findings[envVar].found = true;
          findings[envVar].files.push(path.relative(process.cwd(), jsFile));
          versionMatches.forEach(version => findings[envVar].values.add(version));
        }
      } else if (envVar.includes('STRIPE')) {
        // Look for Stripe keys/IDs (redacted in output)
        const stripeMatches = content.match(/(pk_(?:test_|live_)[a-zA-Z0-9]{99,}|price_[a-zA-Z0-9]+|prod_[a-zA-Z0-9]+)/g);
        if (stripeMatches) {
          findings[envVar].found = true;
          findings[envVar].files.push(path.relative(process.cwd(), jsFile));
          findings[envVar].values.add('[REDACTED - Found in build]');
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not read ${jsFile}: ${error.message}`);
  }
}

// Report findings
console.log('\n📊 Environment Variables in Build:');
console.log('==================================');

let issuesFound = 0;

for (const [envVar, data] of Object.entries(findings)) {
  if (data.found) {
    console.log(`✅ ${envVar}:`);
    console.log(`   Values: ${Array.from(data.values).join(', ')}`);
    console.log(`   Found in: ${data.files.length} file(s)`);
  } else {
    console.log(`❌ ${envVar}: Not found in build`);
    if (envVar === 'VITE_API_BASE_URL' || envVar === 'VITE_APP_VERSION') {
      issuesFound++;
    }
  }
}

// Check package.json for version consistency
console.log('\n🔍 Version Consistency Check:');
console.log('============================');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const packageVersion = packageJson.version;
  
  if (findings.VITE_APP_VERSION.values.has(packageVersion)) {
    console.log(`✅ Package version (${packageVersion}) matches build`);
  } else {
    console.log(`⚠️  Package version (${packageVersion}) may not match build:`);
    console.log(`   Build versions found: ${Array.from(findings.VITE_APP_VERSION.values).join(', ')}`);
  }
} catch (error) {
  console.warn(`⚠️  Could not verify package.json version: ${error.message}`);
}

// Check for common issues
console.log('\n🩺 Build Issues Analysis:');
console.log('========================');

if (!findings.VITE_API_BASE_URL.found) {
  console.log('🚨 CRITICAL: No API base URL found in build');
  console.log('   This will cause API calls to fail');
  console.log('   Check your .env files and build process');
  issuesFound++;
}

if (findings.VITE_API_BASE_URL.values.has('undefined')) {
  console.log('🚨 CRITICAL: API base URL is "undefined" in build');
  console.log('   Environment variable was not properly set during build');
  issuesFound++;
}

if (Array.from(findings.VITE_API_BASE_URL.values).some(url => url.includes('localhost'))) {
  console.log('⚠️  WARNING: Build contains localhost URLs');
  console.log('   This may be intended for development builds');
}

// Final summary
console.log('\n📋 VERIFICATION SUMMARY');
console.log('======================');
console.log(`Build directory: ${distPath}`);
console.log(`JS files analyzed: ${jsFiles.length}`);
console.log(`Issues found: ${issuesFound}`);

if (issuesFound === 0) {
  console.log('✅ Environment verification passed');
  process.exit(0);
} else {
  console.log('❌ Environment verification failed');
  console.log('\n💡 Suggestions:');
  console.log('1. Check your .env files are in the correct location');
  console.log('2. Verify VITE_ prefixes on environment variables');
  console.log('3. Ensure build process loads environment files correctly');
  console.log('4. Check vite.config.ts for environment loading');
  process.exit(1);
}