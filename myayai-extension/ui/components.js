/**
 * MyAyAI Dashboard Components
 * Reusable UI components for the popup dashboard
 */

class DashboardComponents {
    constructor() {
        this.confettiCanvas = null;
        this.confettiCtx = null;
        this.confettiParticles = [];
        this.particleContainer = null;
        this.soundEffectsEnabled = true;
        this.animationsEnabled = true;
        
        this.init();
    }

    init() {
        this.setupConfetti();
        this.setupParticles();
        this.loadSettings();
    }

    async loadSettings() {
        try {
            const settings = await chrome.storage.sync.get(['soundEffects', 'animations']);
            this.soundEffectsEnabled = settings.soundEffects !== false;
            this.animationsEnabled = settings.animations !== false;
        } catch (error) {
            console.warn('Could not load component settings:', error);
        }
    }

    setupConfetti() {
        this.confettiCanvas = document.getElementById('confetti-canvas');
        if (this.confettiCanvas) {
            this.confettiCtx = this.confettiCanvas.getContext('2d');
            this.confettiCanvas.width = 420;
            this.confettiCanvas.height = 600;
        }
    }

    setupParticles() {
        this.particleContainer = document.getElementById('particle-container');
    }

    // Number Counter Animation
    animateCounter(element, start, end, duration = 1000, suffix = '') {
        if (!this.animationsEnabled || !element) return;
        
        const startTime = performance.now();
        const range = end - start;
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (range * easeOut));
            
            element.textContent = current + suffix;
            element.classList.add('number-counter');
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                // Final value
                element.textContent = end + suffix;
                setTimeout(() => {
                    element.classList.remove('number-counter');
                }, 100);
            }
        };
        
        requestAnimationFrame(updateCounter);
    }

    // Smooth percentage animation
    animatePercentage(element, start, end, duration = 1000) {
        if (!this.animationsEnabled || !element) return;
        
        this.animateCounter(element, start, end, duration, '%');
    }

    // Currency animation
    animateCurrency(element, start, end, duration = 1000) {
        if (!this.animationsEnabled || !element) return;
        
        const startTime = performance.now();
        const range = end - start;
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = start + (range * easeOut);
            
            element.textContent = '$' + current.toFixed(2);
            element.classList.add('number-counter');
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = '$' + end.toFixed(2);
                setTimeout(() => {
                    element.classList.remove('number-counter');
                }, 100);
            }
        };
        
        requestAnimationFrame(updateCounter);
    }

    // Progress Bar Animation
    animateProgressBar(element, percentage, duration = 1000) {
        if (!this.animationsEnabled || !element) return;
        
        element.style.width = '0%';
        element.style.transition = `width ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        
        setTimeout(() => {
            element.style.width = percentage + '%';
        }, 100);
    }

    // XP Bar Animation with Glow
    animateXPBar(fillElement, percentage, duration = 1500) {
        if (!this.animationsEnabled || !fillElement) return;
        
        this.animateProgressBar(fillElement, percentage, duration);
        
        // Add glow effect during animation
        const glowElement = fillElement.parentElement.querySelector('.xp-glow');
        if (glowElement) {
            glowElement.style.opacity = '0.8';
            setTimeout(() => {
                glowElement.style.opacity = '0.3';
            }, duration);
        }
    }

    // Confetti Effects
    createConfetti(options = {}) {
        if (!this.animationsEnabled || !this.confettiCtx) return;
        
        const defaults = {
            particleCount: 50,
            spread: 45,
            origin: { x: 0.5, y: 0.3 },
            colors: ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981'],
            duration: 3000
        };
        
        const config = { ...defaults, ...options };
        
        for (let i = 0; i < config.particleCount; i++) {
            this.confettiParticles.push({
                x: config.origin.x * 420,
                y: config.origin.y * 600,
                vx: (Math.random() - 0.5) * config.spread * 0.2,
                vy: Math.random() * -15 - 5,
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                life: config.duration,
                maxLife: config.duration,
                size: Math.random() * 4 + 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3
            });
        }
        
        this.animateConfetti();
    }

    animateConfetti() {
        if (!this.confettiCtx || this.confettiParticles.length === 0) return;
        
        this.confettiCtx.clearRect(0, 0, 420, 600);
        
        for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
            const particle = this.confettiParticles[i];
            
            // Update particle
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.5; // gravity
            particle.rotation += particle.rotationSpeed;
            particle.life -= 16; // Assuming 60fps
            
            // Draw particle
            this.confettiCtx.save();
            this.confettiCtx.translate(particle.x, particle.y);
            this.confettiCtx.rotate(particle.rotation);
            this.confettiCtx.globalAlpha = particle.life / particle.maxLife;
            this.confettiCtx.fillStyle = particle.color;
            this.confettiCtx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
            this.confettiCtx.restore();
            
            // Remove dead particles
            if (particle.life <= 0 || particle.y > 600) {
                this.confettiParticles.splice(i, 1);
            }
        }
        
        if (this.confettiParticles.length > 0) {
            requestAnimationFrame(() => this.animateConfetti());
        }
    }

    // Celebration effect for achievements
    celebrateAchievement(achievementData) {
        if (!this.animationsEnabled) return;
        
        // Play confetti
        this.createConfetti({
            particleCount: 100,
            spread: 60,
            origin: { x: 0.5, y: 0.4 }
        });
        
        // Show achievement notification
        this.showAchievementNotification(achievementData);
        
        // Play sound if enabled
        if (this.soundEffectsEnabled) {
            this.playSound('achievement');
        }
        
        // Add sparkle effects
        this.createSparkleEffect(achievementData.element);
    }

    // Achievement Notification
    showAchievementNotification(achievementData) {
        const notification = document.getElementById('achievement-notification');
        if (!notification) return;
        
        const iconElement = notification.querySelector('.achievement-icon-large');
        const titleElement = notification.querySelector('.achievement-title');
        const descElement = notification.querySelector('.achievement-description');
        
        if (iconElement) iconElement.textContent = achievementData.icon;
        if (titleElement) titleElement.textContent = achievementData.title;
        if (descElement) descElement.textContent = achievementData.description;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }

    // Sparkle particle effects
    createSparkleEffect(element) {
        if (!this.animationsEnabled || !this.particleContainer || !element) return;
        
        const rect = element.getBoundingClientRect();
        const containerRect = this.particleContainer.getBoundingClientRect();
        
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const x = rect.left + rect.width/2 - containerRect.left;
            const y = rect.top + rect.height/2 - containerRect.top;
            
            const angle = (i / 12) * Math.PI * 2;
            const distance = Math.random() * 40 + 20;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
            
            this.particleContainer.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 3000);
        }
    }

    // Milestone celebration
    celebrateMilestone(milestoneData) {
        if (!this.animationsEnabled) return;
        
        // Bigger confetti burst
        this.createConfetti({
            particleCount: 150,
            spread: 90,
            origin: { x: 0.5, y: 0.2 },
            colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57']
        });
        
        // Show milestone notification
        this.showAchievementNotification({
            icon: '🎉',
            title: milestoneData.title || 'Milestone Reached!',
            description: milestoneData.description || 'You\'ve achieved something amazing!'
        });
        
        // Play milestone sound
        if (this.soundEffectsEnabled) {
            this.playSound('milestone');
        }
    }

    // Level up celebration
    celebrateLevelUp(newLevel) {
        if (!this.animationsEnabled) return;
        
        // Epic confetti with gold colors
        this.createConfetti({
            particleCount: 200,
            spread: 120,
            origin: { x: 0.5, y: 0.1 },
            colors: ['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#1E90FF', '#DA70D6']
        });
        
        // Level up notification
        this.showAchievementNotification({
            icon: '⭐',
            title: `Level ${newLevel} Reached!`,
            description: 'You\'ve mastered your prompt optimization skills!'
        });
        
        // Update level badge with animation
        const levelElement = document.getElementById('user-level');
        if (levelElement) {
            levelElement.style.transform = 'scale(1.5)';
            levelElement.style.transition = 'transform 0.3s ease';
            setTimeout(() => {
                levelElement.textContent = newLevel;
                setTimeout(() => {
                    levelElement.style.transform = 'scale(1)';
                }, 300);
            }, 150);
        }
        
        if (this.soundEffectsEnabled) {
            this.playSound('levelup');
        }
    }

    // Streak celebration
    celebrateStreak(streakCount) {
        if (!this.animationsEnabled) return;
        
        // Fire-themed celebration
        this.createConfetti({
            particleCount: 75,
            spread: 50,
            origin: { x: 0.5, y: 0.6 },
            colors: ['#FF4500', '#FF6347', '#FFD700', '#FFA500']
        });
        
        // Animate streak flame
        const streakFlame = document.querySelector('.streak-flame');
        if (streakFlame) {
            streakFlame.style.transform = 'scale(1.5)';
            streakFlame.style.transition = 'transform 0.3s ease';
            setTimeout(() => {
                streakFlame.style.transform = 'scale(1)';
            }, 300);
        }
        
        if (this.soundEffectsEnabled) {
            this.playSound('streak');
        }
    }

    // Sound effects (using Web Audio API for subtle sounds)
    playSound(type) {
        if (!this.soundEffectsEnabled) return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const sounds = {
            achievement: { frequency: 800, duration: 0.3, type: 'square' },
            milestone: { frequency: 1000, duration: 0.5, type: 'sine' },
            levelup: { frequency: 600, duration: 0.8, type: 'triangle' },
            streak: { frequency: 700, duration: 0.4, type: 'sawtooth' },
            click: { frequency: 300, duration: 0.1, type: 'square' }
        };
        
        const sound = sounds[type] || sounds.click;
        
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = sound.frequency;
            oscillator.type = sound.type;
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + sound.duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + sound.duration);
        } catch (error) {
            console.warn('Could not play sound:', error);
        }
    }

    // Theme switcher
    switchTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Save theme preference
        chrome.storage.sync.set({ selectedTheme: theme }).catch(err => {
            console.warn('Could not save theme preference:', err);
        });
    }

    // Sparkline chart renderer
    drawSparkline(canvas, data, options = {}) {
        if (!canvas || !data || data.length === 0) return;
        
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        
        const defaults = {
            strokeColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim(),
            lineWidth: 2,
            fillColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() + '20',
            padding: 4
        };
        
        const config = { ...defaults, ...options };
        
        ctx.clearRect(0, 0, width, height);
        
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;
        
        const xStep = (width - config.padding * 2) / (data.length - 1);
        
        // Draw line
        ctx.strokeStyle = config.strokeColor;
        ctx.lineWidth = config.lineWidth;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = config.padding + (index * xStep);
            const y = height - config.padding - ((point - min) / range * (height - config.padding * 2));
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Fill area under curve
        if (config.fillColor) {
            ctx.fillStyle = config.fillColor;
            ctx.lineTo(width - config.padding, height - config.padding);
            ctx.lineTo(config.padding, height - config.padding);
            ctx.closePath();
            ctx.fill();
        }
    }

    // Utility function to add hover effects to cards
    addCardHoverEffects(selector = '.metric-card') {
        const cards = document.querySelectorAll(selector);
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                if (this.animationsEnabled) {
                    card.style.transform = 'translateY(-2px)';
                    card.style.transition = 'transform 0.2s ease';
                    
                    const sparkle = card.querySelector('.metric-sparkle');
                    if (sparkle) {
                        sparkle.style.opacity = '1';
                        sparkle.style.animation = 'sparkleAnimation 0.5s ease-in-out';
                    }
                }
            });
            
            card.addEventListener('mouseleave', () => {
                if (this.animationsEnabled) {
                    card.style.transform = 'translateY(0)';
                    
                    const sparkle = card.querySelector('.metric-sparkle');
                    if (sparkle) {
                        sparkle.style.opacity = '0';
                    }
                }
            });
        });
    }

    // Initialize all card interactions
    initializeCardEffects() {
        this.addCardHoverEffects('.metric-card');
        this.addCardHoverEffects('.achievement-item');
        this.addCardHoverEffects('.action-btn');
    }

    // Clean up resources
    destroy() {
        if (this.confettiCanvas) {
            this.confettiCtx = null;
            this.confettiParticles = [];
        }
        
        if (this.particleContainer) {
            this.particleContainer.innerHTML = '';
        }
    }
}

// Export for use in other modules
window.DashboardComponents = DashboardComponents;
