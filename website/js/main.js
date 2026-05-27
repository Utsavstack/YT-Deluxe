/* eslint-env browser */
/* global marked */
// js/main.js

// ============================================================
// Config
// ============================================================
const REPO = 'Utsavstack/YT-Deluxe';
const CACHE_KEY_LATEST = 'ytdeluxe_release_cache';
const CACHE_KEY_ALL    = 'ytdeluxe_releases_all_cache';
const CACHE_TTL        = 60 * 60 * 1000; // 1 hour
const PAGE_VIEWS_KEY   = 'ytdeluxe_page_views';

const FALLBACK_LATEST = {
    version: 'v2.0.0',
    downloadUrl: `https://github.com/${REPO}/releases/latest`,
    size: '~85 MB',
    date: 'May 2026',
    downloads: '—',
    sha256: 'F03055B6ED82662FA73E4803931F6CD853F75E79736D3EC36581271A3B94FCCC',
    exeName: 'YT-Deluxe-Setup-v2.0.0.exe',
    changelog: '## v2.0.0\n- Dynamic Piped API Proxy Integration\n- Two-phase fast details loading\n- Premium Liquid Glass layout'
};

// ============================================================
// Page View Counter (localStorage-based)
// ============================================================
function trackPageView() {
    try {
        const views = parseInt(localStorage.getItem(PAGE_VIEWS_KEY) || '0', 10) + 1;
        localStorage.setItem(PAGE_VIEWS_KEY, views);
        return views;
    } catch { return 1; }
}

function getPageViews() {
    try { return parseInt(localStorage.getItem(PAGE_VIEWS_KEY) || '0', 10); } catch { return 0; }
}

// ============================================================
// GitHub API: Fetch latest release
// ============================================================
async function fetchLatestRelease() {
    try {
        const cached = localStorage.getItem(CACHE_KEY_LATEST);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) return data;
        }
    } catch { /* ignore */ }

    try {
        const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
        if (!res.ok) throw new Error(`${res.status}`);
        const r = await res.json();
        const exe = r.assets.find(a => a.name.toLowerCase().includes('setup') && a.name.endsWith('.exe'))
                 || r.assets.find(a => a.name.endsWith('.exe'));

        // Total downloads across all assets
        const totalDl = r.assets.reduce((sum, a) => sum + (a.download_count || 0), 0);

        const shaMatch = (r.body || '').match(/SHA-256.*?:?\s*([a-fA-F0-9]{64})/i);
        const sha256 = shaMatch ? shaMatch[1].toUpperCase() : 'F03055B6ED82662FA73E4803931F6CD853F75E79736D3EC36581271A3B94FCCC';

        const data = {
            version:     r.tag_name,
            downloadUrl: exe ? exe.browser_download_url : `https://github.com/${REPO}/releases/tag/${r.tag_name}`,
            size:        exe ? `${(exe.size / 1024 / 1024).toFixed(0)} MB` : FALLBACK_LATEST.size,
            downloads:   totalDl.toLocaleString(),
            downloadCount: totalDl,
            changelog:   r.body || '',
            date:        new Date(r.published_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
            htmlUrl:     r.html_url,
            sha256:      sha256,
            exeName:     exe ? exe.name : `YT-Deluxe-Setup-${r.tag_name}.exe`
        };
        localStorage.setItem(CACHE_KEY_LATEST, JSON.stringify({ data, timestamp: Date.now() }));
        return data;
    } catch (err) {
        console.warn('[YT-Deluxe] GitHub API failed, using fallback.', err.message);
        return FALLBACK_LATEST;
    }
}

// ============================================================
// GitHub API: Fetch last N releases
// ============================================================
async function fetchAllReleases(perPage = 5) {
    try {
        const cached = localStorage.getItem(CACHE_KEY_ALL);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) return data;
        }
    } catch { /* ignore */ }

    try {
        const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=${perPage}`);
        if (!res.ok) throw new Error(`${res.status}`);
        const releases = await res.json();

        const data = releases.map((r, idx) => {
            const exe = r.assets.find(a => a.name.toLowerCase().includes('setup') && a.name.endsWith('.exe'))
                     || r.assets.find(a => a.name.endsWith('.exe'));
            const totalDl = r.assets.reduce((sum, a) => sum + (a.download_count || 0), 0);
            return {
                version:      r.tag_name,
                name:         r.name || r.tag_name,
                isLatest:     idx === 0,
                isPrerelease: r.prerelease,
                downloadUrl:  exe ? exe.browser_download_url : `https://github.com/${REPO}/releases/tag/${r.tag_name}`,
                size:         exe ? `${(exe.size / 1024 / 1024).toFixed(0)} MB` : '—',
                downloads:    totalDl.toLocaleString(),
                downloadCount: totalDl,
                changelog:    r.body || '',
                date:         new Date(r.published_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
                htmlUrl:      r.html_url
            };
        });

        localStorage.setItem(CACHE_KEY_ALL, JSON.stringify({ data, timestamp: Date.now() }));
        return data;
    } catch (err) {
        console.warn('[YT-Deluxe] Releases fetch failed.', err.message);
        return null;
    }
}

// ============================================================
// Render: index.html — Hero, Download, Download Stats
// ============================================================
async function renderRelease() {
    const [release, allReleases] = await Promise.all([fetchLatestRelease(), fetchAllReleases(5)]);

    // Hero version badge
    const versionBadge = document.getElementById('version-badge');
    if (versionBadge) versionBadge.textContent = release.version;

    // Download buttons
    const mainDownloadBtn = document.getElementById('main-download-btn');
    if (mainDownloadBtn && release.downloadUrl) mainDownloadBtn.href = release.downloadUrl;

    const heroDownloadBtn = document.getElementById('hero-download-btn');
    if (heroDownloadBtn && release.downloadUrl) heroDownloadBtn.href = release.downloadUrl;

    const heroBtnVer = document.getElementById('hero-btn-version');
    if (heroBtnVer) heroBtnVer.textContent = release.version;

    // Meta text under download button
    const downloadMeta = document.getElementById('download-meta');
    if (downloadMeta) downloadMeta.textContent = `Windows 10/11 \u2022 ${release.version} \u2022 ${release.size}`;

    const mainDownloadMeta = document.getElementById('main-download-meta');
    if (mainDownloadMeta) mainDownloadMeta.textContent = `${release.version} \u2022 ${release.date}`;

    // Dynamic SHA-256 Hash and Command
    const shaHashEl = document.getElementById('dynamic-sha-hash');
    if (shaHashEl) shaHashEl.textContent = release.sha256 || 'F03055B6ED82662FA73E4803931F6CD853F75E79736D3EC36581271A3B94FCCC';

    const shaCmdEl = document.getElementById('dynamic-sha-cmd');
    if (shaCmdEl) {
        const exeName = release.exeName || `YT-Deluxe-Setup-${release.version}.exe`;
        shaCmdEl.textContent = `Get-FileHash "${exeName}" -Algorithm SHA256`;
    }

    // Analytics stats
    const statDownloads = document.getElementById('stat-downloads');
    if (statDownloads) statDownloads.textContent = release.downloads !== '—' ? release.downloads : '—';

    const statViews = document.getElementById('stat-views');
    if (statViews) statViews.textContent = getPageViews().toLocaleString();

    // Dynamic changelog on index.html
    if (allReleases && allReleases.length > 0) {
        renderIndexChangelog(allReleases);
    }
}

// ============================================================
// Render: index.html — Release History section (dynamic)
// ============================================================
function renderIndexChangelog(releases) {
    const container = document.getElementById('changelog-container');
    if (!container) return;

    container.innerHTML = releases.map((r, i) => {
        const badge = r.isLatest
            ? `<span class="bg-[#14234b] text-[#5584ff] font-bold px-3 py-1 rounded-full text-[10px] tracking-widest uppercase">LATEST</span>`
            : r.isPrerelease
                ? `<span class="bg-white/5 text-amber-400/70 font-bold px-3 py-1 rounded-full text-[10px] tracking-widest uppercase">PRE-RELEASE</span>`
                : `<span class="bg-white/5 text-white/40 font-bold px-3 py-1 rounded-full text-[10px] tracking-widest uppercase">STABLE</span>`;

        const nameLabel = r.isLatest ? 'Production' : r.isPrerelease ? 'Pre-release' : 'Stable';
        const versionColor = r.isLatest ? 'text-white' : 'text-white/60';

        // Parse changelog body into bullet points
        const bullets = parseChangelogBullets(r.changelog);
        const bulletHTML = bullets.length
            ? `<ul class="list-disc pl-5 space-y-2">${bullets.map(b => `<li>${b}</li>`).join('')}</ul>`
            : `<p class="text-white/30 italic text-xs">No release notes available.</p>`;

        const dlBadge = r.downloads !== '0' && r.downloads !== '—'
            ? `<span class="px-2 py-1 rounded-md bg-[#5584ff]/10 border border-[#5584ff]/20 text-xs font-semibold text-[#5584ff] flex items-center gap-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>${r.downloads} downloads</span>`
            : '';

        return `<div class="changelog-item bg-[#0a0a0c] border border-white/[0.04] rounded-[2.5rem] hover:bg-[#0f0f11] transition-colors group cursor-pointer overflow-hidden reveal-on-scroll opacity-0 translate-y-8 scale-95 transition-all duration-700 ${i > 0 ? 'delay-' + (i * 100) : ''}">
            <button class="w-full flex flex-col md:flex-row items-start md:items-center justify-between p-5 md:px-8 outline-none text-left">
                <div class="flex items-center space-x-4">
                    ${badge}
                    <span class="${versionColor} font-bold md:text-lg">${r.version} <span class="text-white/40 font-normal ml-1">${nameLabel}</span></span>
                </div>
                <div class="flex items-center gap-3 text-sm mt-3 md:mt-0 font-medium tracking-wide">
                    ${dlBadge}
                    <span class="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-white/50 text-[11px]">${r.date}</span>
                </div>
            </button>
            <div class="grid grid-rows-[0fr] opacity-0 transition-all duration-300 ease-in-out group-[.is-open]:grid-rows-[1fr] group-[.is-open]:opacity-100">
                <div class="overflow-hidden">
                    <div class="px-5 md:px-8 pb-6 pt-4 border-t border-white/[0.04] mx-4 md:mx-8 text-white/50 text-sm">
                        ${bulletHTML}
                        <div class="mt-6 flex gap-3">
                            <a href="${r.downloadUrl}" target="_blank" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#5584ff]/10 border border-[#5584ff]/20 text-[#5584ff] hover:bg-[#5584ff]/20 transition-colors font-medium text-xs">Download &rarr;</a>
                            <a href="${r.htmlUrl}" target="_blank" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors font-medium text-xs">View on GitHub &rarr;</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');

    // Re-bind accordion events
    const items = container.querySelectorAll('.changelog-item');
    items.forEach(item => {
        const btn = item.querySelector('button');
        if (btn) {
            btn.addEventListener('click', () => {
                const isOpen = item.classList.contains('is-open');
                items.forEach(o => o.classList.remove('is-open'));
                if (!isOpen) item.classList.add('is-open');
            });
        }
    });

    // Re-observe dynamically injected reveal-on-scroll elements
    // (global observer runs before these cards exist in DOM)
    const newRevealEls = container.querySelectorAll('.reveal-on-scroll');
    if (newRevealEls.length > 0) {
        const dynamicObs = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    el.classList.remove('opacity-0', 'translate-y-8', 'scale-95');
                    el.classList.add('opacity-100', 'translate-y-0', 'scale-100');
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

        newRevealEls.forEach(el => dynamicObs.observe(el));
    }
}

// ============================================================
// Render: updates.html — Dynamic Full Changelog + Release Notes
// ============================================================
async function renderUpdatesPage() {
    const [latest, allReleases] = await Promise.all([fetchLatestRelease(), fetchAllReleases(5)]);

    // -- Analytics bar --
    const statDlEl  = document.getElementById('stat-total-downloads');
    const statPvEl  = document.getElementById('stat-page-views');
    const statVerEl = document.getElementById('stat-latest-version');
    if (statDlEl)  statDlEl.textContent  = latest.downloads !== '—' ? latest.downloads : '—';
    if (statPvEl)  statPvEl.textContent  = getPageViews().toLocaleString();
    if (statVerEl) statVerEl.textContent = latest.version;

    // -- Full Changelog (collapsible list) --
    const changelogContainer = document.getElementById('dynamic-changelog');
    if (changelogContainer && allReleases && allReleases.length > 0) {
        changelogContainer.innerHTML = allReleases.map((r, i) => {
            const bullets = parseChangelogBullets(r.changelog);
            const bulletHTML = bullets.length
                ? bullets.map(b => `<li class="flex items-start gap-3 text-sm text-white/50 leading-relaxed">
                    <svg class="w-5 h-5 text-accent shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    ${b}</li>`).join('')
                : `<li class="text-white/30 italic text-xs">No release notes available.</li>`;

            const badge = r.isLatest
                ? `<span class="px-2 py-0.5 rounded-md bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider">Latest</span>`
                : r.isPrerelease
                    ? `<span class="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400/70 text-[10px] font-bold uppercase tracking-wider">Pre-release</span>`
                    : `<span class="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/30 text-[10px] font-bold uppercase tracking-wider">Stable</span>`;

            const dlBadge = r.downloads !== '0' && r.downloads !== '—'
                ? `<span class="px-2 py-1 rounded-md bg-[#5584ff]/10 border border-[#5584ff]/20 text-xs font-semibold text-[#5584ff] flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    ${r.downloads} downloads</span>`
                : '';

            return `<div class="glass-card border-white/5 relative overflow-hidden reveal-on-scroll" data-version-card="${i}">
                <button class="w-full flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 gap-4 text-left" onclick="toggleVersionCard(this)">
                    <div>
                        <div class="flex items-center gap-3 mb-1">
                            <span class="${r.isLatest ? 'text-2xl' : 'text-xl'} font-bold text-white">${r.version}</span>
                            ${badge}
                        </div>
                        <p class="text-white/30 text-sm">${r.date}</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                        ${dlBadge}
                        <span class="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/40">Desktop</span>
                        <svg class="chevron-icon w-5 h-5 text-white/30 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                </button>
                <div class="version-body border-t border-white/[0.05]">
                    <div class="p-6 md:p-8">
                        <ul class="space-y-3 mb-6">${bulletHTML}</ul>
                        <div class="flex gap-4 pt-4 border-t border-white/[0.05]">
                            <a href="${r.downloadUrl}" target="_blank" class="text-accent hover:text-blue-300 transition-colors text-sm font-medium">↓ Download ${r.version}</a>
                            <a href="${r.htmlUrl}" target="_blank" class="text-white/30 hover:text-white/60 transition-colors text-sm">View on GitHub →</a>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    } else if (changelogContainer) {
        changelogContainer.innerHTML = `<p class="text-white/30 text-center py-10">Loading release data…</p>`;
    }

    // -- Release Notes (latest release body rendered as markdown) --
    const releaseNotesEl = document.getElementById('release-notes-body');
    if (releaseNotesEl && latest.changelog) {
        // Strip out the build guide and duplicate verification cards from website notes
        let cleanedChangelog = latest.changelog;
        
        // 1. Remove the build guide section
        cleanedChangelog = cleanedChangelog.replace(/###?\s*.*?(?:Release Integrity|Hash Generation Guide)[\s\S]*?(?=---\s*\n|$)/gi, '');
        
        // 2. Remove the duplicate Verify Download Integrity blockquote
        cleanedChangelog = cleanedChangelog.replace(/>\s*\[!IMPORTANT\]\s*\n>\s*\*\*Verify Download Integrity[\s\S]*?Get-FileHash[\s\S]*?```/gi, '');
        
        // 3. Remove trailing/multiple consecutive dividers if any
        cleanedChangelog = cleanedChangelog.replace(/---\s*\n\s*---/g, '---').trim();

        if (typeof marked !== 'undefined') {
            releaseNotesEl.innerHTML = marked.parse(cleanedChangelog);
        } else {
            // Fallback: simple line rendering
            releaseNotesEl.innerHTML = '<ul class="space-y-2">' +
                parseChangelogBullets(cleanedChangelog)
                    .map(b => `<li class="flex items-start gap-2 text-sm text-white/60">
                        <svg class="w-4 h-4 text-accent shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        ${b}</li>`).join('') +
                '</ul>';
        }
        const releaseVersionEl = document.getElementById('release-notes-version');
        if (releaseVersionEl) releaseVersionEl.textContent = latest.version;
        const releaseDateEl = document.getElementById('release-notes-date');
        if (releaseDateEl) releaseDateEl.textContent = latest.date;
        const releaseDownloadBtn = document.getElementById('release-notes-download');
        if (releaseDownloadBtn) releaseDownloadBtn.href = latest.downloadUrl;

        // Dynamic SHA-256 Hash and Command on Updates Page
        const shaHashEl = document.getElementById('dynamic-sha-hash');
        if (shaHashEl) shaHashEl.textContent = latest.sha256 || 'F03055B6ED82662FA73E4803931F6CD853F75E79736D3EC36581271A3B94FCCC';

        const shaCmdEl = document.getElementById('dynamic-sha-cmd');
        if (shaCmdEl) {
            const exeName = latest.exeName || `YT-Deluxe-Setup-${latest.version}.exe`;
            shaCmdEl.textContent = `Get-FileHash "${exeName}" -Algorithm SHA256`;
        }
    }
}

// ============================================================
// Helper: Parse markdown changelog body into bullet strings
// ============================================================
function parseChangelogBullets(body) {
    if (!body) return [];
    return body.split('\n')
        .map(line => line.trim())
        .map(line => {
            // Strip blockquote prefix if followed by a bullet
            if (line.startsWith('>')) {
                const after = line.slice(1).trim();
                if (after.startsWith('- ') || after.startsWith('* ') || after.startsWith('+ ')) {
                    return after;
                }
            }
            return line;
        })
        .filter(line => line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ '))
        .map(line => line.slice(2).trim())
        .filter(text => {
            const lower = text.toLowerCase();
            return !lower.includes('sha-256') &&
                   !lower.includes('get-filehash') &&
                   !lower.includes('verification command') &&
                   !lower.includes('setup.exe') &&
                   !lower.includes('iscc.exe') &&
                   !lower.includes('installer') &&
                   !lower.includes('integrity');
        })
        .map(text => {
            // Strip leading commit hash link: [d78230e](https://github.com/.../commit/...) -
            return text.replace(/^\[[a-f0-9]{7,}\]\(https:\/\/github\.com\/.*?\/commit\/[a-f0-9]+\)\s*-\s*/i, '');
        })
        .map(text => {
            // Parse **bold** to <strong>bold</strong>
            text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white/90">$1</strong>');
            // Parse `code` to <code>code</code>
            text = text.replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 py-0.5 rounded text-white/80 font-mono text-[11px]">$1</code>');
            return text;
        })
        .filter(Boolean)
        .slice(0, 12); // cap at 12 bullets
}

// ============================================================
// Toggle collapse for version cards (updates.html)
// ============================================================
window.toggleVersionCard = function(btn) {
    const card = btn.closest('[data-version-card]');
    if (!card) return;
    const body    = card.querySelector('.version-body');
    const chevron = card.querySelector('.chevron-icon');
    if (!body) return;
    
    const isOpen = body.classList.contains('is-open');
    if (!isOpen) {
        // Open
        body.classList.add('is-open');
        body.style.maxHeight = body.scrollHeight + 'px';
        chevron && chevron.classList.add('rotate-180');
        
        // Allow height to auto-adjust for screen resizing after transition
        setTimeout(() => {
            if (body.classList.contains('is-open')) {
                body.style.maxHeight = 'none';
            }
        }, 500);
    } else {
        // Close
        body.style.maxHeight = body.scrollHeight + 'px';
        // Force reflow
        body.offsetHeight;
        
        body.classList.remove('is-open');
        body.style.maxHeight = '0px';
        chevron && chevron.classList.remove('rotate-180');
    }
};

// ============================================================
// Clipboard Utility: Copy text and show success feedback
// ============================================================
window.copyToClipboard = function(elementId, btn) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const text = el.textContent || el.innerText;
    navigator.clipboard.writeText(text).then(() => {
        // Success feedback: turn copy icon into a green checkmark
        const originalSVG = btn.innerHTML;
        btn.innerHTML = `<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;
        btn.classList.add('bg-emerald-500/10');
        setTimeout(() => {
            btn.innerHTML = originalSVG;
            btn.classList.remove('bg-[#5584ff]/10', 'bg-emerald-500/10');
        }, 1500);
    }).catch(err => {
        console.error('[YT-Deluxe] Copy failed:', err);
    });
};

// ============================================================
// DOMContentLoaded — Unified Listener
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

    // Track this page view
    trackPageView();

    // Force dark mode
    const htmlEl = document.documentElement;
    htmlEl.classList.add('dark');
    htmlEl.classList.remove('light');
    localStorage.setItem('theme', 'dark');

    // Detect which page we're on and call the right renderer
    const isUpdatesPage = !!document.getElementById('dynamic-changelog') || !!document.getElementById('release-notes-body');
    if (isUpdatesPage) {
        renderUpdatesPage();
    } else {
        renderRelease();
    }

    // --- Mock reCAPTCHA ---
    const mockCaptcha     = document.getElementById('captcha-mock');
    const mainDownloadBtn = document.getElementById('main-download-btn');
    if (mockCaptcha && mainDownloadBtn) {
        mainDownloadBtn.addEventListener('click', (e) => {
            if (!mockCaptcha.checked) {
                e.preventDefault();
                alert('Please verify that you are not a robot by checking the reCAPTCHA box.');
                const box = mockCaptcha.closest('div.p-4');
                if (box) {
                    box.classList.add('border-red-500', 'bg-red-500/10');
                    setTimeout(() => box.classList.remove('border-red-500', 'bg-red-500/10'), 1500);
                }
            }
        });
        mockCaptcha.addEventListener('change', () => {
            if (mockCaptcha.checked) {
                const box = mockCaptcha.closest('div.p-4');
                if (box) box.classList.remove('border-red-500', 'bg-red-500/10');
            }
        });
    }

    // --- FAQ Accordion ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const btn = item.querySelector('button');
        if (btn) btn.addEventListener('click', () => {
            const isOpen = item.classList.contains('is-open');
            faqItems.forEach(o => o.classList.remove('is-open'));
            if (!isOpen) item.classList.add('is-open');
        });
    });

    // --- Static Changelog Accordion (fallback for non-dynamic) ---
    const changelogItems = document.querySelectorAll('.changelog-item');
    changelogItems.forEach(item => {
        const btn = item.querySelector('button');
        if (btn) btn.addEventListener('click', () => {
            const isOpen = item.classList.contains('is-open');
            changelogItems.forEach(o => o.classList.remove('is-open'));
            if (!isOpen) item.classList.add('is-open');
        });
    });

    // --- Reveal on Scroll ---
    const revealEls = document.querySelectorAll('.reveal-on-scroll');
    if (revealEls.length > 0) {
        const obs = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    el.classList.remove('opacity-0', 'translate-y-8', 'scale-95',
                        ...Array.from(el.classList).filter(c => c.startsWith('delay-')));
                    el.classList.add('opacity-100', 'translate-y-0', 'scale-100');
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
        revealEls.forEach(el => obs.observe(el));
    }

    // --- Timeline Scroll Animation ---
    const timelineContainer = document.getElementById('timeline-container');
    const timelineProgress  = document.getElementById('timeline-progress');
    const timelineSteps     = document.querySelectorAll('.timeline-step');
    if (timelineContainer && timelineProgress) {
        const stepObs = new IntersectionObserver((entries) => {
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
        timelineSteps.forEach(s => stepObs.observe(s));

        const timelineBgLine = document.getElementById('timeline-bg-line');
        window.addEventListener('scroll', () => {
            const rect     = timelineContainer.getBoundingClientRect();
            const lastStep = timelineSteps[timelineSteps.length - 1];
            if (!lastStep) return;
            const lastCircle  = lastStep.querySelector('.timeline-circle');
            const maxLineH    = lastStep.offsetTop + (lastCircle ? lastCircle.offsetTop + lastCircle.offsetHeight / 2 : 0);
            if (timelineBgLine) timelineBgLine.style.height = `${maxLineH}px`;
            const windowH  = window.innerHeight;
            const start    = rect.top - windowH / 2;
            let progressPx = 0;
            if (start < 0) progressPx = Math.min(maxLineH, Math.max(0, -start));
            timelineProgress.style.height = `${progressPx}px`;
        });
        window.dispatchEvent(new Event('scroll'));
    }

    // --- Mobile Menu ---
    const mobileMenuBtn     = document.getElementById('mobile-menu-btn');
    const mobileDrawer      = document.getElementById('mobile-drawer');
    const mobileOverlay     = document.getElementById('mobile-overlay');
    const mobileDrawerClose = document.getElementById('mobile-drawer-close');
    if (mobileMenuBtn && mobileDrawer && mobileOverlay) {
        function setMenuState(isOpen) {
            mobileDrawer.classList.toggle('is-open', isOpen);
            mobileMenuBtn.classList.toggle('is-active', isOpen);
            mobileOverlay.classList.toggle('is-open', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        }
        mobileMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); setMenuState(!mobileDrawer.classList.contains('is-open')); });
        if (mobileDrawerClose) mobileDrawerClose.addEventListener('click', (e) => { e.stopPropagation(); setMenuState(false); });
        mobileOverlay.addEventListener('click', () => setMenuState(false));

        const dropdowns = mobileDrawer.querySelectorAll('.mobile-drawer-dropdown');
        dropdowns.forEach(dropdown => {
            const btn = dropdown.querySelector('.mobile-drawer-dropdown-btn');
            if (btn) btn.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                dropdowns.forEach(o => { if (o !== dropdown) o.classList.remove('is-open'); });
                dropdown.classList.toggle('is-open');
            });
        });
        mobileDrawer.querySelectorAll('.mobile-drawer-link:not(.mobile-drawer-dropdown-btn), .mobile-drawer-sublink')
            .forEach(link => link.addEventListener('click', () => setMenuState(false)));
    }

    // --- Smooth Scroll ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            try {
                const targetEl = document.querySelector(href);
                if (targetEl) { e.preventDefault(); targetEl.scrollIntoView({ behavior: 'smooth' }); }
            } catch { /* ignore */ }
        });
    });

    // --- updates.html Scroll Spy ---
    const navLinks = document.querySelectorAll('.nav-link-item[href^="#"]');
    if (navLinks.length > 0) {
        window.addEventListener('scroll', () => {
            let current = 'changelog';
            const faqSection = document.getElementById('faq');
            if (faqSection && window.scrollY + 200 >= faqSection.offsetTop) current = 'faq';
            navLinks.forEach(link => {
                const href = link.getAttribute('href').replace('#', '');
                if (href === current) {
                    link.classList.add('nav-link-active');
                    link.classList.remove('text-white/70', 'hover:text-white', 'nav-link-item');
                } else {
                    link.classList.remove('nav-link-active');
                    link.classList.add('text-white/70', 'hover:text-white', 'nav-link-item');
                }
            });
        });
    }
});
