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
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] w-full max-w-sm px-4"
        >
          <div className="glass-card shadow-glass-2xl overflow-hidden border-primary/20 bg-primary/10">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Icon name="Trash2" size={16} />
                </div>
                <p className="text-sm font-medium text-foreground">{message}</p>
              </div>
              
              <button
                onClick={onUndo}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:scale-105 transition-transform shadow-lg"
              >
                UNDO
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1 bg-primary/10 w-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
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
