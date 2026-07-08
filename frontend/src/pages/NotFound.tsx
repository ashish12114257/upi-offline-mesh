import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[var(--bg-page)] p-6 text-center text-[var(--text-primary)] transition-[background-color] duration-250">

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 transition-[background-color,border-color] duration-250"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--border)]"
        >
          <HelpCircle className="h-8 w-8" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-4 text-lg font-semibold tracking-tight text-[var(--text-primary)]"
        >
          Route Not Found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed font-mono"
        >
          The requested path does not map to any active controller or router configuration inside this offline mesh gateway instance.
        </motion.p>

        <motion.button
          onClick={() => navigate('/overview')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-page)] transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Overview
        </motion.button>
      </motion.div>
    </div>
  );
};
