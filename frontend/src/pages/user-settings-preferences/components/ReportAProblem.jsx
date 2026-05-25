import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const REPO = 'Utsavstack/YT-Deluxe';
const APP_VERSION = `v${import.meta.env.VITE_APP_VERSION || '1.0.0-beta'}`;

// ── Pre-Known Issues ──────────────────────────────────────────────────────────
const KNOWN_ISSUES = [
  {
    id: 'ki-1',
    title: 'App opens but shows a blank white screen',
    severity: 'common',
    description:
      'This usually happens when Microsoft Edge WebView2 Runtime is missing or corrupted. The installer should have installed it automatically.',
    fix: 'Reinstall YT Deluxe using the Setup installer it will silently fix WebView2. Or manually install it from https://developer.microsoft.com/en-us/microsoft-edge/webview2/',
  },
  {
    id: 'ki-2',
    title: 'Downloads fail instantly or show "ERROR: Sign in to confirm"',
    severity: 'common',
    description:
      'YouTube sometimes blocks downloads from new IP addresses or regions. The PO Token provider handles this automatically, but it may need a refresh.',
    fix: 'Go to the download page, wait a few seconds, and retry. If it persists, restart the app so a fresh PO Token is generated. Keeping yt-dlp updated also helps.',
  },
  {
    id: 'ki-3',
    title: 'Port 8000 conflict app opens but nothing loads',
    severity: 'technical',
    description:
      'If another application (like a dev server) is already using port 8000, the backend cannot start and the UI shows empty content.',
    fix: 'Close any other app running on port 8000 (e.g. uvicorn, Docker). In PowerShell: netstat -ano | findstr :8000 to find the process, then taskkill /PID <id> /F',
  },
  {
    id: 'ki-4',
    title: 'Video downloads as separate video + audio files',
    severity: 'rare',
    description:
      'For 1080p+ content, YouTube serves video and audio as separate DASH streams. FFmpeg is supposed to merge them automatically, but if ffmpeg.exe is missing or corrupted, the merge step fails silently.',
    fix: 'Ensure backend/ffmpeg.exe exists and is not blocked by antivirus. Reinstalling via the Setup installer will restore it.',
  },
  {
    id: 'ki-5',
    title: 'App crashes on startup with antivirus warning',
    severity: 'common',
    description:
      'Some antivirus software (Windows Defender, Avast, Norton) may flag the bundled .exe as suspicious because it\'s a PyInstaller bundle. This is a false positive.',
    fix: 'Add the YT Deluxe installation folder (C:\\Program Files\\YT Deluxe) to your antivirus exclusion list. The source code is fully open on GitHub for inspection.',
  },
  {
    id: 'ki-6',
    title: 'Trimmed video has no audio or wrong duration',
    severity: 'rare',
    description:
      'The precision trimmer uses FFmpeg stream copy (-c copy) for speed, which cuts at the nearest keyframe. For some videos, this can cause slight timing mismatches.',
    fix: 'Try adjusting the trim start/end by a few seconds. If the issue persists, report it with the exact video URL and trim timestamps.',
  },
];

// ── Severity badge colors ────────────────────────────────────────────────────
const SEVERITY_STYLE = {
  common:    { label: 'Common', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  technical: { label: 'Technical', bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  rare:      { label: 'Rare', bg: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
};

// ── Animation variants ────────────────────────────────────────────────────────
const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden:  { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

// ── Helper: Build GitHub issue URL with pre-filled content ─────────────────
function buildIssueUrl({ title, description, logContent }) {
  const envInfo = [
    `**App Version:** ${APP_VERSION}`,
    `**OS:** Windows ${navigator.userAgent.includes('Windows NT 10') ? '10/11' : 'Unknown'}`,
    `**User Agent:** ${navigator.userAgent}`,
    `**Timestamp:** ${new Date().toISOString()}`,
  ].join('\n');

  let body = `## Bug Report\n\n### Description\n${description || '_No description provided._'}\n\n### Environment\n${envInfo}\n`;

  if (logContent) {
    // Trim log content to last 100 lines (GitHub has URL length limits)
    const trimmed = logContent.split('\n').slice(-100).join('\n');
    body += `\n### Log File (last 100 lines)\n\`\`\`\n${trimmed}\n\`\`\`\n`;
  }

  body += '\n---\n_Generated via YT Deluxe > Settings > Report a Problem_';

  const params = new URLSearchParams({
    title: title || '[Bug] ',
    body,
    labels: 'bug',
  });

  return `https://github.com/${REPO}/issues/new?${params.toString()}`;
}

// ── Main Component ────────────────────────────────────────────────────────────
const ReportAProblem = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [logContent, setLogContent] = useState('');
  const [logFileName, setLogFileName] = useState('');
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // ── Handle log file pick ────────────────────────────────────────────────
  const handleLogFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setLogContent(ev.target.result || '');
    reader.readAsText(file);
  };

  const clearLogFile = () => {
    setLogContent('');
    setLogFileName('');
  };

  // ── Submit → Open GitHub Issue ──────────────────────────────────────────
  const handleSubmit = () => {
    const url = buildIssueUrl({ title, description, logContent });
    window.open(url, '_blank', 'noopener,noreferrer');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const canSubmit = title.trim().length > 3;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* ── Section 1: Bug Report Form ───────────────────────────────────── */}
      <motion.div variants={itemVariants} className="glass-card p-6 border border-border/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner">
            <Icon name="Bug" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Report a Bug</h2>
            <p className="text-sm text-muted-foreground">
              Describe the issue and attach your log files for faster diagnosis
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Bug Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Downloads fail after trimming 4K videos"
              className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-white/5 border border-border/50 text-foreground placeholder:text-muted-foreground/40 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              What happened?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you were doing, what you expected to happen, and what actually happened..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-white/5 border border-border/50 text-foreground placeholder:text-muted-foreground/40 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {/* Log File Picker */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2 text-center">
              Attach Log File
              <span className="text-xs font-normal text-muted-foreground ml-2">(optional but helpful)</span>
            </label>

            <div className="p-5 rounded-xl border border-dashed border-border/60 bg-white/40 dark:bg-white/[0.02] space-y-4">
              {/* Info about log location */}
              <div className="flex items-start gap-3 text-xs text-muted-foreground justify-center">
                <Icon name="Info" size={14} className="mt-0.5 shrink-0 text-primary/60" />
                <div className="text-center">
                  <p>
                    Log files are saved at:{' '}
                    <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-mono">
                      %APPDATA%\YT Deluxe\logs\
                    </code>
                  </p>
                  <p className="mt-1 text-muted-foreground/70">
                    Pick <strong>launcher.log</strong> (startup/UI issues) or <strong>backend.log</strong> (download/API errors)
                  </p>
                </div>
              </div>

              {/* Buttons row — centered */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* Browse Logs Folder — opens the folder in Explorer */}
                <button
                  onClick={async () => {
                    // Desktop (exe) mode: call native bridge → opens Windows Explorer
                    if (window.pywebview?.api?.open_logs_folder) {
                      try {
                        await window.pywebview.api.open_logs_folder();
                        return;
                      } catch {/* fall through */}
                    }
                    // Web / fallback: copy path to clipboard so user can navigate manually
                    try {
                      await navigator.clipboard.writeText('%APPDATA%\\YT Deluxe\\logs');
                    } catch {/* ignore */}
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-border/50 text-sm font-semibold text-foreground cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <Icon name="FolderOpen" size={16} className="text-primary" />
                  <span>Open Logs Folder</span>
                </button>

                {/* Pick a log file to attach */}
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-border/50 text-sm font-semibold text-foreground cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                  <Icon name="Paperclip" size={16} className="text-primary" />
                  <span>Attach Log File</span>
                  <input
                    type="file"
                    accept=".log,.txt"
                    onChange={handleLogFilePick}
                    className="hidden"
                  />
                </label>

                {logFileName && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                    <Icon name="FileText" size={14} className="text-primary" />
                    <span className="text-foreground font-medium">{logFileName}</span>
                    <button
                      onClick={clearLogFile}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <Icon name="X" size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Log preview */}
              {logContent && (
                <div className="mt-2 max-h-32 overflow-y-auto rounded-lg bg-black/5 dark:bg-black/30 border border-border/30 p-3">
                  <pre className="text-[11px] text-muted-foreground font-mono whitespace-pre-wrap break-all leading-relaxed">
                    {logContent.split('\n').slice(-20).join('\n')}
                  </pre>
                  <p className="text-[10px] text-muted-foreground/50 mt-2 italic text-center">
                    Showing last 20 lines • Full log (last 100 lines) will be included in the report
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button — centered */}
          <div className="flex flex-col items-center gap-3 pt-3">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                canSubmit
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5'
                  : 'bg-muted/40 text-muted-foreground cursor-not-allowed'
              }`}
            >
              <Icon name="Github" size={16} />
              {submitted ? 'Opened in GitHub!' : 'Open Issue on GitHub'}
            </button>

            {submitted && (
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-emerald-500 font-semibold flex items-center gap-1.5"
              >
                <Icon name="CheckCircle" size={14} />
                GitHub tab opened — paste your log file there if needed
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Section 2: Quick Actions ─────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex justify-center">
        {/* View All Issues */}
        <a
          href={`https://github.com/${REPO}/issues`}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-card p-5 flex items-center gap-4 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group text-left max-w-md w-full"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
            <Icon name="ExternalLink" size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">View All Issues</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browse existing reports on GitHub
            </p>
          </div>
        </a>
      </motion.div>

      {/* ── Section 3: Known Issues ──────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="glass-card p-6 border border-border/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
            <Icon name="AlertTriangle" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Known Issues</h2>
            <p className="text-sm text-muted-foreground">
              Check here before reporting your issue might already have a fix
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {KNOWN_ISSUES.map((issue) => {
            const sev = SEVERITY_STYLE[issue.severity] || SEVERITY_STYLE.common;
            const isOpen = expandedIssue === issue.id;

            return (
              <motion.div
                key={issue.id}
                variants={itemVariants}
                className={`overflow-hidden transition-all duration-300 rounded-2xl border ${
                  isOpen
                    ? 'border-primary/40 bg-primary/[0.03] shadow-glass-md'
                    : 'border-border/40 hover:border-primary/20 hover:bg-card/60'
                }`}
              >
                <button
                  onClick={() => setExpandedIssue(isOpen ? null : issue.id)}
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${sev.bg}`}>
                      {sev.label}
                    </span>
                    <span className={`text-sm font-bold transition-colors truncate ${isOpen ? 'text-primary' : 'text-foreground'}`}>
                      {issue.title}
                    </span>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ml-3 ${
                    isOpen ? 'bg-primary/10 text-primary' : 'bg-card/50 text-muted-foreground'
                  }`}>
                    <Icon
                      name="ChevronDown"
                      size={16}
                      className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-5 pb-5 space-y-3 border-t border-border/20 pt-4">
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">What happens</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{issue.description}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Icon name="Wrench" size={12} />
                            Fix
                          </p>
                          <p className="text-sm text-foreground/80 leading-relaxed">{issue.fix}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col sm:flex-row items-center gap-4"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
          <Icon name="MessageSquare" size={20} />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm font-bold text-foreground">
            Can't find your issue above?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Use the bug report form at the top to create a new GitHub issue with your logs attached.
          </p>
        </div>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/20 hover:bg-primary/20 transition-all shrink-0"
        >
          ↑ Go to Report Form
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ReportAProblem;
