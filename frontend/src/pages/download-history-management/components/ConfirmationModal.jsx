import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'default',
  isLoading = false,
  items = [] // Thumbnail support
}) => {
  const { t } = useTranslation();
  const [deleteFromDevice, setDeleteFromDevice] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) setDeleteFromDevice(false);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e?.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const getIconAndColor = () => {
    switch (type) {
      case 'danger':
        return { icon: 'AlertTriangle', color: 'text-red-500', bg: 'bg-red-500/10 dark:bg-red-500/20', accent: 'text-red-600 dark:text-red-400' };
      case 'warning':
        return { icon: 'AlertCircle', color: 'text-amber-500', bg: 'bg-amber-500/10 dark:bg-amber-500/20', accent: 'text-amber-600 dark:text-amber-400' };
      case 'success':
        return { icon: 'CheckCircle', color: 'text-emerald-500', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', accent: 'text-emerald-600 dark:text-emerald-400' };
      default:
        return { icon: 'HelpCircle', color: 'text-primary', bg: 'bg-primary/10 dark:bg-primary/20', accent: 'text-primary/70' };
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case 'danger':
        return 'destructive';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'default';
    }
  };

  if (!isOpen) return null;

  const { icon, color, bg, accent } = getIconAndColor();

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* Overlay - Theme Responsive */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-white/80 dark:bg-black/80"
        onClick={onClose}
      />

      {/* Modal - Theme Responsive Glass */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-[340px] rounded-[2rem] border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden bg-white/40 dark:bg-black/40 backdrop-blur-xl backdrop-saturate-[180%]"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors z-10"
        >
          <Icon name="X" size={16} className="text-foreground/70" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className={`w-12 h-12 rounded-[1.25rem] ${bg} flex items-center justify-center ${color} mb-3 shadow-[0_4px_16px_0_rgba(31,38,135,0.1)] dark:shadow-none border border-white/30 dark:border-white/10 backdrop-blur-md`}>
              <Icon name={icon} size={24} className="opacity-90" />
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">
              {title}
            </h2>
            <div className={`text-[9px] font-bold uppercase tracking-widest ${accent} bg-white/30 dark:bg-black/30 px-2.5 py-0.5 rounded-full border border-white/40 dark:border-white/10 shadow-sm backdrop-blur-md`}>
              {type} Action
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-xs text-foreground/90 font-medium leading-relaxed px-2">
              {message}
            </p>
          </div>

          {/* Item Previews - Theme Sync */}
          {items && items.length > 0 && (
            <div className="mb-8 space-y-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[9px] font-bold text-foreground/50 uppercase tracking-widest">
                  Affected Items ({items.length})
                </span>
                <div className="h-px bg-foreground/10 flex-1 ml-3" />
              </div>

              <div className="max-h-40 overflow-y-auto pr-1 space-y-2 thin-scrollbar">
                {items.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 group hover:border-black/20 dark:hover:border-white/20 transition-all duration-300 backdrop-blur-md shadow-inner"
                  >
                    <div className="w-14 h-10 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 border border-white/10 shadow-inner">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon name="Play" size={16} className="text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-foreground truncate transition-colors">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-white/20 dark:bg-black/20 text-foreground/70 font-bold uppercase tracking-widest border border-white/20 dark:border-white/5">
                          {item.format || 'MP4'}
                        </span>
                        <span className="text-[9px] text-primary font-bold">{item.quality || 'HD'}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Physical Delete Option (Desktop Only) */}
          {typeof window !== 'undefined' && window.pywebview && type === 'danger' && (
            <div className="mb-5 flex items-center justify-center bg-red-500/10 dark:bg-red-500/20 rounded-xl p-3 border border-red-500/20 cursor-pointer hover:bg-red-500/20 transition-colors backdrop-blur-md" onClick={() => setDeleteFromDevice(!deleteFromDevice)}>
              <div className={`w-4 h-4 rounded-[4px] flex items-center justify-center mr-2 border transition-colors ${deleteFromDevice ? 'bg-red-500 border-red-500 text-white' : 'border-red-500/30 bg-transparent'}`}>
                {deleteFromDevice && <Icon name="Check" size={10} strokeWidth={3} />}
              </div>
              <span className="text-[11px] font-bold text-red-600 dark:text-red-400">Delete file from device storage too</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-10 rounded-xl text-[11px] font-bold transition-all bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 text-foreground shadow-sm"
            >
              {cancelText}
            </Button>
            <Button
              variant={getButtonVariant()}
              onClick={() => onConfirm(deleteFromDevice)}
              loading={isLoading}
              className="flex-1 h-10 rounded-xl text-[11px] font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all"
            >
              <div className="flex items-center justify-center gap-1.5 w-full">
                <span>{confirmText}</span>
              </div>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmationModal;