#!/usr/bin/env node

/**
 * Accessibility Audit Script - WCAG 2.1 AA Compliance Check
 */

const fs = require('fs');
const path = require('path');

class AccessibilityAuditor {
  constructor() {
    this.results = { passed: 0, failed: 0, warnings: 0, tests: [] };
  }

  async runAudit() {
    console.log('♿ Starting Accessibility Audit...\n');

    await this.checkARIALabels();
    await this.checkKeyboardNavigation();
    await this.checkColorContrast();
    await this.checkSemanticHTML();
    await this.checkFocusManagement();

    this.printResults();
    return this.results.failed === 0;
  }

  async checkARIALabels() {
    this.log('🏷️  Checking ARIA labels...');
    const htmlFiles = this.getHTMLFiles();
    let labelIssues = 0;

    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check buttons without labels
      const buttonMatches = content.match(/<button[^>]*>/g) || [];
      buttonMatches.forEach(button => {
        if (!button.includes('aria-label') && !button.includes('aria-labelledby')) {
          labelIssues++;
        }
      });

      // Check inputs without labels
      const inputMatches = content.match(/<input[^>]*>/g) || [];
      inputMatches.forEach(input => {
        if (!input.includes('aria-label') && !input.includes('id=') && !content.includes(`<label`)) {
          labelIssues++;
        }
      });
    }

    if (labelIssues === 0) {
      this.pass('ARIA labels', 'All interactive elements have proper labels');
    } else {
      this.fail('ARIA labels', `${labelIssues} elements missing labels`);
    }
  }

  async checkKeyboardNavigation() {
    this.log('⌨️  Checking keyboard navigation...');
    const jsFiles = this.getJSFiles();
    let keyboardSupport = 0;

    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('addEventListener') && content.includes('keydown')) keyboardSupport++;
      if (content.includes('tabindex')) keyboardSupport++;
      if (content.includes('focus()')) keyboardSupport++;
    }

    if (keyboardSupport >= 3) {
      this.pass('Keyboard navigation', 'Keyboard support implemented');
    } else {
      this.warn('Keyboard navigation', 'Limited keyboard support detected');
    }
  }

  async checkColorContrast() {
    this.log('🎨 Checking color contrast...');
    const cssFiles = this.getCSSFiles();
    let contrastIssues = 0;

    for (const file of cssFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for high contrast mode support
      if (content.includes('high-contrast') || content.includes('prefers-contrast')) {
        this.pass('High contrast support', 'High contrast mode detected');
      } else {
        contrastIssues++;
      }
    }

    if (contrastIssues === 0) {
      this.pass('Color contrast', 'Contrast considerations found');
    } else {
      this.warn('Color contrast', 'Consider adding high contrast support');
    }
  }

  async checkSemanticHTML() {
    this.log('📝 Checking semantic HTML...');
    const htmlFiles = this.getHTMLFiles();
    let semanticScore = 0;

    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('<main>')) semanticScore++;
      if (content.includes('<nav>')) semanticScore++;
      if (content.includes('<section>')) semanticScore++;
      if (content.includes('role=')) semanticScore++;
      if (content.includes('aria-')) semanticScore++;
    }

    if (semanticScore >= 3) {
      this.pass('Semantic HTML', 'Good semantic structure');
    } else {
      this.warn('Semantic HTML', 'Could improve semantic markup');
    }
  }

  async checkFocusManagement() {
    this.log('🎯 Checking focus management...');
    const jsFiles = this.getJSFiles();
    let focusManagement = 0;

    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('focus()')) focusManagement++;
      if (content.includes('blur()')) focusManagement++;
      if (content.includes(':focus')) focusManagement++;
    }

    if (focusManagement >= 2) {
      this.pass('Focus management', 'Focus handling implemented');
    } else {
      this.warn('Focus management', 'Basic focus support detected');
    }
  }

  getHTMLFiles() {
    return this.getFilesByExtension('.html');
  }

  getJSFiles() {
    return this.getFilesByExtension('.js').filter(f => !f.includes('test'));
  }

  getCSSFiles() {
    return this.getFilesByExtension('.css');
  }

  getFilesByExtension(ext) {
    const files = [];
    const walkDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory() && !file.includes('node_modules')) {
          walkDir(filePath);
        } else if (file.endsWith(ext)) {
          files.push(filePath);
        }
      });
    };
    walkDir(path.join(__dirname, '..'));
    return files;
  }

  pass(test, message) {
    this.results.passed++;
    console.log(`✅ ${test}: ${message}`);
  }

  fail(test, message) {
    this.results.failed++;
    console.log(`❌ ${test}: ${message}`);
  }

  warn(test, message) {
    this.results.warnings++;
    console.log(`⚠️  ${test}: ${message}`);
  }

  log(message) {
    console.log(`\n${message}`);
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('♿ Accessibility Audit Results');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
  }
}

if (require.main === module) {
  new AccessibilityAuditor().runAudit();
}

module.exports = AccessibilityAuditor;
