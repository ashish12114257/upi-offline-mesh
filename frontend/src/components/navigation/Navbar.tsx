import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Menu, Key, Copy, Check, ExternalLink, RefreshCw, AlertTriangle, Moon, Sun } from 'lucide-react';
import { meshApi } from '../../services/meshApi';
import { useTheme } from '../../context/ThemeContext';
import { NetworkStatus } from '../ui/NetworkStatus';
import toast from 'react-hot-toast';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const [pubKey, setPubKey] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [keyLoading, setKeyLoading] = useState(true);
  const [keyError, setKeyError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchKey = () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setKeyLoading(true);
    setKeyError(false);

    meshApi.getServerKey({ signal: controller.signal })
      .then(data => {
        if (!controller.signal.aborted && data?.publicKey) {
          setPubKey(data.publicKey);
          setKeyError(false);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setPubKey('');
          setKeyError(true);
          if (err instanceof Error && err.name !== 'CanceledError') {
            toast.error('Unable to fetch server RSA key. The server may be offline.');
          }
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setKeyLoading(false);
      });
  };

  useEffect(() => {
    fetchKey();
    return () => abortRef.current?.abort();
  }, []);

  const handleCopyKey = () => {
    if (!pubKey) return;
    navigator.clipboard.writeText(pubKey);
    setCopied(true);
    toast.success('RSA Public Key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const truncatedKey = useMemo(() => {
    if (keyLoading) return null;
    if (keyError) return null;
    return pubKey
      ? `${pubKey.substring(0, 16)}...${pubKey.substring(pubKey.length - 16)}`
      : null;
  }, [pubKey, keyLoading, keyError]);

  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-[var(--border)] bg-[var(--navbar-bg)] px-4 lg:px-6 sticky top-0 z-30 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] lg:hidden transition-colors duration-150"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="hidden sm:flex items-center gap-1.5 rounded-md bg-[var(--bg-subtle)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
          <span>Gateway: Connected</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <NetworkStatus />

        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors duration-150"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        <div className="hidden sm:flex items-center gap-2 rounded-md bg-[var(--bg-subtle)] px-2.5 py-1.5 font-mono text-xs">
          <Key className="h-3 w-3 text-[var(--accent)] shrink-0" />

          {keyLoading ? (
            <span className="h-3 w-20 rounded bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
          ) : keyError ? (
            <span className="flex items-center gap-1 text-[var(--danger)]">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-[11px]">Key unavailable</span>
              <button onClick={fetchKey} className="hover:text-[var(--text-primary)] transition-colors" aria-label="Retry">
                <RefreshCw className="h-3 w-3" />
              </button>
            </span>
          ) : (
            <>
              <span className="text-[var(--text-muted)] hidden lg:inline text-[10px] mr-0.5">RSA:</span>
              <span className="text-[var(--text-primary)] select-all text-[11px]">{truncatedKey}</span>
            </>
          )}

          {pubKey && (
            <button
              onClick={handleCopyKey}
              aria-label="Copy RSA public key to clipboard"
              className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors duration-150"
            >
              {copied ? <Check className="h-3 w-3 text-[var(--success)]" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
        </div>

        <a
          href="http://localhost:8080/h2-console"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="H2 Database Console (opens in new tab)"
          className="hidden lg:flex items-center gap-1 rounded-md bg-[var(--bg-subtle)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors duration-150"
        >
          <span>H2 Console</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </header>
  );
};
