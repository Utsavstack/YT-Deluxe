import { useTranslation } from "react-i18next";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from 'components/ui/Button';
import Icon from 'components/AppIcon';

const NotFound = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-zinc-900 relative overflow-hidden p-4">
      
      {/* Premium Ambient Background Blurs */}
      <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] animate-pulse opacity-60 dark:opacity-20 pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[32rem] h-[32rem] bg-accent/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] animate-pulse opacity-60 dark:opacity-20 pointer-events-none" style={{ animationDelay: '2s' }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
        className="relative z-10 glass-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(255,255,255,0.05)] p-10 md:p-16 rounded-[40px] border border-white/40 dark:border-white/10 flex flex-col items-center text-center max-w-2xl w-full bg-white/70 dark:bg-black/40 backdrop-blur-3xl"
      >
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [-12, 12, -12] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative mb-6 flex justify-center items-center"
        >
          {/* Abstract 404 Text */}
          <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary via-primary/80 to-accent opacity-90 drop-shadow-2xl">
            404
          </h1>
          
          <motion.div 
            className="absolute -top-4 -right-12 md:-right-8"
            animate={{ rotate: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-full shadow-xl border border-black/5 dark:border-white/10 text-primary">
              <Icon name="Ghost" size={36} strokeWidth={2.5} />
            </div>
          </motion.div>
        </motion.div>

        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 tracking-tight">
          {t("common.pageNotFound", "Oops! Page Not Found")}
        </h2>
        
        <p className="text-[16px] text-muted-foreground/90 mb-10 max-w-[85%] leading-relaxed">
          {t("common.thePageYoureLooking", "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.history?.back()}
            className="flex items-center justify-center gap-2 rounded-full px-8 py-3.5 font-bold text-[15px] bg-slate-200/70 dark:bg-zinc-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors w-full sm:w-auto shadow-sm"
          >
            <Icon name="ArrowLeft" size={18} />
            {t("common.goBack", "Go Back")}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 rounded-full px-8 py-3.5 font-bold text-[15px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_20px_-8px_var(--color-primary)] transition-colors w-full sm:w-auto"
          >
            <Icon name="Home" size={18} />
            {t("common.backToHome", "Back to Home")}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;