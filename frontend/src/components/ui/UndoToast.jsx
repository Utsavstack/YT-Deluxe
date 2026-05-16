import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';

const UndoToast = ({ isOpen, message, onUndo, onExpire, duration = 5000 }) => {
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    if (isOpen) {
      setProgress(100);
      const startTime = Date.now();
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
        
        if (remaining <= 0) {
          clearInterval(interval);
          onExpire();
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isOpen, duration, onExpire]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: "-50%", y: "-40%", scale: 0.95 }}
          animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
          exit={{ opacity: 0, x: "-50%", y: "-40%", scale: 0.95 }}
          className="fixed top-1/2 left-1/2 z-[300] w-full max-w-[320px] px-4"
        >
          <div className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass-xl overflow-hidden">
            <div className="p-3 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <Icon name="Trash2" size={14} />
                </div>
                <p className="text-[11px] font-bold text-foreground">{message}</p>
              </div>
              
              <button
                onClick={onUndo}
                className="px-3 py-1.5 rounded-lg bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform shadow-md"
              >
                Undo
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1 bg-black/5 dark:bg-white/5 w-full overflow-hidden">
              <motion.div 
                className="h-full bg-foreground"
                initial={{ width: "100%" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UndoToast;
