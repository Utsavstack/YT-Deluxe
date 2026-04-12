import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const TermsAndConditions = () => {
  const { t } = useTranslation();

  const guidelines = [
    {
      title: t('termsCond.g1Title'),
      content: t('termsCond.g1Desc'),
      icon: 'Heart'
    },
    {
      title: t('termsCond.g2Title'),
      content: t('termsCond.g2Desc'),
      icon: 'Youtube'
    },
    {
      title: t('termsCond.g3Title'),
      content: t('termsCond.g3Desc'),
      icon: 'BookOpen'
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
      <motion.div variants={itemVariants} className="glass-card p-6 md:p-10 hover:shadow-glass transition-all duration-500">
        <div className="flex items-center space-x-4 mb-10">
          <motion.div
            whileHover={{ scale: 1.05, rotate: -10 }}
            className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"
          >
            <Icon name="FileText" size={24} />
          </motion.div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">{t('termsCond.heroTitle')}</h1>
            <p className="text-xs text-muted-foreground font-medium italic">{t('termsCond.heroSubtitle')}</p>
          </div>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {guidelines.map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5, scale: 1.01 }}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-primary/5 border border-primary/10 group hover:bg-primary/10 hover:border-primary/30 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                <div className="mb-4 text-primary group-hover:scale-110 transition-transform duration-500">
                  <Icon name={item.icon} size={28} />
                </div>
                <h3 className="text-sm font-black text-foreground m-0 mb-2 tracking-tight">{item.title}</h3>
                <p className="text-[11px] text-muted-foreground m-0 leading-relaxed font-medium">{item.content}</p>
              </motion.div>
            ))}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.section variants={itemVariants} className="space-y-3 flex flex-col">
              <h2 className="text-lg font-black text-foreground border-b-2 border-primary/10 pb-2 flex items-center">
                <span className="text-primary mr-2">#</span> {t('termsCond.acceptance')}
              </h2>
              <div className="flex-1 flex items-start p-4 glass rounded-xl border border-border/50 group hover:border-primary/30 hover:shadow-glass-sm transition-all duration-300">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-3 group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                  <Icon name="CheckCircle" size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-1 mt-0 leading-none group-hover:text-primary transition-colors">{t('termsCond.mutualAgreement')}</h4>
                  <p className="text-xs text-muted-foreground m-0 leading-relaxed font-medium">
                    {t('termsCond.mutualAgreementDesc')}
                  </p>
                </div>
              </div>
            </motion.section>

            <motion.section variants={itemVariants} className="space-y-3">
              <h2 className="text-lg font-black text-foreground border-b-2 border-primary/10 pb-2 flex items-center">
                <span className="text-primary mr-2">#</span> {t('termsCond.usageMatrix')}
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start p-4 glass rounded-xl border border-border/50 group hover:border-primary/30 hover:shadow-glass-sm transition-all duration-300">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-3 group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                    <Icon name="Shield" size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-1 mt-0 leading-none group-hover:text-primary transition-colors">{t('termsCond.nonCommercial')}</h4>
                    <p className="text-xs text-muted-foreground m-0 leading-relaxed font-medium">
                      {t('termsCond.nonCommercialDesc')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start p-4 glass rounded-xl border border-border/50 group hover:border-primary/30 hover:shadow-glass-sm transition-all duration-300">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-3 group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                    <Icon name="Heart" size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-1 mt-0 leading-none group-hover:text-primary transition-colors">{t('termsCond.respectCreators')}</h4>
                    <p className="text-xs text-muted-foreground m-0 leading-relaxed font-medium">
                      {t('termsCond.respectCreatorsDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>

          <motion.section variants={itemVariants} className="mt-12 p-6 rounded-2xl bg-muted/10 border-2 border-dashed border-border/50 relative">
            <div className="absolute -top-3 left-8 px-3 py-0.5 rounded-full bg-yellow-400 text-black text-[8px] font-black uppercase tracking-widest">
              {t('termsCond.disclaimerBadge')}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed italic m-0">
              <span className="font-semibold text-foreground pr-1">{t('termsCond.disclaimerGuidelinePrefix')}</span>
              {t('termsCond.disclaimerText1')}

              <br />{t('termsCond.disclaimerText2')}
            </p>
          </motion.section>

          <footer className="mt-12 text-center pt-8 border-t border-border/30">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="inline-flex items-center space-x-3 px-6 py-3 rounded-xl glass-card border-primary/10 shadow-glass-sm"
            >
              <div className="flex items-center space-x-2 text-primary">
                <Icon name="Github" size={16} />
                <span className="text-xs font-black tracking-widest">{t('termsCond.auditEngine')}</span>
              </div>
              <a href="https://github.com/Utsavstack/YT-Deluxe" target="_blank" rel="noopener noreferrer" className="text-xs text-foreground hover:text-primary font-bold underline decoration-primary/30 transition-colors">
                Utsavstack / YT-Deluxe
              </a>
            </motion.div>
            <p className="text-[12px] text-muted-foreground font-black mt-6 opacity-1">
              {t('termsCond.protocol')}
            </p>
          </footer>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TermsAndConditions;
