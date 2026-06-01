import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../AppIcon';

export function UpdateBanner({ latestRelease, onMute, onDismiss, className = "mb-6" }) {
  if (!latestRelease) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`relative p-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden ${className}`}
    >
      {/* Ambient glow */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Icon + text */}
        <div className="flex items-center gap-3 pr-2">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0 mt-0.5">
            <Icon name="Sparkles" size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              New version available:{' '}
              <span className="text-primary">{latestRelease.version}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {latestRelease.date} &bull; Check the Changelog tab for what&apos;s new
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={latestRelease.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
          >
            <Icon name="Download" size={13} />
            Download
          </a>
          {onMute && (
            <button
              onClick={onMute}
              title="Mute this version"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/60 transition-all"
            >
              <Icon name="BellOff" size={15} />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              title="Dismiss"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/60 transition-all"
            >
              <Icon name="X" size={15} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
