import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center py-14 text-center ${className}`}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] mb-4">
        <Icon className="h-6 w-6 text-[var(--text-muted)]" />
      </div>
    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">{title}</h3>
    {description && (
      <p className="text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed">
        {description}
      </p>
    )}
    {(action || secondaryAction) && (
      <div className="flex items-center gap-3 mt-5">
        {action && (
          <button
            onClick={action.onClick}
            className={`rounded-md px-4 py-2 text-xs font-medium transition-colors duration-100 ${
              action.variant === 'secondary'
                ? 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                : 'bg-[var(--accent)] text-white hover:opacity-90'
            }`}
          >
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors duration-100"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    )}
  </div>
);
