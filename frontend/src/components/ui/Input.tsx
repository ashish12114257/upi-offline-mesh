import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  hint,
  error,
  icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-colors duration-100 ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-[var(--danger)]/50 focus:border-[var(--danger)] focus:ring-[var(--danger)]/30' : ''} ${className}`}
          {...props}
        />
      </div>
      {hint && !error && (
        <p className="text-[11px] text-[var(--text-muted)]">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-[var(--danger)]">{error}</p>
      )}
    </div>
  );
};
