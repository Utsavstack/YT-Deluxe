import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../utils/ThemeContext';
import Icon from '../AppIcon';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="menu-glass-card flex items-center justify-center w-11 h-11 p-0 cursor-pointer group relative overflow-hidden"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait">
        {theme === 'light' ? (
          <motion.div
            key="sun"
            initial={{ y: 20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.3, ease: "anticipate" }}
            className="flex items-center justify-center"
          >
            <Icon name="Sun" size={20} className="text-amber-500" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ y: 20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.3, ease: "anticipate" }}
            className="flex items-center justify-center"
          >
            <Icon name="Moon" size={20} className="text-blue-400" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Subtle background glow that matches the current theme icon */}
      <motion.div 
        className={`absolute inset-0 -z-10 opacity-20 blur-xl ${theme === 'light' ? 'bg-amber-400' : 'bg-blue-600'}`}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </motion.button>
  );
};

export default ThemeToggle;
