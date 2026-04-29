import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const FloatingActionButton = () => {
 const [isExpanded, setIsExpanded] = useState(false);
 const navigate = useNavigate();

 const quickActions = [

  {
   id: 'history',
   label: 'Download History',
   icon: 'History',
   action: () => navigate('/download-history-management')
  },
  {
   id: 'settings',
   label: 'Settings',
   icon: 'Settings',
   action: () => navigate('/user-settings-preferences')
  }
 ];

 const handleQuickAction = (action) => {
  action();
  setIsExpanded(false);
 };

 // Framer Motion variants
 const backdropVariants = {
   hidden: { opacity: 0 },
   show: { opacity: 1, transition: { duration: 0.3 } },
   exit: { opacity: 0, transition: { duration: 0.3 } }
 };

 const menuVariants = {
  hidden: { opacity: 0 },
  show: {
   opacity: 1,
   transition: {
    staggerChildren: 0.08,
    delayChildren: 0.05
   }
  },
  exit: {
   opacity: 0,
   transition: {
    staggerChildren: 0.05,
    staggerDirection: -1
   }
  }
 };

 const itemVariants = {
  hidden: { opacity: 0, y: 15, x: 10, scale: 0.8 },
  show: { 
    opacity: 1, 
    y: 0, 
    x: 0,
    scale: 1, 
    transition: { type: 'spring', stiffness: 400, damping: 25 } 
  },
  exit: { 
    opacity: 0, 
    y: 10, 
    x: 10,
    scale: 0.8, 
    transition: { duration: 0.2 } 
  }
 };

 return (
  <div className="fixed bottom-[110px] md:bottom-12 right-6 z-[110] flex flex-col items-end">
   
   {/* Dark Backdrop for Focus */}
   <AnimatePresence>
    {isExpanded && (
     <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="fixed inset-0 bg-background/40 backdrop-blur-sm -z-10 cursor-pointer"
      onClick={() => setIsExpanded(false)}
     />
    )}
   </AnimatePresence>

   {/* Quick Action Menu */}
   <div className="relative w-full mb-4 flex justify-end">
     <AnimatePresence>
      {isExpanded && (
       <motion.div 
         variants={menuVariants}
         initial="hidden"
         animate="show"
         exit="exit"
         className="absolute bottom-0 right-0 flex flex-col items-end space-y-3"
       >
        {quickActions?.map((action) => (
         <motion.div
          key={action?.id}
          variants={itemVariants}
          className="flex items-center space-x-3 group"
         >
          {/* Label Badge (Always visible when expanded for clear UX) */}
          <div className="menu-glass-card px-4 py-2 rounded-2xl text-[13px] font-bold text-foreground shadow-glass-md whitespace-nowrap cursor-pointer hover:bg-card hover:text-primary transition-colors" onClick={() => handleQuickAction(action?.action)}>
           {action?.label}
          </div>
          
          {/* Action Button */}
          <motion.button
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           onClick={() => handleQuickAction(action?.action)}
           className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center menu-glass-card border border-border/50 hover:border-primary/40 hover:bg-muted text-muted-foreground hover:text-primary shadow-glass-lg transition-all"
           title={action?.label}
          >
           <Icon name={action?.icon} size={20} strokeWidth={2.5} />
          </motion.button>
         </motion.div>
        ))}
       </motion.div>
      )}
     </AnimatePresence>
   </div>

   {/* Main Interactive FAB */}
   <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.9 }}
    onClick={() => setIsExpanded(!isExpanded)}
    className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center border transition-all duration-300 relative z-50
      ${isExpanded 
        ? 'bg-card border-border shadow-glass-xl text-muted-foreground hover:text-destructive' 
        : 'bg-gradient-to-tr from-primary to-accent border-white/20 text-white shadow-[0_8px_30px_rgba(var(--color-primary-rgb),0.5)]'
      }
    `}
   >
    <motion.div 
      animate={{ rotate: isExpanded ? 225 : 0 }} 
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
     <Icon name="Plus" size={26} strokeWidth={2.5} />
    </motion.div>
   </motion.button>

  </div>
 );
};

export default FloatingActionButton;