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
        className="absolute inset-0 bg-background/60 dark:bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal - Theme Responsive Glass */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-md glass-card shadow-glass-2xl overflow-hidden border border-border/50 bg-card/90 dark:bg-card/30"
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className={`w-16 h-16 rounded-3xl ${bg} flex items-center justify-center ${color} mb-4 shadow-xl border border-border/20`}>
              <Icon name={icon} size={32} />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">
              {title}
            </h2>
            <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${accent} bg-muted px-3 py-1 rounded-full border border-border/10`}>
              {type} Action
            </div>
          </div>

          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              {message}
            </p>
          </div>

          {/* Item Previews - Theme Sync */}
          {items && items.length > 0 && (
            <div className="mb-8 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Affected Items ({items.length})
                </span>
                <div className="h-px bg-border/40 flex-1 ml-4" />
              </div>

              <div className="max-h-52 overflow-y-auto pr-2 space-y-3 thin-scrollbar">
                {items.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-muted/30 border border-border/20 group hover:bg-muted/50 transition-all duration-300"
                  >
                    <div className="w-16 h-12 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 border border-white/5 shadow-inner">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon name="Play" size={18} className="text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-background/50 text-muted-foreground font-black uppercase tracking-widest border border-border/40">
                          {item.format || 'MP4'}
                        </span>
                        <span className="text-[10px] text-primary font-bold">{item.quality || 'HD'}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Physical Delete Option (Desktop Only) */}
          {typeof window !== 'undefined' && window.pywebview && type === 'danger' && (
            <div className="mb-6 flex items-center justify-center bg-destructive/5 rounded-2xl p-4 border border-destructive/20 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setDeleteFromDevice(!deleteFromDevice)}>
              <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 border transition-colors ${deleteFromDevice ? 'bg-destructive border-destructive text-white' : 'border-border/50 bg-background'}`}>
                {deleteFromDevice && <Icon name="Check" size={14} />}
              </div>
              <span className="text-sm font-bold text-foreground">Delete file from device storage too</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-12 rounded-2xl font-bold transition-all border-border/60 hover:bg-muted"
            >
              {cancelText}
            </Button>
            <Button
              variant={getButtonVariant()}
              onClick={() => onConfirm(deleteFromDevice)}
              loading={isLoading}
              className="flex-[1.5] h-12 rounded-2xl font-black shadow-lg shadow-black/20"
            >
              <div className="flex items-center gap-2">
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