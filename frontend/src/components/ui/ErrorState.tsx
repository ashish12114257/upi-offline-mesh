import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff, ServerCrash } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  variant?: 'default' | 'offline' | 'server';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Connection Outage',
  message = 'Failed to establish connectivity with the server gateway. Check your terminal execution status.',
  onRetry,
  variant = 'default',
}) => {
  const Icon = variant === 'offline' ? WifiOff : variant === 'server' ? ServerCrash : AlertTriangle;

  const iconColor =
    variant === 'offline'
      ? 'text-[var(--warning)] border-[var(--warning)]/30 bg-[var(--warning-subtle)]'
      : variant === 'server'
        ? 'text-[var(--warning)] border-[var(--warning)]/30 bg-[var(--warning-subtle)]'
        : 'text-[var(--danger)] border-[var(--danger)]/30 bg-[var(--danger-subtle)]';

  const buttonColor =
    variant === 'offline'
      ? 'bg-[var(--warning)] hover:opacity-90'
      : variant === 'server'
        ? 'bg-[var(--warning)] hover:opacity-90'
        : 'bg-[var(--danger)] hover:opacity-90';

  return (
    <div className="flex min-h-[300px] w-full flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 shadow-[var(--shadow-md)]">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${iconColor}`}
        >
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-sm font-semibold tracking-tight text-[var(--text-primary)]">{title}</h3>
        <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">{message}</p>

        {onRetry && (
          <button
            onClick={onRetry}
            className={`mt-6 inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-medium text-white transition-colors duration-100 ${buttonColor}`}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Connection
          </button>
        )}
      </div>
    </div>
  );
};
