import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      setWasOffline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 4000);
    };
    const goOffline = () => {
      setOnline(false);
      setShowBanner(true);
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <>
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-all duration-300 ${
          online
            ? 'bg-[var(--success-subtle)] text-[var(--success)] border border-[var(--success)]/20'
            : 'bg-[var(--danger-subtle)] text-[var(--danger)] border border-[var(--danger)]/20'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            online ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'
          }`}
        />
        <span className="hidden sm:inline">{online ? 'Connected' : 'Offline'}</span>
        {online ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
      </div>

      <AnimatePresence>
        {showBanner && !online && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 left-0 right-0 z-40 flex items-center justify-center gap-2 bg-[var(--danger)] px-4 py-2 text-xs font-semibold text-white"
          >
            <WifiOff className="h-3.5 w-3.5" />
            No internet connection. Data may not refresh until connectivity is restored.
          </motion.div>
        )}
        {showBanner && wasOffline && online && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 left-0 right-0 z-40 flex items-center justify-center gap-2 bg-[var(--success)] px-4 py-2 text-xs font-semibold text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Connection restored. Data will resume syncing.
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
