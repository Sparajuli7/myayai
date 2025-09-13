#!/usr/bin/env node

/**
 * Pack Extension Script
 * Creates distribution packages for browser extension stores
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class ExtensionPacker {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distDir = path.join(this.projectRoot, 'dist');
    this.packagesDir = path.join(this.distDir, 'packages');
    this.packageJson = this.loadPackageJson();
    
    this.storeConfigs = {
      chrome: {
        name: 'Chrome Web Store',
        filename: 'myayai-chrome-{version}.zip',
        excludes: ['*.map', '*.md', '.DS_Store', 'Thumbs.db'],
        maxSize: 134217728, // 128MB
        requirements: ['manifest.json', 'icons']
      },
      firefox: {
        name: 'Firefox Add-ons (AMO)',
        filename: 'myayai-firefox-{version}.zip',
        excludes: ['*.map', '*.md', '.DS_Store', 'Thumbs.db'],
        maxSize: 209715200, // 200MB
        requirements: ['manifest.json', 'icons'],
        validation: 'web-ext lint'
      },
      edge: {
        name: 'Microsoft Edge Add-ons',
        filename: 'myayai-edge-{version}.zip',
        excludes: ['*.map', '*.md', '.DS_Store', 'Thumbs.db'],
        maxSize: 134217728, // 128MB
        requirements: ['manifest.json', 'icons'],
        alias: 'chrome' // Uses Chrome build
      },
      opera: {
        name: 'Opera Add-ons',
        filename: 'myayai-opera-{version}.zip',
        excludes: ['*.map', '*.md', '.DS_Store', 'Thumbs.db'],
        maxSize: 134217728, // 128MB
        requirements: ['manifest.json', 'icons'],
        alias: 'chrome'
      }
    };
  }

  async packAll(options = {}) {
    console.log('📦 Packing MyAyAI Extension for distribution...\n');
    
    const browsers = options.browsers || this.getAvailableBuilds();
    const results = {
      successful: [],
      failed: [],
      startTime: Date.now()
    };

    // Ensure packages directory exists
    this.ensurePackagesDir();
    
    for (const browser of browsers) {
      try {
        const result = await this.packBrowser(browser, options);
        results.successful.push(result);
        console.log(`✅ ${this.storeConfigs[browser].name} package created`);
      } catch (error) {
        results.failed.push({ browser, error: error.message });
        console.error(`❌ Failed to pack ${browser}:`, error.message);
      }
      console.log('');
    }

    this.displaySummary(results);
    return results;
  }

  async packBrowser(browser, options = {}) {
    const config = this.storeConfigs[browser];
    if (!config) {
      throw new Error(`Unknown browser: ${browser}`);
    }

    console.log(`📦 Packing for ${config.name}...`);
    
    // Use alias build if specified
    const sourceBrowser = config.alias || browser;
    const buildDir = path.join(this.distDir, sourceBrowser);
    
    // Verify build exists
    if (!fs.existsSync(buildDir)) {
      throw new Error(`Build directory not found: ${buildDir}. Run build first.`);
    }

    // Validate build
    await this.validateBuild(buildDir, browser);
    
    // Create package
    const packageInfo = await this.createPackage(buildDir, browser, options);
    
    // Validate package
    await this.validatePackage(packageInfo.path, browser);
    
    console.log(`   📊 Size: ${this.formatBytes(packageInfo.size)}`);
    console.log(`   📁 Path: ${packageInfo.relativePath}`);
    
    return packageInfo;
  }

  async validateBuild(buildDir, browser) {
    const config = this.storeConfigs[browser];
    
    // Check required files
    for (const requirement of config.requirements) {
      if (requirement === 'icons') {
        const iconsDir = path.join(buildDir, 'assets', 'icons');
        if (!fs.existsSync(iconsDir)) {
          throw new Error(`Icons directory not found: ${iconsDir}`);
        }
        
        // Check for required icon sizes
        const requiredSizes = ['16', '48', '128'];
        for (const size of requiredSizes) {
          const iconPath = path.join(iconsDir, `icon${size}.png`);
          if (!fs.existsSync(iconPath)) {
            throw new Error(`Missing required icon: icon${size}.png`);
          }
        }
      } else {
        const filePath = path.join(buildDir, requirement);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Required file not found: ${requirement}`);
        }
      }
    }

    // Browser-specific validation
    if (browser === 'firefox' && config.validation) {
      try {
        execSync(`npx ${config.validation} --source-dir="${buildDir}" --warnings-as-errors`, {
          cwd: this.projectRoot,
          stdio: 'pipe'
        });
        console.log('   ✅ Firefox validation passed');
      } catch (error) {
        // Allow warnings but log them
        if (error.stderr && error.stderr.includes('WARNING')) {
          console.log('   ⚠️  Firefox validation warnings detected');
        } else {
          throw new Error(`Firefox validation failed: ${error.message}`);
        }
      }
    }
  }

  async createPackage(buildDir, browser, options = {}) {
    const config = this.storeConfigs[browser];
    const version = options.version || this.packageJson.version;
    const filename = config.filename.replace('{version}', version);
    const packagePath = path.join(this.packagesDir, filename);
    
    // Remove existing package
    if (fs.existsSync(packagePath)) {
      fs.unlinkSync(packagePath);
    }
    
    // Create zip command with exclusions
    const excludePattern = config.excludes.map(pattern => `-x "${pattern}"`).join(' ');
    const zipCommand = `cd "${buildDir}" && zip -r "${packagePath}" . ${excludePattern}`;
    
    try {
      execSync(zipCommand, { 
        cwd: this.projectRoot, 
        stdio: options.verbose ? 'inherit' : 'pipe' 
      });
    } catch (error) {
      throw new Error(`Failed to create zip package: ${error.message}`);
    }
    
    const stats = fs.statSync(packagePath);
    const hash = await this.calculateHash(packagePath);
    
    return {
      browser,
      filename,
      path: packagePath,
      relativePath: path.relative(this.projectRoot, packagePath),
      size: stats.size,
      hash,
      created: new Date().toISOString()
    };
  }

  async validatePackage(packagePath, browser) {
    const config = this.storeConfigs[browser];
    const stats = fs.statSync(packagePath);
    
    // Check file size
    if (stats.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / 1024 / 1024);
      const actualSizeMB = Math.round(stats.size / 1024 / 1024);
      throw new Error(
        `Package too large for ${config.name}. ` +
        `Maximum: ${maxSizeMB}MB, Actual: ${actualSizeMB}MB`
      );
    }
    
    // Test zip integrity
    try {
      execSync(`unzip -t "${packagePath}"`, { 
        stdio: 'pipe' 
      });
    } catch (error) {
      throw new Error(`Package integrity check failed: ${error.message}`);
    }
    
    console.log('   ✅ Package validation passed');
  }

  async calculateHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  getAvailableBuilds() {
    if (!fs.existsSync(this.distDir)) {
      return [];
    }
    
    return fs.readdirSync(this.distDir)
      .filter(item => {
        const itemPath = path.join(this.distDir, item);
        return fs.statSync(itemPath).isDirectory() && 
               item !== 'packages' &&
               this.storeConfigs[item];
      });
  }

  ensurePackagesDir() {
    if (!fs.existsSync(this.packagesDir)) {
      fs.mkdirSync(this.packagesDir, { recursive: true });
    }
  }

  loadPackageJson() {
    const packagePath = path.join(this.projectRoot, 'package.json');
    return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  displaySummary(results) {
    const totalTime = Date.now() - results.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📦 PACKAGING SUMMARY');
    console.log('='.repeat(60));
    
    if (results.successful.length > 0) {
      console.log(`\n✅ Successful packages: ${results.successful.length}`);
      results.successful.forEach(pkg => {
        console.log(`   • ${this.storeConfigs[pkg.browser].name}`);
        console.log(`     📁 ${pkg.filename} (${this.formatBytes(pkg.size)})`);
        console.log(`     🔒 SHA256: ${pkg.hash.substring(0, 16)}...`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log(`\n❌ Failed packages: ${results.failed.length}`);
      results.failed.forEach(fail => {
        console.log(`   • ${this.storeConfigs[fail.browser].name}: ${fail.error}`);
      });
    }
    
    console.log(`\n⏱️  Total packaging time: ${totalTime}ms`);
    console.log(`📁 Packages directory: ${path.relative(this.projectRoot, this.packagesDir)}`);
    
    // Store submission URLs
    console.log('\n📝 Store Submission URLs:');
    console.log('   • Chrome Web Store: https://chrome.google.com/webstore/devconsole/');
    console.log('   • Firefox Add-ons: https://addons.mozilla.org/developers/');
    console.log('   • Edge Add-ons: https://partner.microsoft.com/dashboard/microsoftedge/');
    console.log('   • Opera Add-ons: https://addons.opera.com/developer/');
    
    console.log('\n' + '='.repeat(60));
  }

  // Generate submission checklist
  generateSubmissionChecklist(browser) {
    const checklists = {
      chrome: [
        'Extension package under 128MB',
        'All required icons present (16, 48, 128)',
        'Privacy policy URL set if using permissions',
        'Screenshots prepared (1280x800 or 640x400)',
        'Store description ready',
        'Chrome Web Store developer account verified'
      ],
      firefox: [
        'Extension package under 200MB',
        'All required icons present (16, 48, 128)',
        'Source code submitted if minified',
        'Privacy policy ready if collecting data',
        'AMO developer account created',
        'Extension validated with web-ext lint'
      ]
    };

    return checklists[browser] || [];
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--browsers':
        options.browsers = args[++i].split(',');
        break;
      case '--version':
        options.version = args[++i];
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--checklist':
        options.checklist = args[++i] || 'all';
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node pack-extension.js [options]

Options:
  --browsers <list>    Comma-separated list of browsers to pack
  --version <version>  Override version number
  --verbose, -v        Verbose output
  --checklist <browser> Show submission checklist for browser
  --help, -h           Show this help message

Examples:
  node pack-extension.js                    # Pack all available builds
  node pack-extension.js --browsers chrome,firefox
  node pack-extension.js --checklist chrome
        `);
        process.exit(0);
        break;
    }
  }
  
  const packer = new ExtensionPacker();
  
  // Show checklist if requested
  if (options.checklist) {
    if (options.checklist === 'all') {
      Object.keys(packer.storeConfigs).forEach(browser => {
        console.log(`\n📋 ${packer.storeConfigs[browser].name} Submission Checklist:`);
        packer.generateSubmissionChecklist(browser).forEach(item => {
          console.log(`   □ ${item}`);
        });
      });
    } else {
      console.log(`\n📋 ${packer.storeConfigs[options.checklist].name} Submission Checklist:`);
      packer.generateSubmissionChecklist(options.checklist).forEach(item => {
        console.log(`   □ ${item}`);
      });
    }
    process.exit(0);
  }
  
  try {
    const results = await packer.packAll(options);
    
    if (results.failed.length === 0) {
      console.log('🎉 All packages created successfully!');
      process.exit(0);
    } else {
      console.log('⚠️  Some packages failed. Check the summary above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Packaging failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ExtensionPacker;
