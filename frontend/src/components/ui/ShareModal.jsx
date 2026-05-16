import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';
import Button from './Button';

const ShareModal = ({ isOpen, onClose, url, title }) => {
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!isOpen) return null;

  const handleCopy = () => {
    // Desktop native bridge support
    if (window.pywebview && window.pywebview.api && window.pywebview.api.write_clipboard) {
      window.pywebview.api.write_clipboard(url);
    } else {
      navigator.clipboard.writeText(url);
    }
    setCopied(true);
  };

  const handleSocialClick = (e, targetUrl) => {
    // Desktop native bridge support: Open in system default browser
    if (window.pywebview && window.pywebview.api && window.pywebview.api.open_url) {
      e.preventDefault();
      window.pywebview.api.open_url(targetUrl);
    }
  };

  // Custom SVGs for actual brand look
  const BrandIcons = {
    WhatsApp: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    X: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.493h2.039L6.486 3.24H4.298l13.311 17.405z"/>
      </svg>
    ),
    Telegram: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M11.944 0C5.347 0 0 5.347 0 11.944c0 6.596 5.347 11.944 11.944 11.944 6.596 0 11.944-5.348 11.944-11.944C23.888 5.347 18.54 0 11.944 0zm5.83 8.163l-2.006 9.467c-.152.66-.543.824-1.096.516l-3.058-2.254-1.475 1.419c-.163.163-.3.3-.614.3l.218-3.111 5.663-5.118c.247-.22-.054-.341-.383-.122l-7.001 4.408-3.013-.942c-.655-.205-.668-.655.137-.97l11.777-4.538c.544-.205 1.02.122.853.825z"/>
      </svg>
    ),
    Facebook: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    )
  };

  const shareOptions = [
    { name: 'WhatsApp', icon: BrandIcons.WhatsApp, color: 'text-white bg-[#25D366]', url: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}` },
    { name: 'X', icon: BrandIcons.X, color: 'text-white bg-black dark:bg-white dark:text-black', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
    { name: 'Telegram', icon: BrandIcons.Telegram, color: 'text-white bg-[#229ED9]', url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { name: 'Facebook', icon: BrandIcons.Facebook, color: 'text-white bg-[#1877F2]', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: 'Email', icon: (props) => <Icon name="Mail" {...props} />, color: 'bg-muted text-foreground', url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}` },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[251] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-white/80 dark:bg-black/80" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        className="relative w-full max-w-[320px] rounded-[2rem] border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden bg-white/40 dark:bg-black/40 backdrop-blur-xl backdrop-saturate-[180%]"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className={`w-12 h-12 rounded-[1.25rem] bg-white/300 dark:bg-white/10 flex items-center justify-center text-foreground mb-3 shadow-[0_4px_16px_0_rgba(31,38,135,0.1)] dark:shadow-none border border-white/30 dark:border-white/10 backdrop-blur-md`}>
              <Icon name="Share2" size={24} className="opacity-80" />
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">
              Share Media
            </h2>
            <div className={`text-[9px] font-bold uppercase tracking-widest text-foreground/70 bg-white/30 dark:bg-black/30 px-2.5 py-0.5 rounded-full border border-white/40 dark:border-white/10 shadow-sm backdrop-blur-md`}>
              Spread the vibe
            </div>
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 rounded-xl text-foreground/50 hover:bg-white/40 dark:hover:bg-white/10 hover:text-foreground transition-all duration-300"
            >
              <Icon name="X" size={16} />
            </button>
          </div>

          <div className="space-y-5">
            {/* Direct Link Section */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[9px] font-bold text-foreground/50 uppercase tracking-widest">Direct Link</span>
                <div className="h-px bg-foreground/10 flex-1 ml-3" />
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 group hover:border-black/20 dark:hover:border-white/20 transition-all duration-500 backdrop-blur-md shadow-inner">
                <input 
                  type="text" 
                  readOnly 
                  value={url} 
                  className="flex-1 bg-transparent border-none text-[11px] font-medium text-foreground focus:ring-0 outline-none truncate px-2"
                />
                <Button 
                  size="sm" 
                  variant={copied ? "success" : "primary"}
                  onClick={handleCopy}
                  className="rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider shadow-md h-8 hover:scale-[1.03] hover:shadow-lg hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-300"
                >
                  <Icon name={copied ? "Check" : "Copy"} size={12} className={copied ? "" : "mr-1"} />
                  {!copied && "Copy"}
                </Button>
              </div>
            </div>

            {/* Social Share Grid */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[9px] font-bold text-foreground/50 uppercase tracking-widest">Social Network</span>
                <div className="h-px bg-foreground/10 flex-1 ml-3" />
              </div>
              <div className="flex justify-between px-1">
                {shareOptions.map((option, idx) => (
                  <motion.a
                    key={option.name}
                    href={option.url}
                    onClick={(e) => handleSocialClick(e, option.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -3, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div className={`w-10 h-10 rounded-[1rem] ${option.color} flex items-center justify-center shadow-md transition-all duration-300 group-hover:shadow-lg border border-white/20`}>
                      <option.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[8px] font-bold text-foreground/60 uppercase tracking-tight group-hover:text-foreground transition-colors">
                      {option.name}
                    </span>
                  </motion.a>
                ))}
              </div>
            </div>

            {/* QR Code Feature */}
            <div className="flex flex-col items-center p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-black/10 dark:border-white/20 relative group overflow-hidden backdrop-blur-md">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               
               <div className="relative z-10 w-20 h-20 bg-white p-2 rounded-[1rem] shadow-md border border-white/50 group-hover:scale-105 transition-transform duration-500">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(url)}`} 
                  alt="QR Code"
                  className="w-full h-full mix-blend-multiply"
                />
              </div>
              <p className="relative z-10 mt-3 text-[8px] font-bold text-foreground/50 uppercase tracking-widest opacity-80">
                Scan to cast mobile
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default ShareModal;
