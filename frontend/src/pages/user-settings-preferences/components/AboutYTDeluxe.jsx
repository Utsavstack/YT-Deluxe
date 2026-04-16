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
      icon: 'Download'
    },
    {
      title: t('aboutUs.feat2Title'),
      description: t('aboutUs.feat2Desc'),
      icon: 'Shield'
    },
    {
      title: t('aboutUs.feat3Title'),
      description: t('aboutUs.feat3Desc'),
      icon: 'Scissors'
    },
    {
      title: t('aboutUs.feat4Title'),
      description: t('aboutUs.feat4Desc'),
      icon: 'Cpu'
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
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="glass-card overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
        <div className="relative p-8 md:p-10 flex flex-col items-center text-center space-y-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-white/60 to-white/20 dark:from-white/25 dark:to-white/5 border border-white/60 dark:border-white/30 backdrop-blur-xl shadow-glass-lg cursor-pointer overflow-hidden p-3"
          >
            <motion.img
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              src="/assets/images/logo-light.png"
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
      </motion.div>

      {/* Description & Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="glass-card p-8 space-y-5 relative overflow-hidden group hover:border-primary/30 hover:shadow-glass-sm transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500" />
          <div className="flex items-center space-x-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
              <Icon name="Rocket" size={20} />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t('aboutUs.vision')}</h2>
          </div>
          <div className="relative z-10 pl-4 border-l-2 border-primary/20 space-y-4 text-muted-foreground text-sm font-medium leading-relaxed group-hover:border-primary/50 transition-colors">
            <p>
              {t('aboutUs.visionText1')}
            </p>
            <p>
              {t('aboutUs.visionText2')}
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-8 space-y-6">
          <h2 className="text-xl font-bold text-foreground">{t('aboutUs.premiumEdge')}</h2>
          <div className="grid grid-cols-1 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ x: 5 }}
                className="flex items-start space-x-4 group cursor-default"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-glass-sm transition-all duration-300">
                  <Icon name={feature.icon} size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-snug">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Developer Context */}
      <motion.div variants={itemVariants} className="glass-card p-8 border-t-4 border-primary/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
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
                  src="/assets/images/utsav.jpeg"
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
              href="https://www.linkedin.com/in/utsavparmar-full-stack-dev"
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
          </div>
        </div>
      </motion.div>

      {/* Philosophy Footer */}
      <motion.div variants={itemVariants} className="text-center space-y-2 opacity-50 pb-8 group">
        <p className="text-xs font-bold tracking-[0.2em] text-foreground">{t('aboutUs.footerBanner')}</p>
        <div className="flex items-center justify-center space-x-4 text-[10px] font-medium text-muted-foreground">
          <span>{t('aboutUs.footerText')}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AboutYTDeluxe;
