import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';
import { _registerDialogHandler, PERMISSION_META } from '../../utils/permissions';

/**
 * PermissionDialog — Global branded permission dialog for YT Deluxe.
 *
 * Mount this ONCE at the app root (App.jsx). It registers itself with the
 * permissions utility so any requestPermission() call can trigger it.
 *
 * Shows "YT Deluxe" as the requester — not "localhost" — and persists the
 * user's choice so the popup never appears again for the same permission.
 */
const PermissionDialog = () => {
  const [dialog, setDialog] = useState(null);
  // dialog = { permissionKey: string, resolve: (bool) => void }

  const showHandler = useCallback((permissionKey, resolve) => {
    setDialog({ permissionKey, resolve });
  }, []);

  useEffect(() => {
    _registerDialogHandler(showHandler);
    return () => _registerDialogHandler(null);
  }, [showHandler]);

  const handleAllow = () => {
    dialog?.resolve(true);
    setDialog(null);
  };

  const handleDeny = () => {
    dialog?.resolve(false);
    setDialog(null);
  };

  const meta = dialog ? (PERMISSION_META[dialog.permissionKey] || {
    icon: 'Shield',
    title: 'Permission Request',
    description: `YT Deluxe is requesting access.`,
    reason: '',
  }) : null;

  return (
    <AnimatePresence>
      {dialog && meta && (
        // Backdrop
        <motion.div
          key="perm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
          // Clicking backdrop = deny
          onClick={handleDeny}
        >
          {/* Dialog Card */}
          <motion.div
            key="perm-card"
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            style={{
              background: 'var(--color-card, #fff)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient header bar */}
            <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary opacity-80" />

            {/* Content */}
            <div className="p-7">
              {/* App identity */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white/80 to-white/40 border border-white/60 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src="/assets/images/logo-light.webp"
                    alt="YT Deluxe"
                    className="w-9 h-9 object-contain"
                    onError={(e) => {
                      // fallback: hide img, show icon
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div style={{ display: 'none' }} className="w-full h-full items-center justify-center">
                    <Icon name="Zap" size={18} className="text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-black text-primary uppercase tracking-widest">YT Deluxe</p>
                  <p className="text-[10px] text-muted-foreground font-medium">wants your permission</p>
                </div>
              </div>

              {/* Permission icon + title */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-inner">
                  <Icon name={meta.icon} size={28} className="text-primary" />
                </div>
                <h2 className="text-xl font-black text-foreground tracking-tight mb-2">
                  {meta.title}
                </h2>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  {meta.description}
                </p>
                {meta.reason && (
                  <p className="mt-3 text-[11px] font-semibold text-muted-foreground/60 bg-muted/40 px-3 py-1.5 rounded-full border border-border/40">
                    {meta.reason}
                  </p>
                )}
              </div>

              {/* Remember notice */}
              <div className="flex items-center gap-2 mb-6 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/10">
                <Icon name="CheckCircle2" size={14} className="text-primary shrink-0" />
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Your choice will be remembered. Change it anytime in Settings.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDeny}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm border border-border/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-200 active:scale-95"
                >
                  Deny
                </button>
                <button
                  onClick={handleAllow}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm bg-primary text-white hover:bg-primary/90 transition-all duration-200 active:scale-95 shadow-lg shadow-primary/20"
                >
                  Allow
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PermissionDialog;
