import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';

const CustomDropdown = ({ 
  selected, 
  options, 
  onSelect, 
  placeholder = "Select an option", 
  buttonClassName = "",
  containerClassName = "w-full",
  children,
  isOpenProp,
  onToggle,
  onClear,
  direction = "down", // "down" | "up"
  floatingChildren = false
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalIsOpen;
  
  const handleToggle = () => {
    if (onToggle) onToggle();
    else setInternalIsOpen(!internalIsOpen);
  };

  const dropdownRef = useRef(null);

  const isFloating = !children || floatingChildren;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isFloating && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (!onToggle) setInternalIsOpen(false);
        else if (isOpenProp) onToggle(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [children, onToggle]);

  const handleSelect = (option) => {
    if (onSelect) onSelect(option);
    if (!onToggle) setInternalIsOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative ${containerClassName}`}
      ref={dropdownRef}
    >
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleToggle}
        className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-300 bg-black/5 dark:bg-white/5 backdrop-blur-sm text-foreground text-sm font-medium border-border/50 hover:border-border flex items-center justify-between group ${buttonClassName}`}
      >
        <div className="font-semibold flex items-center gap-2 flex-1 min-w-0">
          {selected?.color && <div className={`w-2 h-2 rounded-full ${selected.color} shrink-0`} />}
          <div className="flex-1 min-w-0 flex items-center text-left">{selected ? selected.label : placeholder}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {onClear && selected && (
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="X" size={14} />
            </div>
          )}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Icon name="ChevronDown" size={18} className="text-muted-foreground/70" />
          </motion.div>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isFloating ? (direction === 'up' ? 10 : -10) : -10, height: isFloating ? 'auto' : 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: isFloating ? (direction === 'up' ? 10 : -10) : -10, height: isFloating ? 'auto' : 0 }}
            transition={{ duration: 0.2 }}
            className={!isFloating
              ? "overflow-hidden mt-3" 
              : `absolute min-w-[100%] w-max z-[100] rounded-2xl border border-border/60 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] bg-white dark:bg-[#0f0f0f] flex flex-col overflow-hidden ${direction === 'up' ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'}`
            }
            style={{ maxHeight: isFloating ? '350px' : 'none' }}
          >
            <div className={isFloating ? "overflow-y-auto w-full custom-scrollbar flex flex-col" : ""}>
              {children ? children : (
              options?.map((option, index) => (
                <motion.button
                  key={option.value || option.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => handleSelect(option)}
                  className={`w-full px-4 py-3 text-left transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/5 text-foreground flex items-center justify-between group ${
                    index !== options.length - 1 ? 'border-b border-border/30' : ''
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {option.color && <div className={`w-2 h-2 rounded-full ${option.color} shrink-0`} />}
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {option.description}
                      </div>
                    )}
                  </div>
                  {selected?.value === option.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <Icon name="Check" size={16} className="text-primary" />
                    </motion.div>
                  )}
                </motion.button>
              ))
            )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CustomDropdown;
