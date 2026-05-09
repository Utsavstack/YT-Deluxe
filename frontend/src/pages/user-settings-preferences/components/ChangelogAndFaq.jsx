import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const ChangelogAndFaq = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('changelog');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const changelog = [
    {
      version: 'v1.1.0',
      date: 'May 2026',
      type: 'latest',
      changes: [
        'Added multi-language support (i18n integration)',
        'Improved download engine stability & parsing speed',
        'Enhanced dark mode aesthetic with liquid glass design',
        'Added responsive gallery and mobile drawers'
      ]
    },
    {
      version: 'v1.0.5',
      date: 'April 2026',
      type: 'stable',
      changes: [
        'Fixed playlist downloading issues with large counts',
        'Optimized background processes to reduce memory usage',
        'Refined installer experience for Windows'
      ]
    },
    {
      version: 'v1.0.0',
      date: 'March 2026',
      type: 'stable',
      changes: [
        'Initial Release of YT Deluxe',
        'High-speed video and audio downloading',
        'Local settings, custom themes and preferences'
      ]
    }
  ];

  const faqs = [
    {
      id: 1,
      q: 'How do I download entire playlists?',
      a: 'Simply paste the playlist URL into the main download input. The app will automatically detect that it is a playlist and present you with options to select which videos you want to download.'
    },
    {
      id: 2,
      q: 'Where are my downloaded files saved?',
      a: 'By default, files are saved in your system\'s Downloads folder. You can customize this path and set up sub-folders based on channels or dates in the "Downloads" preferences tab.'
    },
    {
      id: 3,
      q: 'Can I download videos in 4K resolution?',
      a: 'Absolutely! If the source video is available in 4K or 8K, you can select the highest quality option in your preferences or right before hitting the download button.'
    },
    {
      id: 4,
      q: 'Does this app track my usage or collect data?',
      a: 'No. YT Deluxe is completely local-first and does not track, collect, or transmit your personal data. All processing happens on your machine.'
    }
  ];

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

  const tabVariants = {
    hidden: (isFaq) => ({ opacity: 0, x: isFaq ? 20 : -20 }),
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeInOut', staggerChildren: 0.1 } },
    exit: (isFaq) => ({ opacity: 0, x: isFaq ? -20 : 20, transition: { duration: 0.2 } })
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header Tabs */}
      <div className="flex space-x-2 p-1.5 bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl w-full max-w-md mx-auto mb-8 shadow-glass-sm">
        <button
          onClick={() => setActiveTab('changelog')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'changelog' ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'}`}
        >
          <Icon name="FileText" size={16} />
          <span>{t('updates.changelog', 'Changelog')}</span>
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'faq' ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'}`}
        >
          <Icon name="HelpCircle" size={16} />
          <span>{t('updates.faq', 'FAQ')}</span>
        </button>
      </div>

      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'changelog' ? (
            <motion.div
              key="changelog"
              custom={false}
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <Icon name="History" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">{t('updates.versionHistory', 'Version History')}</h2>
                  <p className="text-sm text-muted-foreground">{t('updates.historyDesc', 'Track the evolution of YT Deluxe')}</p>
                </div>
              </div>

              <div className="space-y-5">
                {changelog.map((log, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="glass-card p-6 border-l-4 group transition-all duration-400 hover:-translate-y-1.5 hover:shadow-glass-lg relative overflow-hidden"
                    style={{ borderLeftColor: log.type === 'latest' ? 'var(--primary)' : 'var(--border)' }}
                  >
                    {log.type === 'latest' && (
                      <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3 relative z-10">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-black text-foreground tracking-tight">{log.version}</h3>
                        {log.type === 'latest' && (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 shadow-sm">
                            {t('updates.latest', 'Latest')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground flex items-center space-x-1.5 bg-card/50 px-3 py-1.5 rounded-lg border border-border/50">
                        <Icon name="Calendar" size={14} />
                        <span>{log.date}</span>
                      </span>
                    </div>
                    <ul className="space-y-3 relative z-10">
                      {log.changes.map((change, cIdx) => (
                        <li key={cIdx} className="flex items-start space-x-3 text-sm text-muted-foreground group-hover:text-foreground/90 transition-colors duration-300">
                          <Icon name="CheckCircle" size={16} className="mt-0.5 text-primary/70 shrink-0" />
                          <span className="leading-relaxed">{change}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="faq"
              custom={true}
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                  <Icon name="MessageCircle" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">{t('updates.frequentlyAsked', 'Frequently Asked Questions')}</h2>
                  <p className="text-sm text-muted-foreground">{t('updates.faqDesc', 'Find answers to common questions')}</p>
                </div>
              </div>

              <div className="space-y-4">
                {faqs.map((faq) => (
                  <motion.div
                    key={faq.id}
                    variants={itemVariants}
                    className={`glass-card overflow-hidden transition-all duration-300 border ${expandedFaq === faq.id ? 'border-primary/40 bg-primary/[0.03] shadow-glass-md' : 'border-border/40 hover:border-primary/20 hover:bg-card/60'}`}
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                      className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                    >
                      <span className={`text-sm font-bold transition-colors ${expandedFaq === faq.id ? 'text-primary' : 'text-foreground'}`}>{faq.q}</span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${expandedFaq === faq.id ? 'bg-primary/10 text-primary' : 'bg-card/50 text-muted-foreground'}`}>
                        <Icon
                          name="ChevronDown"
                          size={16}
                          className={`transition-transform duration-400 ease-in-out ${expandedFaq === faq.id ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedFaq === faq.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/20 pt-4">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
              
              <motion.div variants={itemVariants} className="mt-10 p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/20 transition-colors duration-700" />
                <Icon name="LifeBuoy" size={32} className="mx-auto mb-4 text-primary drop-shadow-md" />
                <h3 className="text-lg font-black text-foreground mb-2">{t('updates.stillNeedHelp', 'Still need help?')}</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">{t('updates.contactSupport', 'Our support team and community are always ready to assist you.')}</p>
                <a href="https://github.com/Utsavstack/YT-Deluxe/issues" target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300">
                  <Icon name="Github" size={18} />
                  <span>{t('updates.openIssue', 'Open an Issue')}</span>
                </a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ChangelogAndFaq;
