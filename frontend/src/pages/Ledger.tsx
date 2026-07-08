import React, { useState, useMemo, useEffect, useCallback } from 'react';

import { useTransactions } from '../hooks/useTransactions';
import type { Transaction } from '../types';
import { TransactionDetailsModal } from '../components/ledger/TransactionDetailsModal';
import { Loading } from '../components/ui/Loading';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import {
  Search, XCircle,
  Download, FileText, ChevronLeft, ChevronRight,
  DollarSign, ArrowUpDown, X, SearchX, Inbox,
  Calendar, CheckCheck,
} from 'lucide-react';

type FilterStatus = 'ALL' | 'SETTLED' | 'REJECTED';
type SortOption = 'latest' | 'oldest' | 'highest-amount' | 'lowest-amount';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest-amount', label: 'Highest Amount' },
  { value: 'lowest-amount', label: 'Lowest Amount' },
];

const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
];

interface FilterChip {
  label: string;
  onRemove: () => void;
}

export const Ledger: React.FC = () => {
  const { transactions, loading, error, refetch } = useTransactions();

  const [searchId, setSearchId] = useState('');
  const [searchSender, setSearchSender] = useState('');
  const [searchReceiver, setSearchReceiver] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenDetails = useCallback((tx: Transaction) => {
    setSelectedTx(tx);
    setIsModalOpen(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedTx(null);
    setIsModalOpen(false);
  }, []);

  const sortConfig = useMemo(() => {
    switch (sortOption) {
      case 'latest': return { field: 'id' as const, dir: 'desc' as const };
      case 'oldest': return { field: 'id' as const, dir: 'asc' as const };
      case 'highest-amount': return { field: 'amount' as const, dir: 'desc' as const };
      case 'lowest-amount': return { field: 'amount' as const, dir: 'asc' as const };
    }
  }, [sortOption]);

  const processedTransactions = useMemo(() => {
    let result = [...transactions];

    if (searchId) result = result.filter(tx => tx.id.toString().includes(searchId));
    if (searchSender) {
      const q = searchSender.toLowerCase();
      result = result.filter(tx => tx.senderVpa.toLowerCase().includes(q));
    }
    if (searchReceiver) {
      const q = searchReceiver.toLowerCase();
      result = result.filter(tx => tx.receiverVpa.toLowerCase().includes(q));
    }
    if (statusFilter !== 'ALL') result = result.filter(tx => tx.status === statusFilter);
    if (dateFrom) {
      const from = new Date(dateFrom).setHours(0, 0, 0, 0);
      result = result.filter(tx => new Date(tx.settledAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).setHours(23, 59, 59, 999);
      result = result.filter(tx => new Date(tx.settledAt).getTime() <= to);
    }
    if (amountMin) {
      const min = parseFloat(amountMin);
      if (!isNaN(min)) result = result.filter(tx => tx.amount >= min);
    }
    if (amountMax) {
      const max = parseFloat(amountMax);
      if (!isNaN(max)) result = result.filter(tx => tx.amount <= max);
    }

    result.sort((a, b) => {
      if (sortConfig.field === 'id') {
        return sortConfig.dir === 'desc' ? b.id - a.id : a.id - b.id;
      }
      return sortConfig.dir === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    });

    return result;
  }, [transactions, searchId, searchSender, searchReceiver, statusFilter, dateFrom, dateTo, amountMin, amountMax, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(processedTransactions.length / pageSize));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedTransactions.slice(start, start + pageSize);
  }, [processedTransactions, currentPage, pageSize]);

  useEffect(() => { setCurrentPage(1); }, [
    searchId, searchSender, searchReceiver, statusFilter, dateFrom, dateTo, amountMin, amountMax, sortOption, pageSize,
  ]);

  const hasAnyFilter = !!searchId || !!searchSender || !!searchReceiver ||
    statusFilter !== 'ALL' || !!dateFrom || !!dateTo || !!amountMin || !!amountMax;

  const clearFilters = () => {
    setSearchId(''); setSearchSender(''); setSearchReceiver('');
    setStatusFilter('ALL'); setDateFrom(''); setDateTo('');
    setAmountMin(''); setAmountMax(''); setSortOption('latest');
  };

  const activeChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];
    if (searchId) chips.push({ label: `ID: ${searchId}`, onRemove: () => setSearchId('') });
    if (searchSender) chips.push({ label: `Sender: ${searchSender}`, onRemove: () => setSearchSender('') });
    if (searchReceiver) chips.push({ label: `Receiver: ${searchReceiver}`, onRemove: () => setSearchReceiver('') });
    if (statusFilter !== 'ALL') chips.push({ label: `Status: ${statusFilter}`, onRemove: () => setStatusFilter('ALL') });
    if (dateFrom) chips.push({ label: `From: ${dateFrom}`, onRemove: () => setDateFrom('') });
    if (dateTo) chips.push({ label: `To: ${dateTo}`, onRemove: () => setDateTo('') });
    if (amountMin) chips.push({ label: `Min: ₹${amountMin}`, onRemove: () => setAmountMin('') });
    if (amountMax) chips.push({ label: `Max: ₹${amountMax}`, onRemove: () => setAmountMax('') });
    return chips;
  }, [searchId, searchSender, searchReceiver, statusFilter, dateFrom, dateTo, amountMin, amountMax]);

  const exportCSV = useCallback(() => {
    const headers = ['ID', 'Sender VPA', 'Receiver VPA', 'Amount', 'Status', 'Hops', 'Bridge Node', 'Signed At', 'Settled At'];
    const rows = processedTransactions.map(tx => [
      tx.id.toString(), tx.senderVpa, tx.receiverVpa, tx.amount.toFixed(2),
      tx.status, tx.hopCount.toString(), tx.bridgeNodeId, tx.signedAt, tx.settledAt,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [processedTransactions]);

  const exportPDF = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rows = processedTransactions.map(tx => `
      <tr>
        <td>#${tx.id}</td>
        <td>${tx.senderVpa}</td>
        <td>${tx.receiverVpa}</td>
        <td>₹${tx.amount.toFixed(2)}</td>
        <td class="status-${tx.status.toLowerCase()}">${tx.status}</td>
        <td>${tx.hopCount}</td>
        <td>${tx.bridgeNodeId}</td>
        <td>${new Date(tx.settledAt).toLocaleDateString()}</td>
      </tr>`).join('');
    printWindow.document.write(`
      <!DOCTYPE html><html><head>
        <title>Transaction Report</title>
        <style>
          @page { size: landscape; margin: 15mm; }
          body { font-family: 'Courier New', monospace; font-size: 10px; color: #1e293b; padding: 20px; }
          h1 { font-size: 18px; margin-bottom: 4px; color: #7c3aed; }
          p { font-size: 10px; color: #64748b; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #7c3aed; color: white; padding: 8px 6px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 6px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .status-settled { color: #22c55e; font-weight: bold; }
          .status-rejected { color: #ef4444; font-weight: bold; }
        </style>
      </head><body>
        <h1>Transaction Report</h1>
        <p>Generated: ${new Date().toLocaleString()} | ${processedTransactions.length} entries</p>
        <table>
          <thead><tr>
            <th>ID</th><th>Sender VPA</th><th>Receiver VPA</th><th>Amount</th>
            <th>Status</th><th>Hops</th><th>Bridge Node</th><th>Date</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <script>window.onload = function() { window.print(); window.close(); }<\/script>
      </body></html>`);
    printWindow.document.close();
  }, [processedTransactions]);

  if (loading && transactions.length === 0) return <Loading variant="table" message="Loading transactions..." />;
  if (error && transactions.length === 0) return <ErrorState message={error} onRetry={refetch} />;

  const renderPageNumbers = () => {
    const pages: number[] = [];
    if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else if (currentPage <= 3) { for (let i = 1; i <= 5; i++) pages.push(i); }
    else if (currentPage >= totalPages - 2) { for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i); }
    else { for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i); }
    return pages;
  };

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Transaction History</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Browse the central ledger audit trail with cryptographic proofs and mesh hop data.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="rounded-lg bg-[var(--bg-card)] p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.3)] space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input placeholder="Transaction ID..." value={searchId} onChange={e => setSearchId(e.target.value)} icon={<Search className="h-4 w-4" />} />
          <Input placeholder="Sender VPA..." value={searchSender} onChange={e => setSearchSender(e.target.value)} icon={<Search className="h-4 w-4" />} />
          <Input placeholder="Receiver VPA..." value={searchReceiver} onChange={e => setSearchReceiver(e.target.value)} icon={<Search className="h-4 w-4" />} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} icon={<Calendar className="h-4 w-4" />} />
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} icon={<Calendar className="h-4 w-4" />} />
          <Input type="number" placeholder="Min amount" value={amountMin} onChange={e => setAmountMin(e.target.value)} icon={<DollarSign className="h-4 w-4" />} min="0" step="0.01" />
          <Input type="number" placeholder="Max amount" value={amountMax} onChange={e => setAmountMax(e.target.value)} icon={<DollarSign className="h-4 w-4" />} min="0" step="0.01" />
        </div>

        {/* Filter chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeChips.map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[var(--accent-subtle)] text-[var(--accent)]"
                >
                  {chip.label}
                  <button type="button" onClick={chip.onRemove} className="text-current opacity-60 hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}

        {/* Status toggles + Sort + Export */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['ALL', 'SETTLED', 'REJECTED'] as FilterStatus[]).map(filter => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                aria-pressed={statusFilter === filter}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-100 ${
                  statusFilter === filter
                    ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                {filter === 'ALL' ? 'All' : filter === 'SETTLED' ? 'Settled' : 'Rejected'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <Select options={SORT_OPTIONS} value={sortOption} onChange={e => setSortOption(e.target.value as SortOption)} className="w-auto min-w-[130px] py-1.5 text-xs" />
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={exportCSV} disabled={processedTransactions.length === 0}>
                CSV
              </Button>
              <Button variant="secondary" size="sm" icon={<FileText className="h-3.5 w-3.5" />} onClick={exportPDF} disabled={processedTransactions.length === 0}>
                PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-[var(--bg-card)] shadow-[0_1px_3px_0_rgba(0,0,0,0.3)] overflow-hidden">
        {processedTransactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[var(--text-secondary)] border-collapse min-w-[800px]">
                <thead>
                  <tr className="sticky top-0 z-10 bg-[var(--bg-card)]">
                    <th className="py-3.5 px-5 font-medium text-[10px] text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">ID</th>
                    <th className="py-3.5 px-5 font-medium text-[10px] text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Sender</th>
                    <th className="py-3.5 px-5 font-medium text-[10px] text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Receiver</th>
                    <th className="py-3.5 px-5 font-medium text-[10px] text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Amount</th>
                    <th className="py-3.5 px-5 font-medium text-[10px] text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Route</th>
                    <th className="py-3.5 px-5 font-medium text-[10px] text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Date</th>
                    <th className="py-3.5 px-5 font-medium text-[10px] text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-5 text-right font-medium text-[10px] text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap" />
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map(tx => (
                    <tr
                      key={tx.id}
                      className="border-t border-[var(--border)]/50 hover:bg-[var(--bg-subtle)]/50 transition-colors duration-100 cursor-pointer"
                      onClick={() => handleOpenDetails(tx)}
                    >
                      <td className="py-4 px-5 font-medium text-[var(--accent)] whitespace-nowrap">#{tx.id}</td>
                      <td className="py-4 px-5">
                        <span className="font-medium text-[var(--text-primary)]">{tx.senderVpa}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-medium text-[var(--text-primary)]">{tx.receiverVpa}</span>
                      </td>
                      <td className="py-4 px-5 font-medium text-[var(--text-primary)] whitespace-nowrap">₹{tx.amount.toFixed(2)}</td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="text-[var(--text-primary)]">{tx.hopCount} hops</span>
                        <span className="text-[10px] text-[var(--text-muted)] block">via {tx.bridgeNodeId}</span>
                      </td>
                      <td className="py-4 px-5 text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                        {new Date(tx.settledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold ${
                          tx.status === 'SETTLED'
                            ? 'bg-[var(--success-subtle)] text-[var(--success)]'
                            : 'bg-[var(--danger-subtle)] text-[var(--danger)]'
                        }`}>
                          {tx.status === 'SETTLED' ? <CheckCheck className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <span className="text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-100">
                          Inspect →
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--text-muted)]">Rows per page:</span>
                <Select options={PAGE_SIZE_OPTIONS} value={String(pageSize)} onChange={e => setPageSize(Number(e.target.value))} className="w-auto min-w-[65px] py-1 text-xs" />
                <span className="text-[11px] text-[var(--text-muted)] ml-2">
                  {processedTransactions.length} total
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--text-muted)] mr-1">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-100"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {renderPageNumbers().map(pageNum => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[28px] h-7 rounded-md text-[11px] font-medium transition-colors duration-100 ${
                        currentPage === pageNum
                          ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-100"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={hasAnyFilter ? SearchX : Inbox}
              title={hasAnyFilter ? 'No Matching Results' : 'No Transactions Yet'}
              description={hasAnyFilter
                ? 'No transactions match your current search criteria.'
                : 'Transactions will appear here once bridge nodes upload mesh packets to the settlement gateway.'
              }
              action={hasAnyFilter ? { label: 'Clear Filters', onClick: clearFilters } : undefined}
            />
          </div>
        )}
      </div>

      <TransactionDetailsModal transaction={selectedTx} isOpen={isModalOpen} onClose={handleCloseDetails} />

    </div>
  );
};

export default Ledger;
