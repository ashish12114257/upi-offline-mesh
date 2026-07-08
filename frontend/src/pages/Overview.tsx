import React, { useState, useMemo } from 'react';
import {
  Activity, ArrowRight, RefreshCw, AlertTriangle,
  BarChart3, Database,
} from 'lucide-react';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { useMeshState } from '../hooks/useMeshState';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import { mockLogs } from '../utils/mockData';
import type { Transaction } from '../types';
import { TransactionDetailsModal } from '../components/ledger/TransactionDetailsModal';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { Link } from 'react-router-dom';

const AnimatedValue: React.FC<{ value: number; type?: 'integer' | 'currency' | 'percent' }> = ({ value, type = 'integer' }) => {
  const count = useAnimatedCounter(value);
  switch (type) {
    case 'currency': return <>₹{count.toFixed(2)}</>;
    case 'percent': return <>{count.toFixed(1)}%</>;
    default: return <>{Math.round(count)}</>;
  }
};

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  prefix?: string;
  suffix?: string;
}> = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 shadow-sm">
      <p className="text-[10px] text-[var(--text-muted)] mb-0.5">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-semibold" style={{ color: entry.color }}>
          {entry.name}: {prefix}{entry.value.toLocaleString()}{suffix}
        </p>
      ))}
    </div>
  );
};

const SectionError: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <AlertTriangle className="h-8 w-8 text-[var(--danger)] mb-3" />
    <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-md">{message}</p>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-2 rounded-lg bg-[var(--danger)]/90 px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--danger)] transition-colors cursor-pointer"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Retry
    </button>
  </div>
);

export const Overview: React.FC = () => {
  const { accounts, loading: accountsLoading, error: accountsError, refetch: refetchAccounts } = useAccounts();
  const { transactions, loading: txsLoading, refreshing: txsRefreshing, error: txsError, refetch: refetchTxs } = useTransactions();
  const { meshState, loading: meshLoading, error: meshError, refetch: refetchMesh } = useMeshState();

  const analytics = useAnalytics(transactions, meshState.devices);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenDetails = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedTx(null);
    setIsModalOpen(false);
  };

  const txsLoaded = !txsLoading || transactions.length > 0;
  const meshLoaded = !meshLoading || meshState.devices.length > 0;

  const hasAnyData = accounts.length > 0 || transactions.length > 0 || meshState.devices.length > 0;
  const everythingLoading = accountsLoading && txsLoading && meshLoading;
  const everythingError = (!!accountsError || !!txsError || !!meshError) && !hasAnyData;

  const totalVolume = useMemo(() => transactions.reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const chartTextColor = 'var(--text-secondary)';
  const chartGridColor = 'var(--border)';

  const handleRetryAll = () => { refetchAccounts(); refetchTxs(); refetchMesh(); };

  if (!hasAnyData && everythingLoading) {
    return (
      <div className="space-y-10">
        <div className="h-6 w-48 rounded bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <div className="md:col-span-2 h-28 rounded-lg bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
          <div className="h-28 rounded-lg bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
          <div className="h-28 rounded-lg bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="md:col-span-2 h-72 rounded-lg bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
          <div className="h-72 rounded-lg bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="md:col-span-2 h-64 rounded-lg bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
          <div className="h-64 rounded-lg bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
        </div>
      </div>
    );
  }

  if (!hasAnyData && everythingError) {
    return (
      <ErrorState
        message={accountsError || txsError || meshError || 'Failed to load data'}
        onRetry={handleRetryAll}
      />
    );
  }

  const chartLoading = txsLoading && transactions.length === 0;
  const hasTxData = transactions.length > 0;

  return (
    <div className="space-y-10">

      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Overview of network metrics, transactions, and mesh health.
          {txsRefreshing && <RefreshCw className="h-3 w-3 text-[var(--text-muted)] animate-spin inline ml-2" />}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="md:col-span-2 rounded-lg bg-[var(--bg-card)] p-6 shadow-[var(--shadow-md)]">
          <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Total Volume</div>
          <div className="mt-2">
            {txsLoaded ? (
              <span className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                ₹<AnimatedValue value={totalVolume} type="integer" />
              </span>
            ) : (
              <span className="text-2xl font-semibold text-[var(--text-muted)]">---</span>
            )}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            {txsLoaded
              ? `Across ${analytics.totalTransactions} transaction${analytics.totalTransactions !== 1 ? 's' : ''}`
              : 'Awaiting data...'}
          </div>
        </div>

        <div className="rounded-lg bg-[var(--bg-card)] p-6 shadow-[var(--shadow-md)]">
          <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Success Rate</div>
          <div className="mt-2">
            {txsLoaded ? (
              <span className="text-2xl font-semibold tracking-tight text-[var(--success)]">
                <AnimatedValue value={analytics.packetSuccessRate} type="percent" />
              </span>
            ) : (
              <span className="text-2xl font-semibold text-[var(--text-muted)]">---</span>
            )}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            {txsLoaded
              ? `${analytics.successfulPayments} settled / ${analytics.totalTransactions} total`
              : 'Awaiting data...'}
          </div>
        </div>

        <div className="rounded-lg bg-[var(--bg-card)] p-6 shadow-[var(--shadow-md)]">
          <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Network Health</div>
          <div className="mt-2">
            {meshLoaded ? (
              <span className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                <AnimatedValue value={analytics.networkHealth} type="percent" />
              </span>
            ) : (
              <span className="text-2xl font-semibold text-[var(--text-muted)]">---</span>
            )}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            {meshLoaded
              ? `${analytics.activeNodes} active / ${analytics.totalMeshNodes} nodes`
              : 'Awaiting data...'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-lg bg-[var(--bg-card)] p-6 shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-medium text-[var(--text-secondary)]">Transaction Activity</h2>
            {hasTxData && (
              <span className="text-[10px] text-[var(--text-muted)]">{analytics.dailyTxData.length}d</span>
            )}
          </div>
          {chartLoading ? (
            <div className="flex items-center justify-center h-72">
              <div className="h-56 w-full rounded-lg bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
            </div>
          ) : hasTxData ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.dailyTxData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" strokeOpacity={0.25} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: chartTextColor, fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: chartGridColor, strokeOpacity: 0.15 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: chartTextColor, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip suffix=" txns" />} cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Transactions"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#6366f1', stroke: 'var(--bg-card)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-72">
              <EmptyState icon={BarChart3} title="No Activity Yet" description="No transaction activity to display." />
            </div>
          )}
        </div>

        <div className="rounded-lg bg-[var(--bg-card)] p-6 shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-medium text-[var(--text-secondary)]">Payment Distribution</h2>
            {hasTxData && (
              <span className="text-[10px] text-[var(--text-muted)]">{analytics.successfulPayments}/{analytics.failedPayments}</span>
            )}
          </div>
          {chartLoading ? (
            <div className="flex items-center justify-center h-72">
              <div className="h-48 w-48 rounded-full bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
            </div>
          ) : hasTxData ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={analytics.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {analytics.pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip suffix=" txns" />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-5 mt-2">
                {analytics.pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-[10px] text-[var(--text-secondary)]">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-72">
              <EmptyState icon={BarChart3} title="No Payments" description="No payment data available." />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-lg bg-[var(--bg-card)] p-6 shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-[var(--text-secondary)]">Recent Transactions</h2>
            <Link to="/overview/ledger" className="text-[11px] text-[var(--accent)] flex items-center gap-1 hover:opacity-80 transition-opacity">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {txsLoading && transactions.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
              ))}
            </div>
          ) : txsError && transactions.length === 0 ? (
            <SectionError message={txsError} onRetry={refetchTxs} />
          ) : transactions.length > 0 ? (
            <div className="-mx-6">
              <table className="w-full text-left text-xs text-[var(--text-secondary)] border-collapse">
                <thead>
                  <tr className="text-[var(--text-muted)]">
                    <th className="pb-3 px-6 font-medium text-[10px] uppercase tracking-wider">Route</th>
                    <th className="pb-3 px-6 font-medium text-[10px] uppercase tracking-wider">Amount</th>
                    <th className="pb-3 px-6 font-medium text-[10px] uppercase tracking-wider">Status</th>
                    <th className="pb-3 pr-6 text-right font-medium text-[10px] uppercase tracking-wider" />
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-t border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-colors duration-100"
                    >
                      <td className="py-3 px-6">
                        <span className="block font-medium text-[var(--text-primary)] text-xs">{tx.senderVpa}</span>
                        <span className="block text-[10px] text-[var(--text-muted)]">→ {tx.receiverVpa}</span>
                      </td>
                      <td className="py-3 px-6 font-medium text-[var(--text-primary)]">₹{tx.amount.toFixed(2)}</td>
                      <td className="py-3 px-6">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${tx.status === 'SETTLED' ? 'bg-[var(--success-subtle)] text-[var(--success)]' : 'bg-[var(--danger-subtle)] text-[var(--danger)]'}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 pr-6 text-right">
                        <button
                          onClick={() => handleOpenDetails(tx)}
                          className="rounded-md border border-[var(--border)] px-2 py-1 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors duration-100"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-10">
              <Activity className="mx-auto h-5 w-5 text-[var(--text-muted)] mb-2" />
              <p className="text-xs text-[var(--text-muted)]">No transactions yet.</p>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-[var(--bg-card)] p-6 shadow-[var(--shadow-md)] flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-medium text-[var(--text-secondary)] mb-4">Accounts</h2>

            {accountsLoading && accounts.length === 0 ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[52px] rounded-lg bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
                ))}
              </div>
            ) : accountsError && accounts.length === 0 ? (
              <SectionError message={accountsError} onRetry={refetchAccounts} />
            ) : (
              <div className="space-y-1.5">
                {accounts.length > 0 ? (
                  accounts.slice(0, 5).map((account) => (
                    <div
                      key={account.vpa}
                      className="flex items-center justify-between rounded-lg bg-[var(--bg-subtle)] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <span className="block text-xs font-medium text-[var(--text-primary)] truncate">{account.holderName}</span>
                        <span className="block text-[10px] text-[var(--text-muted)] font-mono truncate">{account.vpa}</span>
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-primary)] ml-3 shrink-0">₹{account.balance.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Database className="mx-auto h-5 w-5 text-[var(--text-muted)] mb-2" />
                    <p className="text-xs text-[var(--text-muted)]">No accounts available.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <Link
            to="/overview/send-payment"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white hover:bg-[var(--accent)]/90 transition-colors"
          >
            Compose Payment
          </Link>
        </div>
      </div>

      <div className="rounded-lg bg-[var(--bg-card)] p-6 shadow-[var(--shadow-md)]">
        <h2 className="text-xs font-medium text-[var(--text-secondary)] mb-4">Server Logs</h2>
        <div className="rounded-lg bg-[#0a0c10] px-4 py-3 font-mono text-xs overflow-y-auto max-h-48 space-y-1 leading-relaxed">
          {mockLogs.length > 0 ? (
            mockLogs.map((log, i) => (
              <div key={i} className="flex flex-wrap gap-x-2 gap-y-0.5 text-[var(--text-secondary)]">
                <span className="text-[var(--text-muted)] shrink-0">[{log.time}]</span>
                <span className={`font-medium shrink-0 ${log.level === 'WARN' ? 'text-[var(--warning)]' : log.level === 'ERROR' ? 'text-[var(--danger)]' : 'text-[var(--accent)]'}`}>
                  {log.level}
                </span>
                <span className="text-[var(--text-muted)] font-medium shrink-0">[{log.service}]</span>
                <span className="text-[var(--text-primary)]">{log.msg}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-[var(--text-muted)]">No log entries.</div>
          )}
        </div>
      </div>

      <TransactionDetailsModal
        transaction={selectedTx}
        isOpen={isModalOpen}
        onClose={handleCloseDetails}
      />

    </div>
  );
};

export default Overview;
