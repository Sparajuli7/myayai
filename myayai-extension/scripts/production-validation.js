#!/usr/bin/env node

/**
 * Production Validation Script
 * Comprehensive check before Chrome Web Store submission
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProductionValidator {
  constructor() {
    this.results = [];
    this.failed = false;
  }

  async validate() {
    console.log('🔍 Starting Production Validation...\n');

    try {
      await this.checkCodeQuality();
      await this.checkTesting();
      await this.checkPerformance();
      await this.checkAccessibility();
      await this.checkSecurity();
      await this.checkBuild();
      await this.checkManifest();
      await this.checkAssets();
      await this.checkDocumentation();

      this.printResults();
      
      if (this.failed) {
        console.log('\n❌ Production validation FAILED');
        console.log('Please fix the issues above before Chrome Web Store submission.');
        process.exit(1);
      } else {
        console.log('\n✅ Production validation PASSED');
        console.log('🎉 Extension is ready for Chrome Web Store submission!');
      }

    } catch (error) {
      console.error('Validation failed:', error.message);
      process.exit(1);
    }
  }

  async checkCodeQuality() {
    this.section('Code Quality');
    
    try {
      execSync('npm run lint', { stdio: 'pipe' });
      this.pass('ESLint', 'No linting errors');
    } catch (error) {
      this.fail('ESLint', 'Linting errors found');
    }

    try {
      execSync('npm run format:check', { stdio: 'pipe' });
      this.pass('Prettier', 'Code formatting is consistent');
    } catch (error) {
      this.fail('Prettier', 'Code formatting issues found');
    }
  }

  async checkTesting() {
    this.section('Testing Coverage');

    try {
      execSync('npm run test:all', { stdio: 'pipe' });
      this.pass('All Tests', 'All tests passing');
    } catch (error) {
      this.fail('All Tests', 'Some tests are failing');
    }

    // Check test coverage
    if (fs.existsSync('coverage/lcov-report/index.html')) {
      this.pass('Coverage Report', 'Test coverage generated');
    } else {
      this.warn('Coverage Report', 'Run npm run test:coverage to generate');
    }
  }

  async checkPerformance() {
    this.section('Performance Requirements');

    try {
      execSync('npm run performance:audit', { stdio: 'pipe' });
      this.pass('Performance Audit', 'Performance requirements met');
    } catch (error) {
      this.fail('Performance Audit', 'Performance requirements not met');
    }

    try {
      execSync('npm run size-check', { stdio: 'pipe' });
      this.pass('Bundle Size', 'Bundle size within limits');
    } catch (error) {
      this.fail('Bundle Size', 'Bundle exceeds size limits');
    }
  }

  async checkAccessibility() {
    this.section('Accessibility Compliance');

    try {
      execSync('npm run accessibility:audit', { stdio: 'pipe' });
      this.pass('Accessibility Audit', 'WCAG compliance validated');
    } catch (error) {
      this.warn('Accessibility Audit', 'Some accessibility issues found');
    }
  }

  async checkSecurity() {
    this.section('Security');

    try {
      execSync('npm run security:audit', { stdio: 'pipe' });
      this.pass('Security Audit', 'No high/critical vulnerabilities');
    } catch (error) {
      this.warn('Security Audit', 'Some vulnerabilities found');
    }

    // Check for sensitive data
    const sensitivePatterns = [
      'password',
      'secret',
      'api_key',
      'private_key',
      'token'
    ];

    let sensitiveFound = false;
    const jsFiles = this.getJSFiles();
    
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      for (const pattern of sensitivePatterns) {
        if (content.toLowerCase().includes(pattern) && !content.includes('// Safe:')) {
          sensitiveFound = true;
          break;
        }
      }
    }

    if (!sensitiveFound) {
      this.pass('Sensitive Data', 'No hardcoded secrets detected');
    } else {
      this.fail('Sensitive Data', 'Potential hardcoded secrets found');
    }
  }

  async checkBuild() {
    this.section('Build System');

    try {
      execSync('npm run build:all', { stdio: 'pipe' });
      this.pass('Build Process', 'All browser builds successful');
    } catch (error) {
      this.fail('Build Process', 'Build failed');
    }

    // Check dist directory
    if (fs.existsSync('dist/chrome') && fs.existsSync('dist/firefox')) {
      this.pass('Build Artifacts', 'Chrome and Firefox builds present');
    } else {
      this.fail('Build Artifacts', 'Missing build artifacts');
    }
  }

  async checkManifest() {
    this.section('Manifest Validation');

    const manifestPath = path.join(process.cwd(), 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      this.fail('Manifest File', 'manifest.json not found');
      return;
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Required fields
      const required = ['name', 'version', 'description', 'manifest_version'];
      for (const field of required) {
        if (!manifest[field]) {
          this.fail('Manifest Field', `Missing required field: ${field}`);
        }
      }

      // Version format
      if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
        this.fail('Version Format', 'Version must be in x.y.z format');
      } else {
        this.pass('Version Format', `Version ${manifest.version} is valid`);
      }

      // Permissions check
      if (manifest.permissions && manifest.permissions.length > 0) {
        this.pass('Permissions', `${manifest.permissions.length} permissions declared`);
      }

      this.pass('Manifest Validation', 'Manifest structure is valid');

    } catch (error) {
      this.fail('Manifest Validation', 'Invalid JSON in manifest');
    }
  }

  async checkAssets() {
    this.section('Assets & Icons');

    const requiredIcons = ['icon16.png', 'icon32.png', 'icon48.png', 'icon128.png'];
    const iconDir = path.join(process.cwd(), 'assets/icons');
    
    let missingIcons = 0;
    for (const icon of requiredIcons) {
      const iconPath = path.join(iconDir, icon);
      if (!fs.existsSync(iconPath)) {
        missingIcons++;
      }
    }

    if (missingIcons === 0) {
      this.pass('Extension Icons', 'All required icon sizes present');
    } else {
      this.fail('Extension Icons', `${missingIcons} required icons missing`);
    }

    // Check for store assets
    const storeAssets = ['screenshot1.png', 'screenshot2.png', 'promotional-tile.png'];
    const storeDir = path.join(process.cwd(), 'store-assets');
    
    if (fs.existsSync(storeDir)) {
      this.pass('Store Assets', 'Store assets directory exists');
    } else {
      this.warn('Store Assets', 'Consider creating store-assets/ directory');
    }
  }

  async checkDocumentation() {
    this.section('Documentation');

    const docs = ['README.md', 'CHANGELOG.md', 'docs/privacy-policy.html'];
    let missingDocs = 0;

    for (const doc of docs) {
      if (!fs.existsSync(doc)) {
        missingDocs++;
      }
    }

    if (missingDocs === 0) {
      this.pass('Documentation', 'All required documentation present');
    } else {
      this.warn('Documentation', `${missingDocs} documentation files missing`);
    }

    // Check README content
    if (fs.existsSync('README.md')) {
      const readme = fs.readFileSync('README.md', 'utf8');
      if (readme.includes('## Features') && readme.includes('## Installation')) {
        this.pass('README Content', 'README has proper structure');
      } else {
        this.warn('README Content', 'README could be more comprehensive');
      }
    }
  }

  getJSFiles() {
    const files = [];
    const walkDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory() && !file.includes('node_modules')) {
          walkDir(filePath);
        } else if (file.endsWith('.js') && !file.includes('test')) {
          files.push(filePath);
        }
      });
    };
    walkDir(process.cwd());
    return files;
  }

  section(title) {
    console.log(`\n📋 ${title}`);
    console.log('─'.repeat(50));
  }

  pass(test, message) {
    this.results.push({ status: 'PASS', test, message });
    console.log(`✅ ${test}: ${message}`);
  }

  fail(test, message) {
    this.results.push({ status: 'FAIL', test, message });
    console.log(`❌ ${test}: ${message}`);
    this.failed = true;
  }

  warn(test, message) {
    this.results.push({ status: 'WARN', test, message });
    console.log(`⚠️  ${test}: ${message}`);
  }

  printResults() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warned = this.results.filter(r => r.status === 'WARN').length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 Production Validation Summary');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warned}`);
    console.log(`📝 Total: ${this.results.length}`);
  }
}

if (require.main === module) {
  new ProductionValidator().validate();
}

module.exports = ProductionValidator;
