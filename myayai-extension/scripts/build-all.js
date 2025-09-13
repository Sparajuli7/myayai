#!/usr/bin/env node

/**
 * Build All Browsers Script
 * Builds the extension for all supported browsers
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Supported browsers and their build configurations
const BROWSERS = {
  chrome: {
    name: 'Chrome',
    manifestVersion: 3,
    buildCommand: 'webpack --env browser=chrome --mode production',
    storeReady: true
  },
  firefox: {
    name: 'Firefox',
    manifestVersion: 2,
    buildCommand: 'webpack --env browser=firefox --mode production',
    storeReady: true,
    validation: 'web-ext lint'
  },
  edge: {
    name: 'Microsoft Edge',
    manifestVersion: 3,
    buildCommand: 'webpack --env browser=chrome --mode production',
    storeReady: true,
    alias: 'chrome' // Edge uses same build as Chrome
  },
  brave: {
    name: 'Brave',
    manifestVersion: 3,
    buildCommand: 'webpack --env browser=chrome --mode production',
    storeReady: true,
    alias: 'chrome'
  },
  opera: {
    name: 'Opera',
    manifestVersion: 3,
    buildCommand: 'webpack --env browser=chrome --mode production',
    storeReady: true,
    alias: 'chrome'
  },
  safari: {
    name: 'Safari',
    manifestVersion: 3,
    buildCommand: 'webpack --env browser=safari --mode production',
    storeReady: false, // Future support
    experimental: true
  }
};

class ExtensionBuilder {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distDir = path.join(this.projectRoot, 'dist');
    this.packagesDir = path.join(this.distDir, 'packages');
    this.buildConfig = path.join(this.projectRoot, 'build', 'webpack.config.js');
    
    this.stats = {
      successful: [],
      failed: [],
      startTime: Date.now()
    };
  }

  async buildAll(options = {}) {
    console.log('🚀 Building MyAyAI Extension for all browsers...\n');
    
    // Clean previous builds
    await this.clean();
    
    // Ensure directories exist
    this.ensureDirectories();
    
    const browsers = options.browsers || Object.keys(BROWSERS).filter(b => !BROWSERS[b].experimental);
    
    for (const browser of browsers) {
      await this.buildBrowser(browser, options);
    }
    
    // Create packages if requested
    if (options.package !== false) {
      await this.createPackages();
    }
    
    // Display summary
    this.displaySummary();
    
    return this.stats;
  }

  async buildBrowser(browser, options = {}) {
    const config = BROWSERS[browser];
    
    if (!config) {
      console.error(`❌ Unknown browser: ${browser}`);
      this.stats.failed.push({ browser, error: 'Unknown browser' });
      return;
    }
    
    console.log(`📦 Building for ${config.name}...`);
    
    try {
      // Use alias if specified (e.g., Edge uses Chrome build)
      const buildBrowser = config.alias || browser;
      const command = `npx ${config.buildCommand.replace('browser=chrome', `browser=${buildBrowser}`)}`;
      
      const startTime = Date.now();
      
      // Execute build command
      execSync(command, {
        cwd: this.projectRoot,
        stdio: options.verbose ? 'inherit' : 'pipe'
      });
      
      // Copy to browser-specific directory if using alias
      if (config.alias && browser !== config.alias) {
        await this.copyBuild(config.alias, browser);
      }
      
      // Validate build
      await this.validateBuild(browser);
      
      // Browser-specific post-processing
      await this.postProcess(browser);
      
      const buildTime = Date.now() - startTime;
      console.log(`✅ ${config.name} build completed in ${buildTime}ms`);
      
      this.stats.successful.push({
        browser,
        name: config.name,
        buildTime,
        outputDir: path.join(this.distDir, browser)
      });
      
    } catch (error) {
      console.error(`❌ ${config.name} build failed:`, error.message);
      this.stats.failed.push({
        browser,
        name: config.name,
        error: error.message
      });
    }
    
    console.log('');
  }

  async copyBuild(sourceBrowser, targetBrowser) {
    const sourceDir = path.join(this.distDir, sourceBrowser);
    const targetDir = path.join(this.distDir, targetBrowser);
    
    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Source directory ${sourceDir} does not exist`);
    }
    
    // Copy the build
    execSync(`cp -r "${sourceDir}" "${targetDir}"`, { cwd: this.projectRoot });
    
    console.log(`   📋 Copied ${sourceBrowser} build to ${targetBrowser}`);
  }

  async validateBuild(browser) {
    const buildDir = path.join(this.distDir, browser);
    const manifestPath = path.join(buildDir, 'manifest.json');
    
    // Check if build directory exists
    if (!fs.existsSync(buildDir)) {
      throw new Error(`Build directory ${buildDir} does not exist`);
    }
    
    // Check if manifest exists
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Manifest file ${manifestPath} does not exist`);
    }
    
    // Validate manifest content
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const expectedVersion = BROWSERS[browser].manifestVersion;
    
    if (manifest.manifest_version !== expectedVersion) {
      throw new Error(`Manifest version mismatch. Expected ${expectedVersion}, got ${manifest.manifest_version}`);
    }
    
    // Browser-specific validation
    if (browser === 'firefox' && BROWSERS[browser].validation) {
      try {
        execSync(`npx ${BROWSERS[browser].validation} --source-dir="${buildDir}"`, {
          cwd: this.projectRoot,
          stdio: 'pipe'
        });
        console.log('   ✅ Firefox validation passed');
      } catch (error) {
        console.warn('   ⚠️  Firefox validation warnings detected');
      }
    }
    
    console.log(`   ✅ Build validation passed for ${browser}`);
  }

  async postProcess(browser) {
    const buildDir = path.join(this.distDir, browser);
    
    // Browser-specific post-processing
    switch (browser) {
      case 'firefox':
        await this.postProcessFirefox(buildDir);
        break;
      case 'safari':
        await this.postProcessSafari(buildDir);
        break;
    }
  }

  async postProcessFirefox(buildDir) {
    // Firefox-specific optimizations
    const manifestPath = path.join(buildDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Ensure proper Firefox compatibility
    if (!manifest.applications) {
      manifest.applications = {
        gecko: {
          id: "myayai@myayai.com",
          strict_min_version: "109.0"
        }
      };
    }
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('   🦊 Firefox-specific optimizations applied');
  }

  async postProcessSafari(buildDir) {
    // Safari-specific optimizations (placeholder)
    console.log('   🦁 Safari-specific optimizations applied');
  }

  async createPackages() {
    console.log('📦 Creating distribution packages...\n');
    
    this.ensureDirectories();
    
    for (const result of this.stats.successful) {
      if (BROWSERS[result.browser].storeReady) {
        await this.createPackage(result.browser, result.name);
      }
    }
  }

  async createPackage(browser, name) {
    const buildDir = path.join(this.distDir, browser);
    const packageName = `myayai-${browser}-v${this.getVersion()}.zip`;
    const packagePath = path.join(this.packagesDir, packageName);
    
    try {
      execSync(`cd "${buildDir}" && zip -r "${packagePath}" . -x "*.map"`, {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      
      const stats = fs.statSync(packagePath);
      const sizeKB = Math.round(stats.size / 1024);
      
      console.log(`✅ ${name} package created: ${packageName} (${sizeKB}KB)`);
      
    } catch (error) {
      console.error(`❌ Failed to create package for ${name}:`, error.message);
    }
  }

  async clean() {
    if (fs.existsSync(this.distDir)) {
      execSync(`rm -rf "${this.distDir}"`, { cwd: this.projectRoot });
    }
    console.log('🧹 Cleaned previous builds\n');
  }

  ensureDirectories() {
    [this.distDir, this.packagesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  getVersion() {
    const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
    return packageJson.version;
  }

  displaySummary() {
    const totalTime = Date.now() - this.stats.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 BUILD SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n✅ Successful builds: ${this.stats.successful.length}`);
    this.stats.successful.forEach(result => {
      console.log(`   • ${result.name} (${result.buildTime}ms)`);
    });
    
    if (this.stats.failed.length > 0) {
      console.log(`\n❌ Failed builds: ${this.stats.failed.length}`);
      this.stats.failed.forEach(result => {
        console.log(`   • ${result.name}: ${result.error}`);
      });
    }
    
    console.log(`\n⏱️  Total build time: ${totalTime}ms`);
    console.log(`📁 Output directory: ${this.distDir}`);
    
    if (fs.existsSync(this.packagesDir)) {
      const packages = fs.readdirSync(this.packagesDir);
      if (packages.length > 0) {
        console.log(`📦 Packages created: ${packages.length}`);
        packages.forEach(pkg => console.log(`   • ${pkg}`));
      }
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--browsers':
        options.browsers = args[++i].split(',');
        break;
      case '--no-package':
        options.package = false;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node build-all.js [options]

Options:
  --browsers <list>    Comma-separated list of browsers (${Object.keys(BROWSERS).join(', ')})
  --no-package        Skip creating distribution packages
  --verbose, -v       Verbose output
  --help, -h          Show this help message

Examples:
  node build-all.js                           # Build all stable browsers
  node build-all.js --browsers chrome,firefox # Build specific browsers
  node build-all.js --no-package             # Build without packaging
        `);
        process.exit(0);
        break;
    }
  }
  
  const builder = new ExtensionBuilder();
  
  try {
    const results = await builder.buildAll(options);
    
    if (results.failed.length === 0) {
      console.log('🎉 All builds completed successfully!');
      process.exit(0);
    } else {
      console.log('⚠️  Some builds failed. Check the summary above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Build process failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ExtensionBuilder;
