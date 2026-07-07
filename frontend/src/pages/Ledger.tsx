import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTransactions } from '../hooks/useTransactions';
import type { Transaction } from '../types';
import { TransactionDetailsModal } from '../components/ledger/TransactionDetailsModal';
import { Loading } from '../components/ui/Loading';
import { ErrorState } from '../components/ui/ErrorState';
import {
  Receipt, Search, CheckCircle2, XCircle, Database,
  Download, FileText, ChevronLeft, ChevronRight, Calendar,
  DollarSign, ArrowUpDown, X, Filter,
} from 'lucide-react';
import { fadeInUp, staggerFast } from '../utils/motionConfig';

type FilterStatus = 'ALL' | 'SETTLED' | 'REJECTED';
type SortOption = 'latest' | 'oldest' | 'highest-amount' | 'lowest-amount';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest-amount', label: 'Highest Amount' },
  { value: 'lowest-amount', label: 'Lowest Amount' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const inputBase =
  'w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all font-mono';

const inputWithIcon = 'pl-9';

const btnBase =
  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--border)] bg-[var(--bg-elevated)] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

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
      case 'latest':
        return { field: 'id' as const, dir: 'desc' as const };
      case 'oldest':
        return { field: 'id' as const, dir: 'asc' as const };
      case 'highest-amount':
        return { field: 'amount' as const, dir: 'desc' as const };
      case 'lowest-amount':
        return { field: 'amount' as const, dir: 'asc' as const };
    }
  }, [sortOption]);

  const processedTransactions = useMemo(() => {
    let result = [...transactions];

    if (searchId) {
      result = result.filter((tx) => tx.id.toString().includes(searchId));
    }
    if (searchSender) {
      const q = searchSender.toLowerCase();
      result = result.filter((tx) => tx.senderVpa.toLowerCase().includes(q));
    }
    if (searchReceiver) {
      const q = searchReceiver.toLowerCase();
      result = result.filter((tx) => tx.receiverVpa.toLowerCase().includes(q));
    }
    if (statusFilter !== 'ALL') {
      result = result.filter((tx) => tx.status === statusFilter);
    }
    if (dateFrom) {
      const from = new Date(dateFrom).setHours(0, 0, 0, 0);
      result = result.filter((tx) => new Date(tx.settledAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).setHours(23, 59, 59, 999);
      result = result.filter((tx) => new Date(tx.settledAt).getTime() <= to);
    }
    if (amountMin) {
      const min = parseFloat(amountMin);
      if (!isNaN(min)) result = result.filter((tx) => tx.amount >= min);
    }
    if (amountMax) {
      const max = parseFloat(amountMax);
      if (!isNaN(max)) result = result.filter((tx) => tx.amount <= max);
    }

    result.sort((a, b) => {
      if (sortConfig.field === 'id') {
        return sortConfig.dir === 'desc' ? b.id - a.id : a.id - b.id;
      }
      return sortConfig.dir === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    });

    return result;
  }, [
    transactions, searchId, searchSender, searchReceiver,
    statusFilter, dateFrom, dateTo, amountMin, amountMax, sortConfig,
  ]);

  const totalPages = Math.max(1, Math.ceil(processedTransactions.length / pageSize));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedTransactions.slice(start, start + pageSize);
  }, [processedTransactions, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchId, searchSender, searchReceiver, statusFilter,
    dateFrom, dateTo, amountMin, amountMax, sortOption, pageSize,
  ]);

  const hasAnyFilter =
    !!searchId || !!searchSender || !!searchReceiver ||
    statusFilter !== 'ALL' || !!dateFrom || !!dateTo ||
    !!amountMin || !!amountMax;

  const clearFilters = () => {
    setSearchId('');
    setSearchSender('');
    setSearchReceiver('');
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setAmountMin('');
    setAmountMax('');
    setSortOption('latest');
  };

  const exportCSV = useCallback(() => {
    const headers = [
      'ID', 'Sender VPA', 'Receiver VPA', 'Amount',
      'Status', 'Hops', 'Bridge Node', 'Signed At', 'Settled At',
    ];
    const rows = processedTransactions.map((tx) => [
      tx.id.toString(),
      tx.senderVpa,
      tx.receiverVpa,
      tx.amount.toFixed(2),
      tx.status,
      tx.hopCount.toString(),
      tx.bridgeNodeId,
      tx.signedAt,
      tx.settledAt,
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\n');
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

    const rows = processedTransactions
      .map(
        (tx) => `
      <tr>
        <td>#${tx.id}</td>
        <td>${tx.senderVpa}</td>
        <td>${tx.receiverVpa}</td>
        <td>₹${tx.amount.toFixed(2)}</td>
        <td class="status-${tx.status.toLowerCase()}">${tx.status}</td>
        <td>${tx.hopCount}</td>
        <td>${tx.bridgeNodeId}</td>
        <td>${new Date(tx.settledAt).toLocaleDateString()}</td>
      </tr>`,
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
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
      </head>
      <body>
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
      </body>
      </html>
    `);
    printWindow.document.close();
  }, [processedTransactions]);

  if (loading && transactions.length === 0) {
    return <Loading variant="table" message="Loading transactions..." />;
  }

  if (error && transactions.length === 0) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  const renderPageNumbers = () => {
    const pages: number[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-6">

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <Receipt className="h-5 w-5 text-violet-400" />
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Transaction History</h1>
        </div>
        <p className="text-[var(--text-secondary)] text-sm ml-8">
          Browse the central ledger audit trail. View transaction state histories, hops traversed, and cryptographic proofs.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 backdrop-blur-md space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Transaction ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className={`${inputBase} ${inputWithIcon}`}
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Sender VPA..."
              value={searchSender}
              onChange={(e) => setSearchSender(e.target.value)}
              className={`${inputBase} ${inputWithIcon}`}
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Receiver VPA..."
              value={searchReceiver}
              onChange={(e) => setSearchReceiver(e.target.value)}
              className={`${inputBase} ${inputWithIcon}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`${inputBase} ${inputWithIcon}`}
              title="Date from"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`${inputBase} ${inputWithIcon}`}
              title="Date to"
            />
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="number"
              placeholder="Min amount"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
              className={`${inputBase} ${inputWithIcon}`}
              min="0"
              step="0.01"
            />
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="number"
              placeholder="Max amount"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
              className={`${inputBase} ${inputWithIcon}`}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider font-mono mr-1">
              Status:
            </span>
            {(['ALL', 'SETTLED', 'REJECTED'] as FilterStatus[]).map((filter) => (
              <motion.button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                aria-pressed={statusFilter === filter}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-violet-600 text-white font-bold shadow-sm shadow-violet-900/30'
                    : 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                {filter === 'ALL' ? 'All' : filter === 'SETTLED' ? 'Settled' : 'Rejected'}
              </motion.button>
            ))}
          </div>
          {hasAnyFilter && (
            <motion.button
              onClick={clearFilters}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-rose-400 border border-[var(--border)] hover:border-rose-900/30 bg-[var(--bg-elevated)] hover:bg-rose-950/20 transition-all duration-200 cursor-pointer"
            >
              <X className="h-3 w-3" />
              Clear filters
            </motion.button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider font-mono">
              Sort:
            </span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--text-muted)] font-mono font-semibold mr-1">
              {processedTransactions.length} {processedTransactions.length === 1 ? 'entry' : 'entries'}
            </span>
            <motion.button
              onClick={exportCSV}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`${btnBase} text-emerald-400 hover:text-white hover:bg-emerald-600 hover:border-emerald-600`}
              disabled={processedTransactions.length === 0}
            >
              <Download className="h-3 w-3" />
              CSV
            </motion.button>
            <motion.button
              onClick={exportPDF}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`${btnBase} text-violet-400 hover:text-white hover:bg-violet-600 hover:border-violet-600`}
              disabled={processedTransactions.length === 0}
            >
              <FileText className="h-3 w-3" />
              PDF
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 backdrop-blur-md"
      >
        <h2 className="text-sm font-bold text-[var(--text-primary)] mb-6 border-b border-[var(--border)] pb-4 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-violet-400" /> Ledger Records
          <span className="ml-auto text-[10px] font-mono text-[var(--text-muted)] font-normal">
            {processedTransactions.length} {processedTransactions.length === 1 ? 'entry' : 'entries'}
          </span>
        </h2>

        {processedTransactions.length > 0 ? (
          <>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-left text-xs text-[var(--text-secondary)] border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)] font-mono">
                    <th className="pb-3 pr-2 uppercase tracking-wider font-semibold text-[10px] whitespace-nowrap">ID</th>
                    <th className="pb-3 pr-2 uppercase tracking-wider font-semibold text-[10px] whitespace-nowrap">Sender VPA</th>
                    <th className="pb-3 pr-2 uppercase tracking-wider font-semibold text-[10px] whitespace-nowrap">Receiver VPA</th>
                    <th className="pb-3 pr-2 uppercase tracking-wider font-semibold text-[10px] whitespace-nowrap">Amount</th>
                    <th className="pb-3 pr-2 uppercase tracking-wider font-semibold text-[10px] whitespace-nowrap">Hops</th>
                    <th className="pb-3 pr-2 uppercase tracking-wider font-semibold text-[10px] whitespace-nowrap">Settled</th>
                    <th className="pb-3 pr-2 uppercase tracking-wider font-semibold text-[10px] whitespace-nowrap">Status</th>
                    <th className="pb-3 text-right uppercase tracking-wider font-semibold text-[10px] whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <motion.tbody
                  className="divide-y divide-[var(--border)]"
                  variants={staggerFast}
                  initial="hidden"
                  animate="visible"
                >
                  {paginatedTransactions.map((tx) => (
                    <motion.tr
                      key={tx.id}
                      variants={fadeInUp}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-[var(--bg-subtle)] group transition-colors duration-150"
                    >
                      <td className="py-4 pr-2 text-violet-400 font-bold whitespace-nowrap">#{tx.id}</td>
                      <td className="py-4 pr-2 font-bold text-[var(--text-primary)] break-all max-w-[140px]">{tx.senderVpa}</td>
                      <td className="py-4 pr-2 font-bold text-[var(--text-primary)] break-all max-w-[140px]">{tx.receiverVpa}</td>
                      <td className="py-4 pr-2 font-bold text-[var(--text-primary)] font-mono whitespace-nowrap">₹{tx.amount.toFixed(2)}</td>
                      <td className="py-4 pr-2 text-[var(--text-secondary)] whitespace-nowrap">
                        <span className="font-bold text-[var(--text-primary)]">{tx.hopCount} hops</span>
                        <span className="text-[10px] text-[var(--text-muted)] block">via {tx.bridgeNodeId}</span>
                      </td>
                      <td className="py-4 pr-2 text-[var(--text-muted)] text-[10px] font-mono whitespace-nowrap">
                        {new Date(tx.settledAt).toLocaleDateString()}{' '}
                        {new Date(tx.settledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 pr-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            tx.status === 'SETTLED'
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                              : 'bg-rose-950/40 text-rose-400 border border-rose-900/30'
                          }`}
                        >
                          {tx.status === 'SETTLED' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 text-right whitespace-nowrap">
                        <motion.button
                          onClick={() => handleOpenDetails(tx)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-[10px] font-bold text-[var(--text-secondary)] hover:text-white hover:bg-violet-600 hover:border-violet-600 transition-colors duration-200 cursor-pointer"
                        >
                          Inspect
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)] font-mono">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <motion.button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  whileHover={currentPage > 1 ? { scale: 1.05 } : {}}
                  whileTap={currentPage > 1 ? { scale: 0.95 } : {}}
                  className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </motion.button>

                <div className="flex items-center gap-1 mx-1">
                  {renderPageNumbers().map((pageNum) => (
                    <motion.button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`min-w-[32px] h-8 rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-violet-600 text-white shadow-sm shadow-violet-900/30'
                          : 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      {pageNum}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  whileHover={currentPage < totalPages ? { scale: 1.05 } : {}}
                  whileTap={currentPage < totalPages ? { scale: 0.95 } : {}}
                  className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 animate-fadeIn"
          >
            <Database className="mx-auto h-10 w-10 text-[var(--text-muted)] mb-4" />
            <p className="text-[var(--text-muted)] font-mono text-sm">
              {hasAnyFilter
                ? 'No transactions match your search criteria.'
                : 'No transactions have been processed yet.'}
            </p>
            {hasAnyFilter ? (
              <button
                onClick={clearFilters}
                className="mt-4 text-xs text-violet-400 hover:text-violet-300 transition-colors font-semibold cursor-pointer"
              >
                Clear filters
              </button>
            ) : (
              <span className="block text-[10px] text-[var(--text-muted)] font-mono mt-2">
                Transactions appear here once bridge nodes upload mesh packets.
              </span>
            )}
          </motion.div>
        )}
      </motion.div>

      <TransactionDetailsModal
        transaction={selectedTx}
        isOpen={isModalOpen}
        onClose={handleCloseDetails}
      />

    </div>
  );
};
export default Ledger;
