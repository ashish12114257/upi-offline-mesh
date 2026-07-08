import React, { useEffect, useRef, useCallback } from 'react';
import { X, ArrowRight, ShieldCheck, RefreshCw, Layers, CheckCircle2, AlertCircle, Clock, Hash, Key } from 'lucide-react';
import type { Transaction } from '../../types';

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_CIPHERTEXT_PRE = `00e4ab78f249cda811802e3b2e557bfa3982cd67ef902b48acde67efb32cd58ea8d
8923bc4a0e1df02fa9bc5e67de23a0fbc512e09abcf12389ab4cde5e92acde68fb28c
1892cda812ef02b3df982a0d92389bcde4a02be098fcde328ab9cd42bc02e3dfa8bc`;

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  isOpen,
  onClose
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'Tab' && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      requestAnimationFrame(() => {
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      });
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (!isOpen && previousActiveElement.current) {
        previousActiveElement.current.focus();
        previousActiveElement.current = null;
      }
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !transaction) return null;

  const isSettled = transaction.status === 'SETTLED';
  const mockCiphertext = `${MOCK_CIPHERTEXT_PRE}\n${transaction.packetHash.substring(0, 32)}...`;
  const mockAesKey = `rsa-oaep-sha256-encrypted-aes-256-key[${transaction.id * 117}]`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)]"
      role="dialog"
      aria-modal="true"
      aria-label="Transaction details"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="document"
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-6 bg-[var(--bg-card-alt)]">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">Transaction Audit</span>
            <span className="text-[var(--border)]">&bull;</span>
            <span className="font-mono text-xs font-semibold text-[var(--accent)]">ID: #{transaction.id}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close transaction details"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-6 space-y-6">
          <div className={`flex items-center justify-between rounded-xl p-4 border ${
              isSettled
                ? 'bg-[var(--success-subtle)] border-[var(--success)]/30 text-[var(--success)]'
                : 'bg-[var(--danger-subtle)] border-[var(--danger)]/30 text-[var(--danger)]'
            }`}
          >
            <div className="flex items-center gap-3">
              {isSettled ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <div>
                <span className="block font-bold text-sm uppercase tracking-wide">
                  {isSettled ? 'Settlement Successful' : 'Settlement Rejected'}
                </span>
                <span className="block text-xs text-[var(--text-secondary)] font-mono mt-0.5">
                  {isSettled ? 'Funds transferred to core ledger' : 'Operation blocked due to insufficient funds'}
                </span>
              </div>
            </div>
            <span className="text-lg font-semibold font-mono">₹{transaction.amount.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card-alt)] p-4">
              <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider font-mono">Routing Parties</span>
              <div className="mt-3 flex items-center justify-between text-sm">
                <div>
                  <span className="block font-bold text-[var(--text-primary)]">{transaction.senderVpa}</span>
                  <span className="block text-[10px] text-[var(--text-muted)] font-mono mt-0.5">Sender</span>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
                <div className="text-right">
                  <span className="block font-bold text-[var(--text-primary)]">{transaction.receiverVpa}</span>
                  <span className="block text-[10px] text-[var(--text-muted)] font-mono mt-0.5">Receiver</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card-alt)] p-4">
              <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider font-mono">Temporal Metadata</span>
              <div className="mt-3 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5"><Clock className="h-3 w-3" /> Signed:</span>
                  <span className="text-[var(--text-primary)]">{new Date(transaction.signedAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5"><Clock className="h-3 w-3" /> Settled:</span>
                  <span className="text-[var(--text-primary)]">{new Date(transaction.settledAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card-alt)] p-4 space-y-3">
            <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider font-mono">Network Ingestion Audit</span>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="flex flex-col gap-1">
                <span className="text-[var(--text-muted)] flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Hop Count</span>
                <span className="text-[var(--text-primary)] font-bold">{transaction.hopCount} Device Hops</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[var(--text-muted)] flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Ingestion Node</span>
                <span className="text-[var(--text-primary)] font-bold">{transaction.bridgeNodeId}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card-alt)] p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent)]" /> Cryptographic Package Inspection
              </span>
              <span className="text-[9px] bg-[var(--accent-subtle)] text-[var(--accent)] px-2.5 py-0.5 rounded border border-[var(--accent)]/30 font-mono font-semibold uppercase">
                RSA-OAEP + AES-GCM
              </span>
            </div>

            <div className="space-y-3.5 text-xs font-mono">
              <div>
                <span className="text-[var(--text-muted)] mb-1 flex items-center gap-1.5"><Hash className="h-3 w-3" /> Dedup Hash (SHA-256):</span>
                <div className="bg-[var(--bg-elevated)] p-2.5 rounded-md border border-[var(--border)] select-all overflow-x-auto text-[11px] font-mono text-[var(--accent)]">
                  {transaction.packetHash}
                </div>
              </div>

              <div>
                <span className="text-[var(--text-muted)] mb-1 flex items-center gap-1.5"><Key className="h-3 w-3" /> AES-256 Session Key (RSA Encrypted):</span>
                <div className="bg-[var(--bg-elevated)] p-2.5 rounded-md border border-[var(--border)] overflow-x-auto text-[11px] font-mono text-[var(--text-secondary)] select-all">
                  {mockAesKey}
                </div>
              </div>

              <div>
                <span className="text-[var(--text-muted)] mb-1 flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> Payload Ciphertext:</span>
                <div className="bg-[var(--bg-elevated)] p-2.5 rounded-md border border-[var(--border)] overflow-x-auto text-[11px] font-mono text-[var(--text-secondary)] whitespace-pre-wrap select-all">
                  {mockCiphertext}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-16 items-center justify-end border-t border-[var(--border)] bg-[var(--bg-card-alt)] px-6 gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors duration-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
