import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  const transparencySections = [
    {
      title: t('privacyPolicy.q1Title'),
      content: t('privacyPolicy.q1Text'),
      icon: 'Database'
    },
    {
      title: t('privacyPolicy.q2Title'),
      content: t('privacyPolicy.q2Text'),
      icon: 'HelpCircle'
    },
    {
      title: t('privacyPolicy.q3Title'),
      content: t('privacyPolicy.q3Text'),
      icon: 'MapPin'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-10 group hover:shadow-glass transition-all duration-500">
        <div className="flex items-center space-x-4 mb-8">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 10 }}
            className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"
          >
            <Icon name="Shield" size={24} />
          </motion.div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">{t('privacyPolicy.title')}</h1>
            <p className="text-xs text-muted-foreground font-medium">{t('privacyPolicy.subtitle')}</p>
          </div>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-4 bg-primary/5 rounded-xl border border-primary/20 mb-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <p className="text-base font-bold m-0 flex items-center">
              <Icon name="Lock" size={18} className="mr-3 text-primary" />
              {t('privacyPolicy.manifestoTitle')}
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-0 ml-7 italic">
              {t('privacyPolicy.manifestoText')}
            </p>
          </motion.div>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-foreground border-b-2 border-primary/10 pb-2 flex items-center">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs mr-3">01</span>
              {t('privacyPolicy.section1')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {transparencySections.map((section, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -3 }}
                  className="space-y-3 p-5 rounded-xl bg-card/30 border border-border/50 hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex items-center space-x-2 text-primary">
                    <div className="p-1.5 rounded-lg bg-primary/5">
                      <Icon name={section.icon} size={18} />
                    </div>
                    <h3 className="text-sm font-black text-foreground m-0 tracking-tight">{section.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed m-0 font-medium">{section.content}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="mt-12 space-y-4">
            <h2 className="text-xl font-black text-foreground border-b-2 border-primary/10 pb-2 flex items-center">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs mr-3">02</span>
              {t('privacyPolicy.section2')}
            </h2>
            <div className="glass p-6 rounded-2xl border border-border/40 space-y-4">
              <p className="text-muted-foreground text-sm font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: t('privacyPolicy.firstPrinciple') }} />
              <ul className="space-y-3 text-muted-foreground font-medium text-xs">
                <li className="flex items-start space-x-2">
                  <Icon name="CheckCircle" size={16} className="text-success mt-0.5 shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: t('privacyPolicy.zeroExfiltration') }} />
                </li>
                <li className="flex items-start space-x-2">
                  <Icon name="CheckCircle" size={16} className="text-success mt-0.5 shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: t('privacyPolicy.localFiles') }} />
                </li>
                <li className="flex items-start space-x-2">
                  <Icon name="CheckCircle" size={16} className="text-success mt-0.5 shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: t('privacyPolicy.noAnalytics') }} />
                </li>
              </ul>
            </div>
          </section>

          <section className="mt-12 space-y-4">
            <h2 className="text-xl font-black text-foreground border-b-2 border-primary/10 pb-2 flex items-center">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs mr-3">03</span>
              {t('privacyPolicy.section3')}
            </h2>
            <div className="flex items-start p-5 glass rounded-xl border border-warning/30 group hover:shadow-glass-sm transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning mr-4 group-hover:bg-warning group-hover:text-white transition-colors shrink-0">
                <Icon name="Cpu" size={20} />
              </div>
              <div className="flex-1 space-y-4">
                <p className="text-sm text-muted-foreground m-0 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: t('privacyPolicy.ephemeral') }} />
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-warning/5 border border-warning/20 group-hover:bg-warning/10 transition-colors">
                  <Icon name="Activity" size={14} className="text-warning animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-warning/90 mt-0.5">{t('privacyPolicy.daemon')}</span>
                </div>
              </div>
            </div>
          </section>

          <footer className="mt-12 text-center pt-8 border-t border-border/30">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="inline-flex items-center space-x-3 px-6 py-3 rounded-xl glass-card border-primary/10 shadow-glass-sm"
            >
              <div className="flex items-center space-x-2 text-primary">
                <Icon name="Github" size={16} />
                <span className="text-xs font-black tracking-widest uppercase">{t('privacyPolicy.audit')}</span>
              </div>
              <a href="https://github.com/Utsavstack/YT-Deluxe" target="_blank" rel="noopener noreferrer" className="text-xs text-foreground hover:text-primary font-bold underline decoration-primary/30 transition-colors">
                Utsavstack / Architecture
              </a>
            </motion.div>
            <p className="text-[12px] text-muted-foreground font-black mt-6">
              {t('privacyPolicy.lastUpdated')}
            </p>
          </footer>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PrivacyPolicy;
