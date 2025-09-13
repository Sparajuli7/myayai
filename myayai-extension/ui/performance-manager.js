/**
 * Performance Manager - Optimizes animations and interactions for 60fps
 * Handles lazy loading, throttling, and performance monitoring
 */

class PerformanceManager {
  constructor() {
    this.animationQueue = [];
    this.frameId = null;
    this.isAnimating = false;
    this.lastFrameTime = 0;
    this.fpsTarget = 60;
    this.frameInterval = 1000 / this.fpsTarget;
    this.performanceMetrics = {
      initTime: 0,
      animationFrames: 0,
      droppedFrames: 0,
      averageFrameTime: 0
    };
    this.observers = new Set();
    this.intersectionObserver = null;
    
    this.init();
  }

  init() {
    this.startTime = performance.now();
    this.setupIntersectionObserver();
    this.setupFrameCounter();
    this.bindEvents();
  }

  // Setup intersection observer for lazy animations
  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-viewport');
              entry.target.dispatchEvent(new CustomEvent('enterViewport'));
            } else {
              entry.target.classList.remove('in-viewport');
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1
        }
      );
    }
  }

  // Observe element for viewport animations
  observeElement(element) {
    if (this.intersectionObserver && element) {
      this.intersectionObserver.observe(element);
      this.observers.add(element);
    }
  }

  unobserveElement(element) {
    if (this.intersectionObserver && element) {
      this.intersectionObserver.unobserve(element);
      this.observers.delete(element);
    }
  }

  // Frame performance monitoring
  setupFrameCounter() {
    let frameCount = 0;
    let lastTime = performance.now();

    const countFrame = (currentTime) => {
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.performanceMetrics.currentFPS = fps;
        
        if (fps < this.fpsTarget * 0.8) {
          this.performanceMetrics.droppedFrames++;
          this.handlePerformanceDrop();
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(countFrame);
    };
    
    requestAnimationFrame(countFrame);
  }

  // Handle performance degradation
  handlePerformanceDrop() {
    // Reduce animation quality or disable non-essential animations
    document.documentElement.classList.add('reduced-motion');
    
    // Emit performance warning
    this.emit('performance-warning', {
      fps: this.performanceMetrics.currentFPS,
      target: this.fpsTarget
    });
  }

  // Optimized animation queue system
  queueAnimation(animation) {
    if (typeof animation !== 'function') return;
    
    this.animationQueue.push({
      fn: animation,
      priority: animation.priority || 1,
      timestamp: performance.now()
    });
    
    if (!this.isAnimating) {
      this.processAnimationQueue();
    }
  }

  processAnimationQueue() {
    if (this.animationQueue.length === 0) {
      this.isAnimating = false;
      return;
    }
    
    this.isAnimating = true;
    
    const processFrame = (currentTime) => {
      const deltaTime = currentTime - this.lastFrameTime;
      
      if (deltaTime >= this.frameInterval) {
        // Process high priority animations first
        this.animationQueue.sort((a, b) => b.priority - a.priority);
        
        const animation = this.animationQueue.shift();
        if (animation) {
          try {
            const result = animation.fn(currentTime, deltaTime);
            
            // If animation returns false, it's complete
            if (result !== false && typeof animation.fn === 'function') {
              this.animationQueue.push(animation);
            }
          } catch (error) {
            console.warn('Animation error:', error);
          }
        }
        
        this.lastFrameTime = currentTime;
        this.performanceMetrics.animationFrames++;
      }
      
      if (this.animationQueue.length > 0) {
        this.frameId = requestAnimationFrame(processFrame);
      } else {
        this.isAnimating = false;
      }
    };
    
    this.frameId = requestAnimationFrame(processFrame);
  }

  // Throttled function executor
  throttle(func, delay = 16) { // Default to ~60fps
    let lastExecution = 0;
    
    return function throttledFunction(...args) {
      const currentTime = performance.now();
      
      if (currentTime - lastExecution >= delay) {
        func.apply(this, args);
        lastExecution = currentTime;
      }
    };
  }

  // Debounced function executor
  debounce(func, delay = 250) {
    let timeoutId;
    
    return function debouncedFunction(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Event binding with performance optimization
  bindEvents() {
    // Throttled scroll handler
    const throttledScroll = this.throttle(() => {
      this.emit('scroll-optimized');
    }, 16);
    
    // Throttled resize handler
    const throttledResize = this.debounce(() => {
      this.emit('resize-optimized');
      this.handleResize();
    }, 100);
    
    window.addEventListener('scroll', throttledScroll, { passive: true });
    window.addEventListener('resize', throttledResize, { passive: true });
    
    // Visibility change optimization
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAnimations();
      } else {
        this.resumeAnimations();
      }
    });
  }

  handleResize() {
    // Cancel current animations that depend on layout
    this.animationQueue = this.animationQueue.filter(anim => !anim.layoutDependent);
    
    // Trigger layout recalculation for visible elements only
    this.observers.forEach(element => {
      if (element.classList.contains('in-viewport')) {
        element.dispatchEvent(new CustomEvent('layout-update'));
      }
    });
  }

  // Pause animations when tab is not visible
  pauseAnimations() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.isAnimating = false;
  }

  resumeAnimations() {
    if (this.animationQueue.length > 0 && !this.isAnimating) {
      this.processAnimationQueue();
    }
  }

  // Optimized DOM manipulation
  batchDOMUpdates(updates) {
    if (!Array.isArray(updates)) return;
    
    // Use DocumentFragment for batch DOM operations
    const fragment = document.createDocumentFragment();
    const elementsToUpdate = [];
    
    updates.forEach(update => {
      if (update.type === 'create') {
        const element = document.createElement(update.tag || 'div');
        if (update.properties) {
          Object.assign(element, update.properties);
        }
        if (update.styles) {
          Object.assign(element.style, update.styles);
        }
        if (update.classes) {
          element.className = update.classes;
        }
        if (update.content) {
          element.textContent = update.content;
        }
        fragment.appendChild(element);
        elementsToUpdate.push(element);
      }
    });
    
    // Single DOM operation
    if (updates.length > 0 && updates[0].parent) {
      updates[0].parent.appendChild(fragment);
    }
    
    return elementsToUpdate;
  }

  // Memory efficient animation utilities
  createOptimizedAnimation(element, keyframes, options = {}) {
    const defaults = {
      duration: 300,
      easing: 'ease-out',
      fill: 'both'
    };
    
    const config = { ...defaults, ...options };
    
    // Use Web Animations API if available (better performance)
    if (element.animate && 'Animation' in window) {
      return element.animate(keyframes, config);
    }
    
    // Fallback to CSS transitions
    return this.createCSSAnimation(element, keyframes, config);
  }

  createCSSAnimation(element, keyframes, config) {
    const startStyles = keyframes[0] || {};
    const endStyles = keyframes[keyframes.length - 1] || {};
    
    // Apply initial styles
    Object.assign(element.style, startStyles);
    
    // Set transition
    element.style.transition = `all ${config.duration}ms ${config.easing}`;
    
    // Force reflow
    element.offsetHeight;
    
    // Apply end styles
    setTimeout(() => {
      Object.assign(element.style, endStyles);
    }, 10);
    
    // Clean up transition after completion
    const cleanup = () => {
      element.style.transition = '';
      element.removeEventListener('transitionend', cleanup);
    };
    
    element.addEventListener('transitionend', cleanup, { once: true });
    
    return {
      finished: new Promise(resolve => {
        setTimeout(resolve, config.duration);
      })
    };
  }

  // Optimized number counter with requestAnimationFrame
  animateNumber(element, start, end, duration = 1000, formatter = null) {
    if (!element) return Promise.resolve();
    
    return new Promise(resolve => {
      const startTime = performance.now();
      const range = end - start;
      
      const updateNumber = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out cubic)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + (range * easeOut);
        
        // Apply formatting
        const displayValue = formatter ? formatter(current) : Math.round(current);
        element.textContent = displayValue;
        
        if (progress < 1) {
          requestAnimationFrame(updateNumber);
        } else {
          element.textContent = formatter ? formatter(end) : end;
          resolve();
        }
      };
      
      requestAnimationFrame(updateNumber);
    });
  }

  // Performance monitoring
  measurePerformance(name, fn) {
    const startTime = performance.now();
    performance.mark(`${name}-start`);
    
    const result = fn();
    
    const endTime = performance.now();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const executionTime = endTime - startTime;
    
    // Log slow operations
    if (executionTime > 16) { // More than one frame
      console.warn(`Slow operation detected: ${name} took ${executionTime.toFixed(2)}ms`);
    }
    
    return result;
  }

  // Get performance metrics
  getMetrics() {
    const navigationTiming = performance.getEntriesByType('navigation')[0];
    
    return {
      ...this.performanceMetrics,
      initTime: performance.now() - this.startTime,
      domContentLoaded: navigationTiming ? navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart : 0,
      memoryUsage: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null
    };
  }

  // Event system
  on(event, callback) {
    if (!this.events) this.events = {};
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  emit(event, data) {
    if (!this.events || !this.events[event]) return;
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.warn('Event callback error:', error);
      }
    });
  }

  // Cleanup
  destroy() {
    // Cancel any pending animations
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }
    
    // Clear animation queue
    this.animationQueue = [];
    
    // Disconnect intersection observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    // Clear observers
    this.observers.clear();
    
    // Clear events
    this.events = {};
  }
}

// Global performance manager instance
window.PerformanceManager = PerformanceManager;
window.performanceManager = new PerformanceManager();
