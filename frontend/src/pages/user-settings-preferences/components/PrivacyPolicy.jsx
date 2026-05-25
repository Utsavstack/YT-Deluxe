import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 25 } }
  };

  const neverCollected = [
    { labelKey: 'userAccounts', icon: 'UserX', desc: 'No signup, no profiles, no passwords.' },
    { labelKey: 'analytics', icon: 'BarChart2', desc: 'Zero trackers, no telemetry.' },
    { labelKey: 'crashReports', icon: 'AlertCircle', desc: 'Errors stay local on your PC.' },
    { labelKey: 'cookies', icon: 'Globe', desc: 'No tracking cookies or marketing pixels.' },
    { labelKey: 'ipAddresses', icon: 'Wifi', desc: 'We never log or trace your IP.' },
    { labelKey: 'browsingBehavior', icon: 'EyeOff', desc: 'Your search inputs are never tracked.' },
  ];

  const storedLocally = [
    { labelKey: 'downloadHistory', detailKey: 'downloadHistoryDetail', icon: 'HardDrive' },
    { labelKey: 'prefsLanguage', detailKey: 'prefsLanguageDetail', icon: 'Settings' },
    { labelKey: 'themeDisplay', detailKey: 'themeDisplayDetail', icon: 'Palette' },
  ];

  const principles = [
    { key: 'zeroExfiltration', icon: 'Zap', num: '01' },
    { key: 'localFiles', icon: 'Lock', num: '02' },
    { key: 'noAnalytics', icon: 'EyeOff', num: '03' },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 max-w-5xl mx-auto relative px-1"
    >
      {/* ── Ambient Background Glow (Single subtle primary glow) ── */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* ── Section 1: Hero Dashboard Card ── */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 relative overflow-hidden border border-border/50 shadow-glass-lg bg-white/40 dark:bg-black/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-border/30">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.03, rotate: 2 }}
                className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner shrink-0"
              >
                <Icon name="ShieldCheck" size={26} />
              </motion.div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{t('privacyPolicy.title')}</h1>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">{t('privacyPolicy.subtitle')}</p>
              </div>
            </div>

            {/* Clean Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/50 shadow-sm text-xs font-semibold text-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span>Zero Telemetry</span>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/50 shadow-sm text-xs font-semibold text-foreground">
                <span>Local-First</span>
              </div>
            </div>
          </div>

          {/* Signed Guarantee Manifesto */}
          <div className="p-5 rounded-2xl bg-white/30 dark:bg-white/[0.02] border border-border/40 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 p-6 opacity-[0.02] select-none pointer-events-none translate-x-2 translate-y-2">
              <Icon name="Lock" size={100} />
            </div>
            <div className="flex items-start space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <Icon name="Lock" size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{t('privacyPolicy.manifestoTitle')}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-3xl">
                  {t('privacyPolicy.manifestoText')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Section 2: Zero Telemetry (Never Collected) ── */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 border border-border/50 bg-white/40 dark:bg-black/20">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Icon name="ShieldOff" size={16} />
          </div>
          <h2 className="text-base font-bold text-foreground tracking-tight">{t('privacyPolicy.section1')}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5 max-w-2xl leading-relaxed font-medium">
          {t('privacyPolicy.q1Text')}
        </p>

        {/* Dynamic Grid Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {neverCollected.map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -2 }}
              className="flex items-start gap-3.5 p-4 rounded-xl bg-card border border-border/40 hover:border-primary/20 transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-muted border border-border/30 flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                <Icon name={item.icon} size={15} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground leading-tight flex items-center gap-1.5">
                  {t(`privacyPolicy.${item.labelKey}`)}
                  <span className="text-[9px] font-bold text-muted-foreground bg-muted border border-border/60 px-1.5 py-0.5 rounded shrink-0">Never</span>
                </h4>
                <p className="text-[10px] text-muted-foreground mt-1 leading-normal">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Section 3: Data Flow Map (Local Domain vs External Domain) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: Stays on Your Device */}
        <motion.div variants={itemVariants} className="glass-card p-6 border border-border/50 bg-white/40 dark:bg-black/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Icon name="HardDrive" size={16} />
              </div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">{t('privacyPolicy.q2Title')}</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              {t('privacyPolicy.q2Text')}
            </p>
            
            <div className="space-y-2.5">
              {storedLocally.map((item, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-card border border-border/40">
                  <div className="w-7 h-7 rounded-lg bg-muted border border-border/30 flex items-center justify-center shrink-0 mt-0.5 text-muted-foreground">
                    <Icon name={item.icon} size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground leading-tight">{t(`privacyPolicy.${item.labelKey}`)}</p>
                    <code className="inline-block text-[10px] text-primary mt-1 font-mono leading-relaxed bg-primary/5 px-2 py-0.5 rounded border border-primary/10 truncate max-w-full">
                      {t(`privacyPolicy.${item.detailKey}`)}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-border/30 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
            <Icon name="Check" size={11} className="text-primary" />
            <span>Securely contained under user sandbox permissions</span>
          </div>
        </motion.div>

        {/* Right Side: External Encrypted Tunnel */}
        <motion.div variants={itemVariants} className="glass-card p-6 border border-border/50 bg-white/40 dark:bg-black/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Icon name="ExternalLink" size={16} />
              </div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">{t('privacyPolicy.q3Title')}</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              {t('privacyPolicy.q3Text')}
            </p>

            <div className="space-y-2.5">
              <div className="flex items-start space-x-3 p-3 rounded-xl bg-card border border-border/40">
                <div className="w-7 h-7 rounded-lg bg-muted border border-border/30 flex items-center justify-center shrink-0 mt-0.5 text-muted-foreground">
                  <Icon name="Youtube" size={13} />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground leading-tight">{t('privacyPolicy.ytGoogleTitle')}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{t('privacyPolicy.ytGoogleDesc')}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-card border border-border/40">
                <div className="w-7 h-7 rounded-lg bg-muted border border-border/30 flex items-center justify-center shrink-0 mt-0.5 text-muted-foreground">
                  <Icon name="BadgeCheck" size={13} />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground leading-tight">{t('privacyPolicy.noOtherServices', t('privacyPolicy.noServicesTitle'))}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{t('privacyPolicy.noServicesDesc')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/30 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
            <Icon name="Activity" size={11} className="text-primary" />
            <span>Requests sent directly from client to YouTube endpoint</span>
          </div>
        </motion.div>
      </div>

      {/* ── Section: App Permissions & Usage ── */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 border border-border/50 bg-white/40 dark:bg-black/20">
        <div className="flex items-center space-x-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Icon name="ShieldCheck" size={16} />
          </div>
          <h2 className="text-base font-bold text-foreground tracking-tight">App Permissions & Usage</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5 leading-relaxed font-medium">
          YT Deluxe requests permissions locally to enhance your experience. These are stored on-device and can be revoked anytime in Settings &gt; App Permissions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border/40 hover:border-primary/20 transition-all duration-200">
            <div className="flex items-center space-x-2.5 mb-2 text-primary">
              <Icon name="ClipboardPaste" size={15} />
              <h4 className="text-xs font-bold text-foreground">Clipboard Access (Read)</h4>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Used to detect YouTube links from your clipboard for instant auto-pasting. We never read or store any other clipboard data.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/40 hover:border-primary/20 transition-all duration-200">
            <div className="flex items-center space-x-2.5 mb-2 text-primary">
              <Icon name="Clipboard" size={15} />
              <h4 className="text-xs font-bold text-foreground">Clipboard Copy (Write)</h4>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Used to copy video titles, description text, and direct share URLs to your device clipboard upon request.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/40 hover:border-primary/20 transition-all duration-200">
            <div className="flex items-center space-x-2.5 mb-2 text-primary">
              <Icon name="Bell" size={15} />
              <h4 className="text-xs font-bold text-foreground">Desktop Notifications</h4>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Used to alert you in the background when a video download, conversion, or precision trim operation is completed.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/40 hover:border-primary/20 transition-all duration-200">
            <div className="flex items-center space-x-2.5 mb-2 text-primary">
              <Icon name="Mic" size={15} />
              <h4 className="text-xs font-bold text-foreground">Microphone Access</h4>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Used exclusively to capture voice inputs when you activate the hands-free search bar. Audio is processed purely on-device.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Section 4: Sovereignty Principles (3 Column Cards) ── */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 border border border-border/50 bg-white/40 dark:bg-black/20">
        <div className="flex items-center space-x-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Icon name="Shield" size={16} />
          </div>
          <h2 className="text-base font-bold text-foreground tracking-tight">{t('privacyPolicy.section2')}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5 italic max-w-2xl leading-relaxed font-medium">
          {t('privacyPolicy.firstPrinciple')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {principles.map((item) => (
            <motion.div
              key={item.key}
              whileHover={{ y: -2 }}
              className="p-5 rounded-2xl bg-card border border-border/45 transition-all duration-200 relative overflow-hidden group"
            >
              <div className="absolute right-3 bottom-0 text-6xl font-black font-mono select-none pointer-events-none opacity-[0.02] text-foreground">
                {item.num}
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/10 flex items-center justify-center mb-3 shrink-0 text-primary">
                <Icon name={item.icon} size={15} />
              </div>
              <h3 className="text-xs font-bold text-foreground mb-1.5">{t(`privacyPolicy.${item.key}Title`)}</h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">{t(`privacyPolicy.${item.key}Desc`)}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Section 5: Web Mode Ephemeral Processing ── */}
      <motion.div variants={itemVariants} className="glass-card p-6 border border-border/50 bg-white/40 dark:bg-black/20">
        <div className="flex items-center space-x-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Icon name="Cpu" size={16} />
          </div>
          <h2 className="text-base font-bold text-foreground tracking-tight">{t('privacyPolicy.section3')}</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 p-4 rounded-xl bg-card border border-border/40">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              {t('privacyPolicy.ephemeral')}
            </p>
          </div>
          
          <div className="shrink-0 flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-muted border border-border/50 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground">
              {t('privacyPolicy.daemon')}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Section 6: Verified Audit Footer ── */}
      <motion.div variants={itemVariants} className="glass-card p-5 border border-border/50 bg-white/40 dark:bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-glass-md relative overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <p className="text-[11px] text-muted-foreground font-bold">{t('privacyPolicy.lastUpdated')} • Code Auditable</p>
        </div>

        <motion.a
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href="https://github.com/Utsavstack/YT-Deluxe"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:shadow-lg cursor-pointer"
        >
          <Icon name="Github" size={14} className="text-white" />
          <span className="text-xs font-bold tracking-wide uppercase">{t('privacyPolicy.audit')}</span>
          <Icon name="ExternalLink" size={12} className="text-white/80" />
        </motion.a>
      </motion.div>
    </motion.div>
  );
};

export default PrivacyPolicy;
