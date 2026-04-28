import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 28 } }
  };

  const neverCollected = [
    { labelKey: 'userAccounts', icon: 'UserX' },
    { labelKey: 'analytics', icon: 'BarChart2' },
    { labelKey: 'crashReports', icon: 'AlertCircle' },
    { labelKey: 'cookies', icon: 'Globe' },
    { labelKey: 'ipAddresses', icon: 'Wifi' },
    { labelKey: 'browsingBehavior', icon: 'EyeOff' },
  ];

  const storedLocally = [
    { labelKey: 'downloadHistory', detailKey: 'downloadHistoryDetail', icon: 'HardDrive' },
    { labelKey: 'prefsLanguage', detailKey: 'prefsLanguageDetail', icon: 'Settings' },
    { labelKey: 'themeDisplay', detailKey: 'themeDisplayDetail', icon: 'Palette' },
  ];

  const principles = [
    { key: 'zeroExfiltration', icon: 'Zap', color: 'blue' },
    { key: 'localFiles', icon: 'Lock', color: 'green' },
    { key: 'noAnalytics', icon: 'EyeOff', color: 'red' },
  ];

  const principleStyle = {
    blue: { bg: 'bg-primary/5', border: 'border-primary/10', iconBg: 'bg-primary/10', text: 'text-primary' },
    green: { bg: 'bg-success/5', border: 'border-success/10', iconBg: 'bg-success/10', text: 'text-success' },
    red: { bg: 'bg-destructive/5', border: 'border-destructive/10', iconBg: 'bg-destructive/10', text: 'text-destructive' },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-5 max-w-4xl mx-auto"
    >
      {/* ── Hero Card ── */}
      <motion.div variants={itemVariants} className="glass-card p-7 md:p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.08, rotate: 6 }}
                className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg"
              >
                <Icon name="ShieldCheck" size={26} />
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{t('privacyPolicy.title')}</h1>
                <p className="text-xs text-muted-foreground font-medium mt-1">{t('privacyPolicy.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-black text-success uppercase tracking-widest">Zero Data Collected</span>
            </div>
          </div>

          {/* Manifesto */}
          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/15 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/20 rounded-l-2xl" />
            <div className="flex items-start space-x-3 ml-3">
              <Icon name="Lock" size={17} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-black text-foreground">{t('privacyPolicy.manifestoTitle')}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t('privacyPolicy.manifestoText')}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Never Collected ── */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Icon name="ShieldOff" size={15} className="text-destructive" />
          </div>
          <h2 className="text-base font-black text-foreground">{t('privacyPolicy.section1')}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5 leading-relaxed font-medium">{t('privacyPolicy.q1Text')}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {neverCollected.map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-destructive/5 border border-destructive/10 hover:border-destructive/30 transition-all duration-200"
            >
              <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <Icon name={item.icon} size={13} className="text-destructive" />
              </div>
              <span className="text-xs font-semibold text-foreground leading-tight">{t(`privacyPolicy.${item.labelKey}`)}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Stored Locally + Third-Party ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Stored Locally */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center">
              <Icon name="HardDrive" size={15} className="text-success" />
            </div>
            <h2 className="text-base font-black text-foreground">{t('privacyPolicy.q2Title')}</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{t('privacyPolicy.q2Text')}</p>
          <div className="space-y-2.5">
            {storedLocally.map((item, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-success/5 border border-success/10">
                <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name={item.icon} size={13} className="text-success" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{t(`privacyPolicy.${item.labelKey}`)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-mono leading-relaxed">{t(`privacyPolicy.${item.detailKey}`)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Third-Party Services */}
        <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-warning/10 flex items-center justify-center">
              <Icon name="ExternalLink" size={15} className="text-warning" />
            </div>
            <h2 className="text-base font-black text-foreground">{t('privacyPolicy.q3Title')}</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{t('privacyPolicy.q3Text')}</p>

          <div className="flex-1 space-y-3">
            <div className="flex items-start space-x-3 p-4 rounded-xl bg-warning/5 border border-warning/15 group hover:border-warning/30 transition-all duration-200">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <Icon name="Youtube" size={14} className="text-warning" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{t('privacyPolicy.ytGoogleTitle')}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{t('privacyPolicy.ytGoogleDesc')}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 rounded-xl bg-muted/10 border border-border/30 group hover:border-border/60 transition-all duration-200">
              <div className="w-8 h-8 rounded-lg bg-muted/20 flex items-center justify-center shrink-0">
                <Icon name="BadgeCheck" size={14} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{t('privacyPolicy.noServicesTitle')}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{t('privacyPolicy.noServicesDesc')}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Sovereignty Principles ── */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon name="Shield" size={15} className="text-primary" />
          </div>
          <h2 className="text-base font-black text-foreground">{t('privacyPolicy.section2')}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5 italic leading-relaxed">{t('privacyPolicy.firstPrinciple')}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {principles.map((item) => {
            const s = principleStyle[item.color];
            return (
              <motion.div
                key={item.key}
                whileHover={{ y: -2 }}
                className={`p-4 rounded-xl ${s.bg} border ${s.border} transition-all duration-200`}
              >
                <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
                  <Icon name={item.icon} size={15} className={s.text} />
                </div>
                <h3 className="text-xs font-bold text-foreground mb-1.5">{t(`privacyPolicy.${item.key}Title`)}</h3>
                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{t(`privacyPolicy.${item.key}Desc`)}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Web Mode Ephemeral ── */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8">
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-8 h-8 rounded-xl bg-warning/10 flex items-center justify-center">
            <Icon name="Cpu" size={15} className="text-warning" />
          </div>
          <h2 className="text-base font-black text-foreground">{t('privacyPolicy.section3')}</h2>
        </div>
        <div className="flex flex-col md:flex-row items-start gap-4 p-5 rounded-2xl bg-warning/5 border border-warning/20">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">{t('privacyPolicy.ephemeral')}</p>
          </div>
          <div className="shrink-0 inline-flex items-center space-x-2 px-3 py-2 rounded-xl bg-warning/10 border border-warning/25">
            <Icon name="Activity" size={13} className="text-warning animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-warning">{t('privacyPolicy.daemon')}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Footer ── */}
      <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground font-semibold">{t('privacyPolicy.lastUpdated')}</p>
        <motion.a
          whileHover={{scale: 1.01 }}
          href="https://github.com/Utsavstack/YT-Deluxe"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-3 px-5 py-2.5 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/30 hover:bg-primary/10 transition-all duration-200 group"
        >
          <Icon name="Github" size={16} className="text-primary" />
          <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{t('privacyPolicy.audit')}</span>
          <Icon name="ExternalLink" size={12} className="text-muted-foreground group-hover:text-primary transition-colors" />
        </motion.a>
      </motion.div>
    </motion.div>
  );
};

export default PrivacyPolicy;
