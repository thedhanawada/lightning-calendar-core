/**
 * Google-Level UI Enhancements
 * Principal Developer Implementation
 */

class GoogleUIEnhancements {
    constructor(calendar) {
        this.calendar = calendar;
        this.initializeEnhancements();
    }

    initializeEnhancements() {
        this.setupMicroInteractions();
        this.setupAdvancedAnimations();
        this.setupGestureControls();
        this.setupKeyboardShortcuts();
        this.setupCommandPalette();
        this.setupHapticFeedback();
        this.setupSmartSuggestions();
    }

    /**
     * Micro-interactions for delightful UX
     */
    setupMicroInteractions() {
        // Magnetic hover effect for buttons
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                btn.style.transform = `
                    translate(${x * 0.1}px, ${y * 0.1}px)
                    scale(1.02)
                `;
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });

        // Satisfying click feedback
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .clickable')) {
                this.createRipple(e);
                this.hapticFeedback('light');
            }
        });

        // Smart hover previews
        document.querySelectorAll('.calendar-event').forEach(event => {
            let hoverTimer;
            event.addEventListener('mouseenter', (e) => {
                hoverTimer = setTimeout(() => {
                    this.showSmartPreview(e.target);
                }, 500);
            });

            event.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimer);
                this.hideSmartPreview();
            });
        });
    }

    /**
     * Advanced animations using Web Animations API
     */
    setupAdvancedAnimations() {
        // Page transition with FLIP animation
        this.addFLIPTransition();

        // Stagger animations for lists
        this.addStaggerAnimation('.list-item', {
            duration: 400,
            delay: 50,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
        });

        // Morphing transitions between views
        this.addMorphTransition();

        // Parallax scrolling effects
        this.addParallaxEffect();
    }

    /**
     * FLIP (First, Last, Invert, Play) Animation
     */
    addFLIPTransition() {
        const flipElements = document.querySelectorAll('[data-flip-id]');
        const positions = new Map();

        // Record first positions
        flipElements.forEach(el => {
            positions.set(el.dataset.flipId, el.getBoundingClientRect());
        });

        // After DOM change, calculate and animate
        const animateFLIP = () => {
            flipElements.forEach(el => {
                const firstPos = positions.get(el.dataset.flipId);
                const lastPos = el.getBoundingClientRect();

                const deltaX = firstPos.left - lastPos.left;
                const deltaY = firstPos.top - lastPos.top;
                const deltaW = firstPos.width / lastPos.width;
                const deltaH = firstPos.height / lastPos.height;

                el.animate([
                    {
                        transform: `translate(${deltaX}px, ${deltaY}px) scale(${deltaW}, ${deltaH})`
                    },
                    {
                        transform: 'none'
                    }
                ], {
                    duration: 300,
                    easing: 'cubic-bezier(0.2, 0, 0, 1)'
                });
            });
        };

        // Listen for view changes
        this.calendar.on('viewChange', animateFLIP);
    }

    /**
     * Stagger animation for list items
     */
    addStaggerAnimation(selector, options = {}) {
        const elements = document.querySelectorAll(selector);
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    entry.target.animate([
                        {
                            opacity: 0,
                            transform: 'translateY(20px) scale(0.9)'
                        },
                        {
                            opacity: 1,
                            transform: 'translateY(0) scale(1)'
                        }
                    ], {
                        duration: options.duration || 300,
                        delay: index * (options.delay || 50),
                        easing: options.easing || 'ease-out',
                        fill: 'both'
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        elements.forEach(el => observer.observe(el));
    }

    /**
     * Morph transition using View Transitions API
     */
    addMorphTransition() {
        if (!document.startViewTransition) return;

        this.calendar.on('eventClick', (event) => {
            document.startViewTransition(() => {
                // Update DOM
                this.showEventDetail(event);
            });
        });
    }

    /**
     * Parallax scrolling effect
     */
    addParallaxEffect() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;

            parallaxElements.forEach(el => {
                const speed = el.dataset.parallax || 0.5;
                el.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }

    /**
     * Gesture controls for touch devices
     */
    setupGestureControls() {
        if (!window.Hammer) return;

        const hammer = new Hammer(document.querySelector('.calendar-content'));

        // Pinch to zoom
        hammer.get('pinch').set({ enable: true });
        hammer.on('pinch', (e) => {
            if (e.scale < 0.8) {
                this.calendar.zoomOut();
            } else if (e.scale > 1.2) {
                this.calendar.zoomIn();
            }
        });

        // Swipe navigation
        hammer.on('swipeleft', () => {
            this.animatedNavigate('next');
        });

        hammer.on('swiperight', () => {
            this.animatedNavigate('previous');
        });

        // Double tap to create event
        hammer.on('doubletap', (e) => {
            this.quickCreateEvent(e.center);
        });

        // Long press for context menu
        hammer.on('press', (e) => {
            this.showContextMenu(e.center);
        });
    }

    /**
     * Advanced keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        const shortcuts = new Map([
            // Navigation
            ['j', () => this.selectNext()],
            ['k', () => this.selectPrevious()],
            ['h', () => this.calendar.previous()],
            ['l', () => this.calendar.next()],
            ['g g', () => this.calendar.today()],

            // Views
            ['1', () => this.calendar.setView('day')],
            ['2', () => this.calendar.setView('week')],
            ['3', () => this.calendar.setView('month')],
            ['4', () => this.calendar.setView('year')],

            // Actions
            ['n', () => this.showCreateDialog()],
            ['/', () => this.focusSearch()],
            ['?', () => this.showShortcutHelp()],
            ['cmd+z', () => this.calendar.undo()],
            ['cmd+shift+z', () => this.calendar.redo()],
            ['cmd+k', () => this.openCommandPalette()],
            ['escape', () => this.closeAllDialogs()]
        ]);

        // Use tinykeys or similar library
        if (window.tinykeys) {
            tinykeys(window, Object.fromEntries(shortcuts));
        }
    }

    /**
     * Command palette (like VS Code)
     */
    setupCommandPalette() {
        this.commandPalette = new CommandPalette({
            trigger: 'cmd+k',
            placeholder: 'Type a command or search...',
            commands: this.getCommands()
        });
    }

    getCommands() {
        return [
            // Calendar commands
            {
                id: 'calendar.create',
                title: 'Create Event',
                icon: '📅',
                action: () => this.showCreateDialog()
            },
            {
                id: 'calendar.today',
                title: 'Go to Today',
                icon: '📍',
                action: () => this.calendar.today()
            },
            {
                id: 'calendar.export',
                title: 'Export Calendar',
                icon: '💾',
                children: [
                    { id: 'export.ics', title: 'iCalendar (.ics)' },
                    { id: 'export.pdf', title: 'PDF' },
                    { id: 'export.csv', title: 'CSV' }
                ]
            },

            // View commands
            {
                id: 'view.change',
                title: 'Change View',
                icon: '👁️',
                children: [
                    { id: 'view.day', title: 'Day View', shortcut: '1' },
                    { id: 'view.week', title: 'Week View', shortcut: '2' },
                    { id: 'view.month', title: 'Month View', shortcut: '3' },
                    { id: 'view.year', title: 'Year View', shortcut: '4' }
                ]
            },

            // Theme commands
            {
                id: 'theme.switch',
                title: 'Switch Theme',
                icon: '🎨',
                children: [
                    { id: 'theme.light', title: 'Light' },
                    { id: 'theme.dark', title: 'Dark' },
                    { id: 'theme.auto', title: 'Auto' }
                ]
            }
        ];
    }

    /**
     * Haptic feedback for mobile
     */
    setupHapticFeedback() {
        if (!window.navigator.vibrate) return;

        this.hapticPatterns = {
            light: [10],
            medium: [20],
            heavy: [30],
            success: [10, 50, 10],
            warning: [30, 10, 30],
            error: [50, 10, 50, 10, 50]
        };
    }

    hapticFeedback(type = 'light') {
        if (window.navigator.vibrate) {
            window.navigator.vibrate(this.hapticPatterns[type] || [10]);
        }
    }

    /**
     * Smart suggestions using AI
     */
    setupSmartSuggestions() {
        const input = document.querySelector('.event-title-input');
        if (!input) return;

        input.addEventListener('input', debounce((e) => {
            const value = e.target.value;
            if (value.length > 3) {
                this.generateSuggestions(value);
            }
        }, 300));
    }

    async generateSuggestions(text) {
        // Parse natural language
        const patterns = {
            meeting: /meeting with (\w+)/i,
            lunch: /lunch at ([\w\s]+)/i,
            call: /call (\w+)/i,
            deadline: /deadline for ([\w\s]+)/i
        };

        for (const [type, pattern] of Object.entries(patterns)) {
            const match = text.match(pattern);
            if (match) {
                this.showSuggestion({
                    type,
                    title: text,
                    duration: type === 'lunch' ? 60 : 30,
                    location: type === 'lunch' ? match[1] : null,
                    attendees: type === 'meeting' ? [match[1]] : []
                });
            }
        }
    }

    /**
     * Create ripple effect
     */
    createRipple(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%);
            border-radius: 50%;
            transform: scale(0);
            pointer-events: none;
        `;

        button.appendChild(ripple);

        ripple.animate([
            { transform: 'scale(0)', opacity: 1 },
            { transform: 'scale(4)', opacity: 0 }
        ], {
            duration: 600,
            easing: 'ease-out'
        }).onfinish = () => ripple.remove();
    }

    /**
     * Animated navigation
     */
    animatedNavigate(direction) {
        const container = document.querySelector('.calendar-content');
        const isNext = direction === 'next';

        container.animate([
            { transform: 'translateX(0)', opacity: 1 },
            { transform: `translateX(${isNext ? '-' : ''}100px)`, opacity: 0 }
        ], {
            duration: 200,
            easing: 'ease-in'
        }).onfinish = () => {
            this.calendar[direction]();
            container.animate([
                { transform: `translateX(${isNext ? '' : '-'}100px)`, opacity: 0 },
                { transform: 'translateX(0)', opacity: 1 }
            ], {
                duration: 200,
                easing: 'ease-out'
            });
        };
    }

    /**
     * Performance optimizations
     */
    enableVirtualScrolling() {
        // Implement virtual scrolling for large datasets
        if (window.VirtualList) {
            this.virtualList = new VirtualList({
                container: document.querySelector('.event-list'),
                itemHeight: 60,
                renderItem: (item) => this.renderEventItem(item),
                buffer: 5
            });
        }
    }

    /**
     * Skeleton loading
     */
    showSkeletonScreen() {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-container';
        skeleton.innerHTML = `
            ${Array(7).fill('').map(() => `
                <div class="skeleton skeleton-day">
                    <div class="skeleton-date"></div>
                    <div class="skeleton-event"></div>
                    <div class="skeleton-event"></div>
                </div>
            `).join('')}
        `;

        document.querySelector('.calendar-content').appendChild(skeleton);

        // Animate skeleton
        skeleton.animate([
            { opacity: 0.5 },
            { opacity: 1 },
            { opacity: 0.5 }
        ], {
            duration: 1500,
            iterations: Infinity
        });

        return skeleton;
    }
}

// Utility: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export for use
export default GoogleUIEnhancements;