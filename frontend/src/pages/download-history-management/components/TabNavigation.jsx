import React from 'react';
import Icon from '../../../components/AppIcon';
import { motion } from 'framer-motion';

const TabNavigation = ({ activeTab, onTabChange, counts }) => {
 const tabs = [
  {
   id: 'all',
   label: 'All Downloads',
   icon: 'Download',
   count: counts?.all || 0
  },
  {
   id: 'saved',
   label: 'Saved',
   icon: 'Bookmark',
   count: counts?.saved || 0
  }
 ];

  return (
   <div className="bg-white/90 dark:bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2rem] p-2 shadow-glass-sm inline-flex w-full md:w-auto relative hover:shadow-glass-md transition-all">
     <div className="flex items-center space-x-1 w-full relative">
      {tabs?.map((tab) => {
       const isActive = activeTab === tab?.id;
       return (
        <button
         key={tab?.id}
         onClick={() => onTabChange(tab?.id)}
         className={`relative flex-1 md:flex-none flex items-center justify-center space-x-2 px-5 py-2 rounded-full transition-colors duration-300 z-10 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isActive 
           ? 'text-primary-foreground' 
           : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10'
         }`}
        >
         {isActive && (
          <motion.div
           layoutId="active-tab-slider"
           className="absolute inset-[1px] bg-primary rounded-full shadow-md z-[-1]"
           transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
         )}
         <Icon name={tab?.icon} size={16} className={isActive ? "opacity-100" : "opacity-70"} />
         <span className="font-bold text-sm tracking-wide">{tab?.label}</span>
         {tab?.count > 0 && (
          <span className={`px-2 py-0.5 text-[10px] font-black rounded-full transition-colors z-10 ${
           isActive
            ? 'bg-primary-foreground/20 text-primary-foreground'
            : 'bg-black/10 dark:bg-white/10 text-foreground'
          }`}>
           {tab?.count}
          </span>
         )}
        </button>
       );
      })}
     </div>
   </div>
  );
};

export default TabNavigation;