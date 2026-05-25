import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const LicenseAndDisclaimer = () => {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center space-y-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-inner">
          <Icon name="Scale" size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">{t('legal.licenseTitle', 'License & Disclaimer')}</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mt-2">
            {t('legal.licenseSubtitle', 'Important legal information, open-source licenses, and usage disclaimers for YT Deluxe.')}
          </p>
        </div>
      </motion.div>

      {/* License Section */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 space-y-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
          <Icon name="BookOpen" size={120} />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
            <Icon name="BookOpen" size={20} className="text-primary" />
            GNU General Public License v3.0
          </h3>
          <div className="prose prose-sm dark:prose-invert text-muted-foreground leading-relaxed space-y-4 w-full text-center">
            <p>
              This project is licensed under the <strong>GNU General Public License v3.0 (GPL-3.0)</strong>.
            </p>
            
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 my-4 shadow-glass-sm max-w-2xl mx-auto text-center">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                <Icon name="HeartHandshake" size={16} className="text-primary" />
                Community Intent: Personal & Non-Commercial Use
              </h4>
              <p className="text-xs">
                While the GPL-3.0 license guarantees your right to use, modify, and distribute the code, the primary intent of this project is for <strong>personal, educational, and non-commercial use</strong>. We strongly discourage using this software for commercial monetization, selling, or hiding it behind paywalls. Please respect the open-source spirit and keep it free for everyone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 w-full">
              <div className="flex flex-col items-center">
                <h4 className="text-sm font-bold text-success mb-3 flex items-center justify-center gap-2">
                  <Icon name="CheckCircle" size={16} />
                  You are free to:
                </h4>
                <ul className="space-y-2 text-xs text-left max-w-xs">
                  <li className="flex items-start gap-2"><Icon name="Check" size={14} className="text-success shrink-0 mt-0.5" /> Use this software for personal or educational purposes</li>
                  <li className="flex items-start gap-2"><Icon name="Check" size={14} className="text-success shrink-0 mt-0.5" /> Study and inspect the source code</li>
                  <li className="flex items-start gap-2"><Icon name="Check" size={14} className="text-success shrink-0 mt-0.5" /> Modify it for your own use</li>
                  <li className="flex items-start gap-2"><Icon name="Check" size={14} className="text-success shrink-0 mt-0.5" /> Distribute your modifications, provided they remain under GPL-3.0</li>
                </ul>
              </div>
              
              <div className="flex flex-col items-center">
                <h4 className="text-sm font-bold text-destructive mb-3 flex items-center justify-center gap-2">
                  <Icon name="XCircle" size={16} />
                  You may not:
                </h4>
                <ul className="space-y-2 text-xs text-left max-w-xs">
                  <li className="flex items-start gap-2"><Icon name="X" size={14} className="text-destructive shrink-0 mt-0.5" /> Distribute this software under a different license</li>
                  <li className="flex items-start gap-2"><Icon name="X" size={14} className="text-destructive shrink-0 mt-0.5" /> Use this in a closed-source/proprietary product without complying with GPL terms</li>
                  <li className="flex items-start gap-2"><Icon name="X" size={14} className="text-destructive shrink-0 mt-0.5" /> Remove copyright or license notices</li>
                  <li className="flex items-start gap-2"><Icon name="X" size={14} className="text-destructive shrink-0 mt-0.5" /> Use the "YT Deluxe" name or branding for unofficial forks without permission</li>
                </ul>
              </div>
            </div>
            
            <p className="text-xs mt-4 pt-4 border-t border-border/50 text-center w-full">
              All third-party libraries used in this project retain their own licenses. 
            </p>
          </div>
        </div>
      </motion.div>

      {/* Disclaimer Section */}
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 space-y-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
          <Icon name="AlertTriangle" size={120} />
        </div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-amber-500 mb-6 flex items-center justify-center gap-2">
            <Icon name="AlertTriangle" size={20} />
            Disclaimer
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border/50 hover:border-amber-500/30 transition-colors flex flex-col items-center text-center">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                <Icon name="Slash" size={16} className="text-amber-500" />
                No Affiliation
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                YT Deluxe is <strong>not affiliated with, endorsed by, or sponsored by YouTube, Google LLC</strong>, or any of their subsidiaries in any way. All YouTube trademarks, service marks, trade names, and logos are the property of their respective owners.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/50 hover:border-amber-500/30 transition-colors flex flex-col items-center text-center">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                <Icon name="ShieldOff" size={16} className="text-amber-500" />
                No Legal Responsibility
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The developers of YT Deluxe take no responsibility for the misuse of this software, any legal consequences arising from its use, or any content downloaded using this tool.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/50 hover:border-amber-500/30 transition-colors flex flex-col items-center text-center">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                <Icon name="Activity" size={16} className="text-amber-500" />
                Stability
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                YT Deluxe depends on yt-dlp and YouTube's internal APIs. These may break without notice due to changes on YouTube's end. The developers make no guarantees of continued functionality.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/50 hover:border-amber-500/30 transition-colors flex flex-col items-center text-center">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                <Icon name="AlertOctagon" size={16} className="text-amber-500" />
                Use at Your Own Risk
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Downloading copyrighted content without permission may be illegal in your country. You are fully responsible for your own actions and compliance with local laws.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LicenseAndDisclaimer;
