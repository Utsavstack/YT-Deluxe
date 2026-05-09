// js/main.js

// ============================================================
// Phase 2: GitHub Releases API Integration
// ============================================================

const REPO = 'Utsavstack/YT-Deluxe';
const CACHE_KEY = 'ytdeluxe_release_cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const FALLBACK = {
    version: 'v1.0.0-beta',
    downloadUrl: `https://github.com/${REPO}/releases/latest`,
    size: '~85 MB',
    date: 'May 2026',
    changelog: ''
};

async function fetchRelease() {
    // 1. Check localStorage cache first
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
                console.log('[YT-Deluxe] Using cached release data.');
                return data;
            }
        }
    } catch (e) { /* ignore parse errors */ }

    // 2. Fetch from GitHub API
    try {
        const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
        if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
        const release = await res.json();

        // Smart .exe detection: prefer installer with 'setup' in name
        const exe = release.assets.find(a => a.name.toLowerCase().includes('setup') && a.name.endsWith('.exe'))
                 || release.assets.find(a => a.name.endsWith('.exe'));

        const data = {
            version: release.tag_name,
            downloadUrl: exe ? exe.browser_download_url : `https://github.com/${REPO}/releases/tag/${release.tag_name}`,
            size: exe ? `${(exe.size / 1024 / 1024).toFixed(0)} MB` : FALLBACK.size,
            downloads: exe ? exe.download_count.toLocaleString() : '—',
            changelog: release.body || '',
            date: new Date(release.published_at).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'long', day: 'numeric'
            })
        };

        // Cache the result
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
        console.log(`[YT-Deluxe] Fetched release: ${data.version}`);
        return data;

    } catch (err) {
        console.warn('[YT-Deluxe] GitHub API failed, using fallback data.', err.message);
        return FALLBACK;
    }
}

async function renderRelease() {
    const release = await fetchRelease();

    // Hero version badge
    const versionBadge = document.getElementById('version-badge');
    if (versionBadge) versionBadge.textContent = release.version;

    // Main download button in Download Section
    const mainDownloadBtn = document.getElementById('main-download-btn');
    if (mainDownloadBtn && release.downloadUrl) {
        mainDownloadBtn.href = release.downloadUrl;
    }

    // Meta text under download button (e.g. "Windows 10/11 • v1.0.0-beta • 82 MB")
    const downloadMeta = document.getElementById('download-meta');
    if (downloadMeta) {
        downloadMeta.textContent = `Windows 10/11 \u2022 ${release.version} \u2022 ${release.size}`;
    }

    // Hero CTA "Download for Windows" button — point directly to exe
    const heroDownloadBtn = document.getElementById('hero-download-btn');
    if (heroDownloadBtn && release.downloadUrl) {
        heroDownloadBtn.href = release.downloadUrl;
    }
}


// ============================================================
// DOMContentLoaded — Single Unified Listener
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- Theme: Force dark mode ---
    const htmlEl = document.documentElement;
    htmlEl.classList.add('dark');
    htmlEl.classList.remove('light');
    localStorage.setItem('theme', 'dark');

    // --- GitHub Releases API ---
    renderRelease();

    // --- Mock reCAPTCHA ---
    const mockCaptcha = document.getElementById('captcha-mock');
    const mainDownloadBtn = document.getElementById('main-download-btn');

    if (mockCaptcha && mainDownloadBtn) {
        mainDownloadBtn.addEventListener('click', (e) => {
            if (!mockCaptcha.checked) {
                e.preventDefault();
                alert('Please verify that you are not a robot by checking the reCAPTCHA box.');
                const captchaContainer = mockCaptcha.closest('div.p-4');
                if (captchaContainer) {
                    captchaContainer.classList.add('border-red-500', 'bg-red-500/10');
                    setTimeout(() => {
                        captchaContainer.classList.remove('border-red-500', 'bg-red-500/10');
                    }, 1500);
                }
            }
        });

        mockCaptcha.addEventListener('change', () => {
            if (mockCaptcha.checked) {
                const captchaContainer = mockCaptcha.closest('div.p-4');
                if (captchaContainer) {
                    captchaContainer.classList.remove('border-red-500', 'bg-red-500/10');
                }
            }
        });
    }

    // --- FAQ Accordion ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const btn = item.querySelector('button');
        if (btn) {
            btn.addEventListener('click', () => {
                const isOpen = item.classList.contains('is-open');
                faqItems.forEach(other => other.classList.remove('is-open'));
                if (!isOpen) item.classList.add('is-open');
            });
        }
    });

    // --- Changelog Accordion ---
    const changelogItems = document.querySelectorAll('.changelog-item');
    changelogItems.forEach(item => {
        const btn = item.querySelector('button');
        if (btn) {
            btn.addEventListener('click', () => {
                const isOpen = item.classList.contains('is-open');
                changelogItems.forEach(other => other.classList.remove('is-open'));
                if (!isOpen) item.classList.add('is-open');
            });
        }
    });

    // --- Reveal on Scroll ---
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

    // --- Timeline Scroll Animation ---
    const timelineContainer = document.getElementById('timeline-container');
    const timelineProgress = document.getElementById('timeline-progress');
    const timelineSteps = document.querySelectorAll('.timeline-step');

    if (timelineContainer && timelineProgress) {
        const stepObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.remove('opacity-0', 'translate-y-8');
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    const circle = entry.target.querySelector('.timeline-circle');
                    if (circle) {
                        circle.classList.remove('bg-card', 'text-white/40');
                        circle.classList.add('bg-[#5584ff]', 'text-white', 'shadow-[0_0_15px_rgba(85,132,255,0.4)]');
                    }
                }
            });
        }, { threshold: 0.5 });

        timelineSteps.forEach(step => stepObserver.observe(step));

        const timelineBgLine = document.getElementById('timeline-bg-line');
        window.addEventListener('scroll', () => {
            const rect = timelineContainer.getBoundingClientRect();
            const lastStep = timelineSteps[timelineSteps.length - 1];
            if (!lastStep) return;
            const lastCircle = lastStep.querySelector('.timeline-circle');
            const maxLineHeight = lastStep.offsetTop + (lastCircle ? lastCircle.offsetTop + lastCircle.offsetHeight / 2 : 0);

            if (timelineBgLine) timelineBgLine.style.height = `${maxLineHeight}px`;

            const windowHeight = window.innerHeight;
            const start = rect.top - windowHeight / 2;
            let progressPx = 0;
            if (start < 0) progressPx = Math.min(maxLineHeight, Math.max(0, -start));
            timelineProgress.style.height = `${progressPx}px`;
        });

        window.dispatchEvent(new Event('scroll'));
    }

    // --- Mobile Menu ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const mobileDrawerClose = document.getElementById('mobile-drawer-close');

    if (mobileMenuBtn && mobileDrawer && mobileOverlay) {
        function setMenuState(isOpen) {
            mobileDrawer.classList.toggle('is-open', isOpen);
            mobileMenuBtn.classList.toggle('is-active', isOpen);
            mobileOverlay.classList.toggle('is-open', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        }

        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setMenuState(!mobileDrawer.classList.contains('is-open'));
        });

        if (mobileDrawerClose) {
            mobileDrawerClose.addEventListener('click', (e) => {
                e.stopPropagation();
                setMenuState(false);
            });
        }

        mobileOverlay.addEventListener('click', () => setMenuState(false));

        // Mobile dropdown toggles
        const dropdowns = mobileDrawer.querySelectorAll('.mobile-drawer-dropdown');
        dropdowns.forEach(dropdown => {
            const btn = dropdown.querySelector('.mobile-drawer-dropdown-btn');
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropdowns.forEach(other => { if (other !== dropdown) other.classList.remove('is-open'); });
                    dropdown.classList.toggle('is-open');
                });
            }
        });

        // Close drawer on link click
        const allLinks = mobileDrawer.querySelectorAll('.mobile-drawer-link:not(.mobile-drawer-dropdown-btn), .mobile-drawer-sublink');
        allLinks.forEach(link => link.addEventListener('click', () => setMenuState(false)));
    }

    // --- Smooth Scroll for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            try {
                const targetEl = document.querySelector(href);
                if (targetEl) {
                    e.preventDefault();
                    targetEl.scrollIntoView({ behavior: 'smooth' });
                }
            } catch (err) { /* ignore invalid selectors */ }
        });
    });

});
