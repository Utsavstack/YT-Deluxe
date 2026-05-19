import React from "react";
import { motion } from "framer-motion";
import Icon from "./AppIcon";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    error.__ErrorBoundary = true;
    window.__COMPONENT_ERROR__?.(error, errorInfo);
    // console.log("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state?.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-zinc-900 relative overflow-hidden p-4">
          {/* Premium Ambient Background Blurs for Error State */}
          <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-red-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] animate-pulse opacity-60 dark:opacity-20 pointer-events-none" />
          <div className="absolute bottom-[10%] right-[20%] w-[32rem] h-[32rem] bg-orange-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] animate-pulse opacity-60 dark:opacity-20 pointer-events-none" style={{ animationDelay: '2s' }} />

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            className="relative z-10 glass-card shadow-[0_20px_60px_-15px_rgba(239,68,68,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(239,68,68,0.1)] p-10 md:p-16 rounded-[40px] border border-red-500/15 dark:border-red-500/20 flex flex-col items-center text-center max-w-2xl w-full bg-white/70 dark:bg-black/40 backdrop-blur-3xl"
          >
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative mb-8 flex justify-center items-center"
            >
              <div className="bg-red-50 dark:bg-red-500/10 p-6 rounded-full shadow-inner border border-red-100 dark:border-red-500/20">
                <Icon name="Bug" size={64} className="text-red-500 drop-shadow-md" strokeWidth={1.5} />
              </div>
              
              {/* Little warning icon floating */}
              <motion.div 
                className="absolute -top-2 -right-4"
                animate={{ rotate: [-10, 10, -10], scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-full shadow-lg border border-red-100 dark:border-red-900/30 text-orange-500">
                  <Icon name="AlertTriangle" size={24} strokeWidth={2.5} />
                </div>
              </motion.div>
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 tracking-tight">
              Oops! Something went wrong.
            </h2>
            
            <p className="text-[16px] text-muted-foreground/90 mb-10 max-w-[85%] leading-relaxed">
              We encountered an unexpected error while trying to render this page. Don't worry, your data is safe. Let's get you back on track.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  window.location.reload();
                }}
                className="flex items-center justify-center gap-2 rounded-full px-8 py-3.5 font-bold text-[15px] bg-slate-200/70 dark:bg-zinc-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors w-full sm:w-auto shadow-sm"
              >
                <Icon name="RefreshCcw" size={18} />
                Reload Application
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  window.open("https://github.com/Utsavstack/YT-Deluxe/issues", "_blank", "noopener,noreferrer");
                }}
                className="flex items-center justify-center gap-2 rounded-full px-8 py-3.5 font-bold text-[15px] bg-red-500 text-white hover:bg-red-600 shadow-[0_8px_20px_-8px_rgba(239,68,68,0.5)] transition-colors w-full sm:w-auto"
              >
                <Icon name="Github" size={18} />
                Report Issue
              </motion.button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props?.children;
  }
}

export default ErrorBoundary;