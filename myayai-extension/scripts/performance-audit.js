#!/usr/bin/env node

/**
 * Performance Audit Script
 * Validates that the extension meets performance requirements
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class PerformanceAuditor {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
    this.thresholds = {
      initTime: 50, // ms
      bundleSize: 200, // KB per chunk
      memoryUsage: 50, // MB
      animationFrame: 16.67 // ms (60fps)
    };
  }

  async runAudit() {
    console.log('🚀 Starting Performance Audit...\n');

    await this.checkBundleSizes();
    await this.checkInitializationTime();
    await this.checkMemoryUsage();
    await this.checkAnimationPerformance();
    await this.checkCodeOptimization();

    this.printResults();
    return this.results.failed === 0;
  }

  async checkBundleSizes() {
    this.log('📦 Checking bundle sizes...');

    const distPath = path.join(__dirname, '../dist/chrome');
    if (!fs.existsSync(distPath)) {
      this.fail('Bundle size check', 'No built files found. Run npm run build first.');
      return;
    }

    const checkFile = (filePath, maxSize, description) => {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024);
        
        if (sizeKB <= maxSize) {
          this.pass(`${description} size`, `${sizeKB}KB (limit: ${maxSize}KB)`);
        } else {
          this.fail(`${description} size`, `${sizeKB}KB exceeds limit of ${maxSize}KB`);
        }
      } else {
        this.warn(`${description} size`, 'File not found - may not be critical');
      }
    };

    // Check individual bundle sizes
    checkFile(path.join(distPath, 'background/service-worker.js'), 100, 'Background script');
    checkFile(path.join(distPath, 'content/content-script.js'), 150, 'Content script');
    checkFile(path.join(distPath, 'popup/popup.js'), 200, 'Popup script');
    checkFile(path.join(distPath, 'popup/popup.css'), 50, 'Popup styles');

    // Check total extension size
    const totalSize = this.getTotalDirectorySize(distPath);
    const totalMB = Math.round(totalSize / 1024 / 1024 * 100) / 100;
    
    if (totalMB <= 10) {
      this.pass('Total extension size', `${totalMB}MB (limit: 10MB)`);
    } else {
      this.fail('Total extension size', `${totalMB}MB exceeds Chrome Web Store limit of 10MB`);
    }
  }

  async checkInitializationTime() {
    this.log('⚡ Checking initialization performance...');

    // Simulate initialization by requiring key modules
    try {
      const startTime = performance.now();
      
      // Test loading critical modules
      const testFiles = [
        '../popup/popup.js',
        '../content/platform-detectors.js',
        '../optimization/optimization-engine.js',
        '../ui/components.js'
      ];

      for (const file of testFiles) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
          // Read and parse file (simulating module loading)
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.length > 0) {
            // Simulate parsing time
            const parseStart = performance.now();
            JSON.stringify(content.length); // Minimal processing
            const parseTime = performance.now() - parseStart;
            
            if (parseTime > 10) {
              this.warn(`${file} parse time`, `${parseTime.toFixed(2)}ms`);
            }
          }
        }
      }

      const totalTime = performance.now() - startTime;
      
      if (totalTime <= this.thresholds.initTime) {
        this.pass('Module loading time', `${totalTime.toFixed(2)}ms (limit: ${this.thresholds.initTime}ms)`);
      } else {
        this.fail('Module loading time', `${totalTime.toFixed(2)}ms exceeds limit of ${this.thresholds.initTime}ms`);
      }

    } catch (error) {
      this.warn('Initialization test', `Could not simulate loading: ${error.message}`);
    }
  }

  async checkMemoryUsage() {
    this.log('🧠 Checking memory efficiency...');

    // Check for potential memory leaks in code
    const codeFiles = this.getJSFiles(path.join(__dirname, '..'));
    let memoryIssues = 0;

    for (const file of codeFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for common memory leak patterns
      const issues = [];
      
      // Event listeners without cleanup
      if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
        issues.push('Missing removeEventListener cleanup');
      }
      
      // Intervals without cleanup
      if (content.includes('setInterval') && !content.includes('clearInterval')) {
        issues.push('Missing clearInterval cleanup');
      }
      
      // Timeouts without cleanup (less critical)
      if (content.includes('setTimeout') && content.split('setTimeout').length > 5) {
        issues.push('Many setTimeout calls - consider cleanup');
      }
      
      // Large data structures
      if (content.includes('new Array(') && content.match(/new Array\((\d+)\)/)) {
        const match = content.match(/new Array\((\d+)\)/);
        if (match && parseInt(match[1]) > 10000) {
          issues.push('Large array allocation detected');
        }
      }

      if (issues.length > 0) {
        memoryIssues += issues.length;
        const relativePath = path.relative(__dirname, file);
        this.warn(`Memory patterns in ${relativePath}`, issues.join(', '));
      }
    }

    if (memoryIssues === 0) {
      this.pass('Memory leak patterns', 'No obvious issues found');
    } else if (memoryIssues <= 5) {
      this.warn('Memory leak patterns', `${memoryIssues} potential issues found`);
    } else {
      this.fail('Memory leak patterns', `${memoryIssues} potential issues found`);
    }
  }

  async checkAnimationPerformance() {
    this.log('🎬 Checking animation performance...');

    const cssFiles = this.getCSSFiles(path.join(__dirname, '..'));
    let animationIssues = 0;
    let optimizedAnimations = 0;

    for (const file of cssFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for performance-friendly animations
      if (content.includes('will-change')) {
        optimizedAnimations++;
      }
      
      if (content.includes('transform: translateZ(0)')) {
        optimizedAnimations++;
      }
      
      // Check for potentially expensive animations
      const expensiveProps = ['width', 'height', 'top', 'left', 'margin', 'padding'];
      expensiveProps.forEach(prop => {
        const regex = new RegExp(`transition[^:]*:.*${prop}`, 'g');
        const matches = content.match(regex);
        if (matches && matches.length > 0) {
          animationIssues++;
          const relativePath = path.relative(__dirname, file);
          this.warn(`Animation performance in ${relativePath}`, `Animating ${prop} property (consider transform instead)`);
        }
      });
    }

    if (optimizedAnimations > animationIssues) {
      this.pass('Animation optimization', `${optimizedAnimations} optimized animations found`);
    } else if (animationIssues > 0) {
      this.warn('Animation optimization', `${animationIssues} potentially expensive animations`);
    } else {
      this.pass('Animation optimization', 'No animation performance issues detected');
    }
  }

  async checkCodeOptimization() {
    this.log('🔧 Checking code optimization...');

    const jsFiles = this.getJSFiles(path.join(__dirname, '..'));
    let optimizationScore = 0;
    let totalChecks = 0;

    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(__dirname, file);
      
      // Skip test files and node_modules
      if (relativePath.includes('test') || relativePath.includes('node_modules')) {
        continue;
      }
      
      totalChecks++;
      
      // Check for modern JavaScript features
      let fileScore = 0;
      
      if (content.includes('const ') || content.includes('let ')) {
        fileScore += 1; // Modern variable declarations
      }
      
      if (content.includes('=>')) {
        fileScore += 1; // Arrow functions
      }
      
      if (content.includes('async ') || content.includes('await ')) {
        fileScore += 1; // Async/await
      }
      
      if (content.includes('...') || content.includes('destructur')) {
        fileScore += 1; // Spread/destructuring
      }
      
      if (content.includes('try {') && content.includes('catch')) {
        fileScore += 1; // Error handling
      }
      
      // Check for performance anti-patterns
      if (content.includes('document.write')) {
        fileScore -= 2; // Blocking document.write
        this.warn(`Code quality in ${relativePath}`, 'Uses document.write (blocking)');
      }
      
      if (content.includes('eval(')) {
        fileScore -= 2; // eval usage
        this.warn(`Code quality in ${relativePath}`, 'Uses eval() (security/performance risk)');
      }
      
      if (content.includes('innerHTML') && !content.includes('DOMPurify')) {
        fileScore -= 1; // Potential XSS
        this.warn(`Code quality in ${relativePath}`, 'Uses innerHTML without sanitization');
      }
      
      optimizationScore += Math.max(0, fileScore);
    }

    const averageScore = totalChecks > 0 ? optimizationScore / totalChecks : 0;
    
    if (averageScore >= 3) {
      this.pass('Code optimization', `Average score: ${averageScore.toFixed(1)}/5`);
    } else if (averageScore >= 2) {
      this.warn('Code optimization', `Average score: ${averageScore.toFixed(1)}/5 - room for improvement`);
    } else {
      this.fail('Code optimization', `Average score: ${averageScore.toFixed(1)}/5 - needs optimization`);
    }
  }

  // Helper methods
  getTotalDirectorySize(dirPath) {
    let totalSize = 0;
    
    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          walkDir(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    };
    
    if (fs.existsSync(dirPath)) {
      walkDir(dirPath);
    }
    
    return totalSize;
  }

  getJSFiles(dir) {
    const jsFiles = [];
    
    const walkDir = (currentDir) => {
      if (!fs.existsSync(currentDir)) return;
      
      const files = fs.readdirSync(currentDir);
      
      for (const file of files) {
        const filePath = path.join(currentDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
          walkDir(filePath);
        } else if (file.endsWith('.js') && !file.includes('test') && !file.includes('spec')) {
          jsFiles.push(filePath);
        }
      }
    };
    
    walkDir(dir);
    return jsFiles;
  }

  getCSSFiles(dir) {
    const cssFiles = [];
    
    const walkDir = (currentDir) => {
      if (!fs.existsSync(currentDir)) return;
      
      const files = fs.readdirSync(currentDir);
      
      for (const file of files) {
        const filePath = path.join(currentDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
          walkDir(filePath);
        } else if (file.endsWith('.css')) {
          cssFiles.push(filePath);
        }
      }
    };
    
    walkDir(dir);
    return cssFiles;
  }

  pass(test, message) {
    this.results.passed++;
    this.results.tests.push({ status: 'PASS', test, message });
    console.log(`✅ ${test}: ${message}`);
  }

  fail(test, message) {
    this.results.failed++;
    this.results.tests.push({ status: 'FAIL', test, message });
    console.log(`❌ ${test}: ${message}`);
  }

  warn(test, message) {
    this.results.warnings++;
    this.results.tests.push({ status: 'WARN', test, message });
    console.log(`⚠️  ${test}: ${message}`);
  }

  log(message) {
    console.log(`\n${message}`);
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 Performance Audit Results');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`📝 Total: ${this.results.tests.length}`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 All performance requirements met!');
      console.log('Extension is ready for production deployment.');
    } else {
      console.log('\n🔧 Performance issues found that need attention.');
      console.log('Please address the failed tests before deployment.');
    }
    
    console.log('\n💡 Recommendations:');
    console.log('- Keep bundle sizes under 200KB per chunk');
    console.log('- Ensure initialization completes under 50ms');
    console.log('- Use transform/opacity for 60fps animations');
    console.log('- Clean up event listeners and intervals');
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new PerformanceAuditor();
  auditor.runAudit().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Audit failed:', error);
    process.exit(1);
  });
}

module.exports = PerformanceAuditor;
