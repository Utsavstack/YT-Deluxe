import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const AboutYTDeluxe = () => {
  const { t } = useTranslation();

  const features = [
    {
      title: t('aboutUs.feat1Title'),
      description: t('aboutUs.feat1Desc'),
      icon: 'Search'
    },
    {
      title: t('aboutUs.feat2Title'),
      description: t('aboutUs.feat2Desc'),
      icon: 'Download'
    },
    {
      title: t('aboutUs.feat3Title'),
      description: t('aboutUs.feat3Desc'),
      icon: 'Scissors'
    },
    {
      title: t('aboutUs.feat4Title'),
      description: t('aboutUs.feat4Desc'),
      icon: 'Sliders'
    },
    {
      title: t('aboutUs.feat5Title'),
      description: t('aboutUs.feat5Desc'),
      icon: 'Cpu'
    },
    {
      title: t('aboutUs.feat6Title'),
      description: t('aboutUs.feat6Desc'),
      icon: 'Shield'
    },
    {
      title: t('aboutUs.feat7Title'),
      description: t('aboutUs.feat7Desc'),
      icon: 'Languages'
    },
    {
      title: t('aboutUs.feat8Title'),
      description: t('aboutUs.feat8Desc'),
      icon: 'History'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
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
      {/* Hero & About Section */}
      <motion.div variants={itemVariants} className="glass-card overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
        <div className="relative p-8 md:p-10 flex flex-col items-center space-y-10">
          
          {/* Logo and Title */}
          <div className="flex flex-col items-center text-center space-y-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="flex items-center justify-center w-22 h-20 cursor-pointer drop-shadow-2xl"
            >
              <motion.img
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                src="/assets/images/logo.webp"
                alt="YT-Deluxe"
                className="w-full h-full object-contain"
              />
            </motion.div>
            <div className="space-y-2">
              <motion.h1
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl allan-bold text-foreground tracking-tight"
              >
                YT-Deluxe
              </motion.h1>
              <p className="text-base md:text-md text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
                {t('aboutUs.heroSubtitle')}
              </p>
              <div className="flex items-center justify-center space-x-2 pt-2">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">v1.1.0</span>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">{t('aboutUs.prodReady')}</span>
              </div>
            </div>
          </div>

          {/* About Text Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full pt-8 border-t border-border/50 text-left">
            {/* About Section */}
            <motion.div whileHover={{ y: -3 }} className="space-y-4 group/about p-5 -m-5 rounded-2xl border border-transparent hover:border-primary/10 hover:bg-primary/5 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover/about:bg-primary group-hover/about:text-white transition-all duration-300 group-hover/about:scale-110 group-hover/about:shadow-glass-sm">
                  <Icon name="Info" size={20} />
                </div>
                <h2 className="text-xl font-bold text-foreground group-hover/about:text-primary transition-colors">{t('aboutUs.aboutTitle')}</h2>
              </div>
              <div className="pl-4 border-l-2 border-primary/20 space-y-4 text-muted-foreground text-sm font-medium leading-relaxed group-hover/about:border-primary/50 transition-colors">
                <p>
                  <strong className="text-foreground">YT Deluxe</strong> {t('aboutUs.aboutText1').replace('YT Deluxe ', '')}
                </p>
                <p>
                  {t('aboutUs.aboutText2')}
                </p>
              </div>
            </motion.div>

            {/* Future Vision Section */}
            <motion.div whileHover={{ y: -3 }} className="space-y-4 group/future p-5 -m-5 rounded-2xl border border-transparent hover:border-success/10 hover:bg-success/5 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success shrink-0 group-hover/future:bg-success group-hover/future:text-white transition-all duration-300 group-hover/future:scale-110 group-hover/future:shadow-glass-sm">
                  <Icon name="Eye" size={20} />
                </div>
                <h2 className="text-xl font-bold text-foreground group-hover/future:text-success transition-colors">{t('aboutUs.futureTitle')}</h2>
              </div>
              <div className="pl-4 border-l-2 border-success/20 space-y-4 text-muted-foreground text-sm font-medium leading-relaxed group-hover/future:border-success/50 transition-colors">
                <p>{t('aboutUs.futureText1')}</p>
                <p>{t('aboutUs.futureText2')}</p>
              </div>
            </motion.div>
          </div>

        </div>
      </motion.div>

      {/* Features Full Width */}
      <motion.div id="features-section" variants={itemVariants} className="glass-card p-6 md:p-8 flex flex-col">
        <h2 className="text-xl font-bold text-foreground mb-8 flex items-center gap-2"> 
          <Icon name="Feature" size={20} className="text-amber-500" />
          {t('aboutUs.premiumEdge')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -3 }}
              className="flex flex-col space-y-3 group cursor-default p-4 rounded-xl hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-glass-sm transition-all duration-300">
                <Icon name={feature.icon} size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight mb-2">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Developer Context */}
      <motion.div variants={itemVariants} className="glass-card p-8 border-t-4 border-primary/20 relative overflow-hidden group/card">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover/card:scale-110 transition-transform duration-1000">
          <Icon name="Cpu" size={180} />
        </div>
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-[8px] uppercase tracking-widest font-black text-primary">
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              <span>{t('aboutUs.devBadge')}</span>
            </div>
            <div className="flex items-center space-x-4 justify-center md:justify-start">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-glass flex items-center justify-center bg-primary/5"
              >
                <img
                  src="/assets/images/utsav.webp"
                  alt="Utsav Parmar"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Utsav+Parmar&background=0D8ABC&color=fff&size=128' }}
                />
              </motion.div>
              <div>
                <h3 className="text-xl font-black text-foreground tracking-tight">Utsav Parmar</h3>
                <p className="text-sm font-medium text-primary/80">{t('aboutUs.devRole')}</p>
              </div>
            </div>
            <p className="text-muted-foreground max-w-lg text-sm leading-relaxed">
              {t('aboutUs.devDesc')}
            </p>
          </div>

          <div className="flex flex-col space-y-3 min-w-[200px]">
            <motion.a
              whileHover={{ scale: 1.02, x: -3 }}
              whileTap={{ scale: 0.98 }}
              href="https://github.com/Utsavstack"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between group px-5 py-3 rounded-xl bg-card border border-border/50 hover:border-primary hover:bg-primary/5 transition-all duration-300 shadow-glass-sm"
            >
              <div className="flex items-center space-x-3">
                <Icon name="Github" size={20} className="group-hover:text-primary" />
                <span className="text-sm font-bold">{t('aboutUs.sourceCode')}</span>
              </div>
              <Icon name="ArrowRight" size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </motion.a>

            <motion.a
              whileHover={{ scale: 1.02, x: -3 }}
              whileTap={{ scale: 0.98 }}
              href="https://linkedin.com/in/utsavparmar-full-stack-dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between group px-5 py-3 rounded-xl bg-card border border-border/50 hover:border-primary hover:bg-primary/5 transition-all duration-300 shadow-glass-sm"
            >
              <div className="flex items-center space-x-3">
                <Icon name="Linkedin" size={20} className="group-hover:text-primary" />
                <span className="text-sm font-bold">{t('aboutUs.professional')}</span>
              </div>
              <Icon name="ArrowRight" size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </motion.a>

            <motion.a
              whileHover={{ scale: 1.02, x: -3 }}
              whileTap={{ scale: 0.98 }}
              href="https://instagram.com/_its_me_utsav_"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between group px-5 py-3 rounded-xl bg-card border border-border/50 hover:border-primary hover:bg-primary/5 transition-all duration-300 shadow-glass-sm"
            >
              <div className="flex items-center space-x-3">
                <Icon name="Instagram" size={20} className="group-hover:text-primary" />
                <span className="text-sm font-bold">Instagram</span>
              </div>
              <Icon name="ArrowRight" size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </motion.a>

            <motion.a
              whileHover={{ scale: 1.02, x: -3 }}
              whileTap={{ scale: 0.98 }}
              href="https://x.com/iutsavparmar"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between group px-5 py-3 rounded-xl bg-card border border-border/50 hover:border-primary hover:bg-primary/5 transition-all duration-300 shadow-glass-sm"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 group-hover:text-primary transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z"/></svg>
                <span className="text-sm font-bold">Twitter</span>
              </div>
              <Icon name="ArrowRight" size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </motion.a>
          </div>
        </div>
      </motion.div>

      {/* Philosophy Footer */}
      <motion.div variants={itemVariants} className="text-center space-y-2 opacity-60 pb-8 group transition-opacity hover:opacity-100">
        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10">
          <p className="text-xs font-bold tracking-wider text-foreground">{t('aboutUs.footerBanner')}</p>
        </div>
        <div className="flex items-center justify-center space-x-4 text-xs font-medium text-muted-foreground mt-2">
          <span>{t('aboutUs.footerText')}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AboutYTDeluxe;
