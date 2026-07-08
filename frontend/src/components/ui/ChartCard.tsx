import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../utils/motionConfig';

interface ChartCardProps {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  icon,
  badge,
  children,
  delay = 0,
  className = '',
}) => (
  <motion.div
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    transition={{ duration: 0.4, delay }}
    className={`rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 backdrop-blur-md ${className}`}
  >
    <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-5">
      <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
        {icon} {title}
      </h2>
      {badge && (
        <span className="text-[10px] bg-[var(--bg-subtle)] px-2.5 py-0.5 rounded text-[var(--text-muted)] font-mono">
          {badge}
        </span>
      )}
    </div>
    {children}
  </motion.div>
);
