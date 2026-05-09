    // js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const htmlEl = document.documentElement;

    // Theme is forced to dark mode as per design requirements.
    htmlEl.classList.add('dark');
    htmlEl.classList.remove('light');
    localStorage.setItem('theme', 'dark');

    // Handle mock reCAPTCHA checking
    const mockCaptcha = document.getElementById('captcha-mock');
    const mainDownloadBtn = document.getElementById('main-download-btn');
    
    if (mockCaptcha && mainDownloadBtn) {
        mainDownloadBtn.addEventListener('click', (e) => {
            if (!mockCaptcha.checked) {
                e.preventDefault();
                alert('Please verify that you are not a robot by checking the reCAPTCHA box.');
                
                // Visual feedback for the unchecked box
                const captchaContainer = mockCaptcha.closest('div.p-4');
                captchaContainer.classList.add('border-red-500', 'bg-red-500/10');
                setTimeout(() => {
                    captchaContainer.classList.remove('border-red-500', 'bg-red-500/10');
                }, 1500);
            }
        });
        
        mockCaptcha.addEventListener('change', () => {
            if (mockCaptcha.checked) {
                const captchaContainer = mockCaptcha.closest('div.p-4');
                captchaContainer.classList.remove('border-red-500', 'bg-red-500/10');
            }
        });
    }

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const btn = item.querySelector('button');
        if (btn) {
            btn.addEventListener('click', () => {
                const isOpen = item.classList.contains('is-open');
                
                // Close all other items
                faqItems.forEach(other => {
                    other.classList.remove('is-open');
                });

                // Toggle the clicked item
                if (!isOpen) {
                    item.classList.add('is-open');
                }
            });
        }
    });

    // Changelog Accordion
    const changelogItems = document.querySelectorAll('.changelog-item');
    changelogItems.forEach(item => {
        const btn = item.querySelector('button');
        if (btn) {
            btn.addEventListener('click', () => {
                const isOpen = item.classList.contains('is-open');
                
                // Close all other items
                changelogItems.forEach(other => {
                    other.classList.remove('is-open');
                });

                // Toggle the clicked item
                if (!isOpen) {
                    item.classList.add('is-open');
                }
            });
        }
    });

    // Timeline Scroll Animation
    const timelineContainer = document.getElementById('timeline-container');
    const timelineProgress = document.getElementById('timeline-progress');
    const timelineSteps = document.querySelectorAll('.timeline-step');

    if (timelineContainer && timelineProgress) {
        // Use IntersectionObserver to fade in steps
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.remove('opacity-0', 'translate-y-8');
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    
                    // Activate the circle
                    const circle = entry.target.querySelector('.timeline-circle');
                    if (circle) {
                        circle.classList.remove('bg-card', 'text-white/40');
                        circle.classList.add('bg-[#5584ff]', 'text-white', 'shadow-[0_0_15px_rgba(85,132,255,0.4)]');
                    }
                }
            });
        }, { threshold: 0.5 });

        timelineSteps.forEach(step => observer.observe(step));

        // Animate the line height based on scroll
        const timelineBgLine = document.getElementById('timeline-bg-line');
        
        window.addEventListener('scroll', () => {
            const rect = timelineContainer.getBoundingClientRect();
            
            // Use offsetTop for more reliable calculation relative to the container
            const lastStep = timelineSteps[timelineSteps.length - 1];
            const lastCircle = lastStep.querySelector('.timeline-circle');
            
            // Calculate center of the last circle relative to the container
            // lastStep.offsetTop is the top of the step div relative to timelineContainer
            // lastCircle.offsetTop is the top of the circle relative to the step div
            const maxLineHeight = lastStep.offsetTop + lastCircle.offsetTop + (lastCircle.offsetHeight / 2);
            
            if (timelineBgLine) {
                timelineBgLine.style.height = `${maxLineHeight}px`;
            }
            
            // Calculate progress based on scroll position
            const windowHeight = window.innerHeight;
            const start = rect.top - (windowHeight / 2);
            
            let progressPx = 0;
            if (start < 0) {
                progressPx = Math.min(maxLineHeight, Math.max(0, -start));
            }
            
            timelineProgress.style.height = `${progressPx}px`;
        });
        
        // Trigger once on load to set initial state
        window.dispatchEvent(new Event('scroll'));
    }
});

// Modal logic has been moved to individual pages for high-fidelity control.

document.addEventListener('DOMContentLoaded', () => {
    // Reveal On Scroll Logic
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const delayClasses = Array.from(el.classList).filter(c => c.startsWith('delay-'));
                    el.classList.remove('opacity-0', 'translate-y-8', 'scale-95', ...delayClasses);
                    el.classList.add('opacity-100', 'translate-y-0', 'scale-100');
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

        revealElements.forEach(el => revealObserver.observe(el));
    }

    // Mobile Menu Logic
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const mobileDrawerClose = document.getElementById('mobile-drawer-close');

    if (mobileMenuBtn && mobileDrawer && mobileOverlay) {
        function toggleMenu() {
            const isOpen = !mobileDrawer.classList.contains('is-open');
            setMenuState(isOpen);
        }

        function setMenuState(isOpen) {
            mobileDrawer.classList.toggle('is-open', isOpen);
            mobileMenuBtn.classList.toggle('is-active', isOpen);
            mobileOverlay.classList.toggle('is-open', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        }

        function closeMenu() {
            setMenuState(false);
        }

        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        if (mobileDrawerClose) {
            mobileDrawerClose.addEventListener('click', (e) => {
                e.stopPropagation();
                closeMenu();
            });
        }

        mobileOverlay.addEventListener('click', closeMenu);

        // Mobile Dropdown Toggle
        const dropdowns = mobileDrawer.querySelectorAll('.mobile-drawer-dropdown');
        dropdowns.forEach(dropdown => {
            const btn = dropdown.querySelector('.mobile-drawer-dropdown-btn');
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    dropdowns.forEach(other => {
                        if (other !== dropdown) other.classList.remove('is-open');
                    });
                    
                    dropdown.classList.toggle('is-open');
                });
            }
        });

        // Close menu when clicking links
        const allLinks = mobileDrawer.querySelectorAll('.mobile-drawer-link:not(.mobile-drawer-dropdown-btn), .mobile-drawer-sublink');
        allLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });
    }

    // Smooth scroll fix for drawer links and others
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            try {
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            } catch (err) {
                // Silently handle invalid selectors
            }
        });
    });
});
