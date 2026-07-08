import React from 'react';
import { Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="flex flex-col sm:flex-row items-center justify-between border-t border-[var(--border)] bg-[var(--bg-card)] px-6 py-3 text-[var(--text-secondary)] text-xs">
      <div className="flex items-center gap-1.5 mb-2 sm:mb-0">
        <Cpu className="h-3 w-3 text-[var(--accent)]" />
        <span className="text-[11px] font-medium">UPI Offline Mesh Network Simulator v1.0.0</span>
      </div>
      <span className="text-[10px] text-[var(--text-muted)]">Deferred Settlement Simulation Mode</span>
    </footer>
  );
};
