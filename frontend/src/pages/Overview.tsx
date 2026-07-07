import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, TrendingUp, Activity, Database, ArrowRight,
  FileText, RefreshCw, AlertTriangle,
  DollarSign, CheckCircle2, XCircle, Network, Signal, HeartPulse,
  BarChart3,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
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
import { Loading } from '../components/ui/Loading';
import { ErrorState } from '../components/ui/ErrorState';
import { TableRowSkeleton } from '../components/ui/Skeleton';
import { ChartCard } from '../components/ui/ChartCard';
import { Link } from 'react-router-dom';
import { staggerContainer, staggerFast, fadeInUp } from '../utils/motionConfig';

const METRIC_ICONS = {
  totalTransactions: FileText,
  successfulPayments: CheckCircle2,
  failedPayments: XCircle,
  averageAmount: DollarSign,
  totalMeshNodes: Network,
  activeNodes: Signal,
  networkHealth: HeartPulse,
  packetSuccessRate: BarChart3,
} as const;

const METRIC_COLORS = {
  totalTransactions: { icon: 'text-sky-400', bg: 'bg-sky-950/40' },
  successfulPayments: { icon: 'text-emerald-400', bg: 'bg-emerald-950/40' },
  failedPayments: { icon: 'text-rose-400', bg: 'bg-rose-950/40' },
  averageAmount: { icon: 'text-amber-400', bg: 'bg-amber-950/40' },
  totalMeshNodes: { icon: 'text-violet-400', bg: 'bg-violet-950/40' },
  activeNodes: { icon: 'text-emerald-400', bg: 'bg-emerald-950/40' },
  networkHealth: { icon: 'text-rose-400', bg: 'bg-rose-950/40' },
  packetSuccessRate: { icon: 'text-sky-400', bg: 'bg-sky-950/40' },
} as const;

interface MetricDef {
  key: string;
  label: string;
  value: string | number;
  numericValue?: number;
  valueType?: 'integer' | 'currency' | 'percent';
  subtext: string;
  subtextColor: string;
  delay: number;
}

const AnimatedMetricValue: React.FC<{
  value: number;
  type?: 'integer' | 'currency' | 'percent';
}> = ({ value, type = 'integer' }) => {
  const count = useAnimatedCounter(value);

  switch (type) {
    case 'currency':
      return <>₹{count.toFixed(2)}</>;
    case 'percent':
      return <>{count.toFixed(1)}%</>;
    case 'integer':
    default:
      return <>{Math.round(count)}</>;
  }
};

const MetricCard: React.FC<{
  metric: MetricDef;
}> = ({ metric }) => {
  const Icon = METRIC_ICONS[metric.key as keyof typeof METRIC_ICONS];
  const colors = METRIC_COLORS[metric.key as keyof typeof METRIC_COLORS];
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: metric.delay }}
      whileHover={{ y: -3, transition: { duration: 0.25 } }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 backdrop-blur-md relative overflow-hidden group card-hover"
    >
      <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-violet-600/5 blur-2xl group-hover:bg-violet-600/10 transition-all duration-500" />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest">{metric.label}</span>
        <div className={`rounded-lg ${colors.bg} p-2 border border-[var(--border)]`}>
          <Icon className={`h-4 w-4 ${colors.icon}`} />
        </div>
      </div>
      <div className="mt-4">
        {metric.numericValue !== undefined ? (
          <span className="text-2xl font-extrabold font-mono text-[var(--text-primary)] tracking-tight">
            <AnimatedMetricValue value={metric.numericValue} type={metric.valueType} />
          </span>
        ) : (
          <span className="text-2xl font-extrabold font-mono text-[var(--text-primary)] tracking-tight">{metric.value}</span>
        )}
        <span className={`block text-[11px] font-semibold mt-1.5 ${metric.subtextColor}`}>
          {metric.subtext}
        </span>
      </div>
    </motion.div>
  );
};

const SectionError: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center py-12 text-center"
  >
    <AlertTriangle className="h-8 w-8 text-rose-500 mb-3" />
    <p className="text-sm text-[var(--text-secondary)] font-mono mb-4 max-w-md">{message}</p>
    <motion.button
      onClick={onRetry}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors duration-200 cursor-pointer"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Retry
    </motion.button>
  </motion.div>
);

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  prefix?: string;
  suffix?: string;
}> = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 shadow-xl backdrop-blur-md">
      <p className="text-[10px] font-mono text-[var(--text-muted)] mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-bold font-mono" style={{ color: entry.color }}>
          {entry.name}: {prefix}{typeof entry.value === 'number' ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : entry.value}{suffix}
        </p>
      ))}
    </div>
  );
};

const percentColor = (v: number) =>
  v >= 80 ? 'text-emerald-400' : v >= 50 ? 'text-amber-400' : 'text-rose-400';

const formatPercent = (v: number) => `${v.toFixed(1)}%`;

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

  const metrics: MetricDef[] = useMemo(() => [
    {
      key: 'totalTransactions',
      label: 'Total Transactions',
      value: txsLoaded ? analytics.totalTransactions : '---',
      numericValue: txsLoaded ? analytics.totalTransactions : undefined,
      valueType: 'integer',
      subtext: txsLoaded ? `${analytics.successfulPayments} settled, ${analytics.failedPayments} rejected` : 'Awaiting data...',
      subtextColor: txsLoaded ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]',
      delay: 0.05,
    },
    {
      key: 'successfulPayments',
      label: 'Successful Payments',
      value: txsLoaded ? analytics.successfulPayments : '---',
      numericValue: txsLoaded ? analytics.successfulPayments : undefined,
      valueType: 'integer',
      subtext: txsLoaded ? `${((analytics.successfulPayments / Math.max(analytics.totalTransactions, 1)) * 100).toFixed(1)}% settlement rate` : 'Awaiting data...',
      subtextColor: txsLoaded ? 'text-emerald-400 font-semibold' : 'text-[var(--text-muted)]',
      delay: 0.1,
    },
    {
      key: 'failedPayments',
      label: 'Failed Payments',
      value: txsLoaded ? analytics.failedPayments : '---',
      numericValue: txsLoaded ? analytics.failedPayments : undefined,
      valueType: 'integer',
      subtext: txsLoaded ? `${((analytics.failedPayments / Math.max(analytics.totalTransactions, 1)) * 100).toFixed(1)}% rejection rate` : 'Awaiting data...',
      subtextColor: txsLoaded ? 'text-rose-400 font-semibold' : 'text-[var(--text-muted)]',
      delay: 0.15,
    },
    {
      key: 'averageAmount',
      label: 'Average Amount',
      value: txsLoaded ? `₹${analytics.averageAmount.toFixed(2)}` : '---',
      numericValue: txsLoaded ? analytics.averageAmount : undefined,
      valueType: 'currency',
      subtext: txsLoaded ? `Across ${analytics.totalTransactions} transaction(s)` : 'Awaiting data...',
      subtextColor: txsLoaded ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]',
      delay: 0.2,
    },
    {
      key: 'totalMeshNodes',
      label: 'Total Mesh Nodes',
      value: meshLoaded ? analytics.totalMeshNodes : '---',
      numericValue: meshLoaded ? analytics.totalMeshNodes : undefined,
      valueType: 'integer',
      subtext: meshLoaded ? `Idempotency cache: ${meshState.idempotencyCacheSize}` : 'Awaiting data...',
      subtextColor: meshLoaded ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]',
      delay: 0.25,
    },
    {
      key: 'activeNodes',
      label: 'Active Nodes',
      value: meshLoaded ? analytics.activeNodes : '---',
      numericValue: meshLoaded ? analytics.activeNodes : undefined,
      valueType: 'integer',
      subtext: meshLoaded ? `${analytics.totalMeshNodes - analytics.activeNodes} node(s) offline` : 'Awaiting data...',
      subtextColor: meshLoaded ? (analytics.activeNodes > 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold') : 'text-[var(--text-muted)]',
      delay: 0.3,
    },
    {
      key: 'networkHealth',
      label: 'Network Health',
      value: meshLoaded ? formatPercent(analytics.networkHealth) : '---',
      numericValue: meshLoaded ? analytics.networkHealth : undefined,
      valueType: 'percent',
      subtext: meshLoaded ? `${analytics.activeNodes} / ${analytics.totalMeshNodes} nodes connected` : 'Awaiting data...',
      subtextColor: meshLoaded ? `${percentColor(analytics.networkHealth)} font-semibold` : 'text-[var(--text-muted)]',
      delay: 0.35,
    },
    {
      key: 'packetSuccessRate',
      label: 'Packet Success Rate',
      value: txsLoaded ? formatPercent(analytics.packetSuccessRate) : '---',
      numericValue: txsLoaded ? analytics.packetSuccessRate : undefined,
      valueType: 'percent',
      subtext: txsLoaded ? `${analytics.successfulPayments} / ${analytics.totalTransactions} packets delivered` : 'Awaiting data...',
      subtextColor: txsLoaded ? `${percentColor(analytics.packetSuccessRate)} font-semibold` : 'text-[var(--text-muted)]',
      delay: 0.4,
    },
  ], [analytics, txsLoaded, meshLoaded, meshState.idempotencyCacheSize]);

  if (!hasAnyData && everythingLoading) {
    return <Loading variant="cards" message="Loading analytics data..." />;
  }

  if (!hasAnyData && everythingError) {
    const errorMessage = accountsError || txsError || meshError || 'Failed to load data';
    return (
      <ErrorState
        message={errorMessage}
        onRetry={() => { refetchAccounts(); refetchTxs(); refetchMesh(); }}
      />
    );
  }

  const chartLoading = txsLoading && transactions.length === 0;
  const hasTxData = transactions.length > 0;

  const chartTextColor = 'var(--text-secondary)';
  const chartGridColor = 'var(--border)';

  return (
    <div className="space-y-8">

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <LayoutDashboard className="h-5 w-5 text-violet-400" />
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Analytics Dashboard</h1>
          {txsRefreshing && <RefreshCw className="h-3.5 w-3.5 text-[var(--text-muted)] animate-spin" />}
        </div>
        <p className="text-[var(--text-secondary)] text-sm ml-8">
          Real-time network metrics, transaction analytics, and mesh health overview.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard key={m.key} metric={m} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard
          title="Transaction Activity"
          icon={<Activity className="h-4 w-4 text-violet-400" />}
          badge={hasTxData ? `${analytics.dailyTxData.length}d` : 'No Data'}
          delay={0.1}
          className="lg:col-span-1"
        >
          {chartLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-48 w-full rounded-xl bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
            </div>
          ) : hasTxData ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={analytics.dailyTxData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" strokeOpacity={0.4} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: chartTextColor, fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={{ stroke: chartGridColor, strokeOpacity: 0.3 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: chartTextColor, fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip suffix=" txns" />} cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Transactions"
                  stroke="#7c3aed"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#7c3aed', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No transaction activity yet." />
          )}
        </ChartCard>

        <ChartCard
          title="Daily Settlement Volume"
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
          badge={hasTxData ? `₹${analytics.totalTransactions > 0 ? (analytics.dailyVolumeData.reduce((s, d) => s + d.volume, 0) / analytics.dailyVolumeData.length).toFixed(0) : 0}/d` : 'No Data'}
          delay={0.15}
          className="lg:col-span-1"
        >
          {chartLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-48 w-full rounded-xl bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
            </div>
          ) : hasTxData ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.dailyVolumeData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" strokeOpacity={0.4} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: chartTextColor, fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={{ stroke: chartGridColor, strokeOpacity: 0.3 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  tick={{ fill: chartTextColor, fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `₹${v}`}
                />
                <Tooltip content={<CustomTooltip prefix="₹" />} cursor={{ fill: 'var(--bg-subtle)' }} />
                <Bar dataKey="volume" name="Volume" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No settlement volume yet." />
          )}
        </ChartCard>

        <ChartCard
          title="Payment Distribution"
          icon={<BarChart3 className="h-4 w-4 text-violet-400" />}
          badge={hasTxData ? `${analytics.successfulPayments}/${analytics.failedPayments}` : 'No Data'}
          delay={0.2}
          className="lg:col-span-1"
        >
          {chartLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-48 w-48 rounded-full bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
            </div>
          ) : hasTxData ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={analytics.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={96}
                  paddingAngle={4}
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
          ) : (
            <EmptyChart message="No payment data yet." />
          )}
          <div className="flex justify-center gap-6 mt-2">
            {analytics.pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ y: -2, transition: { duration: 0.25 } }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 backdrop-blur-md lg:col-span-1 flex flex-col justify-between card-hover"
        >
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-5">
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-violet-400" /> Account Balances
              </h2>
              <span className="text-[10px] bg-[var(--bg-subtle)] px-2.5 py-0.5 rounded text-[var(--text-muted)] font-mono">Core Ledger</span>
            </div>

            {accountsLoading && accounts.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-[60px] rounded-xl bg-[var(--skeleton-from)] animate-shimmer bg-[length:200%_100%]" />
                ))}
              </div>
            ) : accountsError && accounts.length === 0 ? (
              <SectionError message={accountsError} onRetry={refetchAccounts} />
            ) : (
              <motion.div
                className="space-y-3"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {accounts.length > 0 ? (
                  accounts.map((account, idx) => (
                    <motion.div
                      key={account.vpa}
                      variants={fadeInUp}
                      transition={{ duration: 0.35, delay: idx * 0.04 }}
                      className="flex items-center justify-between rounded-xl bg-[var(--bg-card-alt)] p-3.5 border border-[var(--border)] hover:border-[var(--skeleton-via)] transition-all duration-200"
                    >
                      <div>
                        <span className="block text-xs font-bold text-[var(--text-primary)]">{account.holderName}</span>
                        <span className="block text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{account.vpa}</span>
                      </div>
                      <span className="text-sm font-bold font-mono text-emerald-400">₹{account.balance.toFixed(2)}</span>
                    </motion.div>
                  ))
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                    <Database className="mx-auto h-6 w-6 text-[var(--text-muted)] mb-2" />
                    <p className="text-[var(--text-muted)] italic text-xs font-mono">No accounts available.</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/overview/send-payment"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-900/30 hover:from-violet-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-violet-900/40 transition-all duration-200 cursor-pointer"
            >
              Compose New Payment Instruction
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          whileHover={{ y: -2, transition: { duration: 0.25 } }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 backdrop-blur-md lg:col-span-2 flex flex-col justify-between card-hover"
        >
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-5">
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-400" /> Recent Mesh Ingestion{txsRefreshing ? <RefreshCw className="h-3 w-3 text-[var(--text-muted)] animate-spin ml-1" /> : null}
              </h2>
              <Link to="/overview/ledger" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                View Ledger <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {txsLoading && transactions.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </div>
            ) : txsError && transactions.length === 0 ? (
              <SectionError message={txsError} onRetry={refetchTxs} />
            ) : (
              <>
                {transactions.length > 0 ? (
                  <div className="overflow-x-auto -mx-6 px-6">
                    <table className="w-full text-left text-xs text-[var(--text-secondary)] border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[var(--text-muted)] font-mono">
                          <th className="pb-3 pr-2 uppercase tracking-wider font-semibold text-[10px]">VPA Route</th>
                          <th className="pb-3 pr-2 uppercase tracking-wider font-semibold text-[10px]">Amount</th>
                          <th className="pb-3 pr-2 uppercase tracking-wider font-semibold text-[10px]">Ingestion Mode</th>
                          <th className="pb-3 pr-2 uppercase tracking-wider font-semibold text-[10px]">Status</th>
                          <th className="pb-3 text-right uppercase tracking-wider font-semibold text-[10px]">Audit</th>
                        </tr>
                      </thead>
                      <motion.tbody
                        className="divide-y divide-[var(--border)]"
                        variants={staggerFast}
                        initial="hidden"
                        animate="visible"
                      >
                        {transactions.slice(0, 4).map((tx) => (
                          <motion.tr
                            key={tx.id}
                            variants={fadeInUp}
                            transition={{ duration: 0.3 }}
                            className="hover:bg-[var(--bg-subtle)] group transition-colors duration-150"
                          >
                            <td className="py-3.5 pr-2">
                              <span className="block font-bold text-[var(--text-primary)]">{tx.senderVpa}</span>
                              <span className="block text-[10px] text-[var(--text-muted)] font-mono mt-0.5">to {tx.receiverVpa}</span>
                            </td>
                            <td className="py-3.5 font-mono font-bold text-[var(--text-primary)]">₹{tx.amount.toFixed(2)}</td>
                            <td className="py-3.5 font-mono text-[var(--text-secondary)]">
                              <span className="block">{tx.bridgeNodeId}</span>
                              <span className="block text-[9px] text-[var(--text-muted)]">{tx.hopCount} hops</span>
                            </td>
                            <td className="py-3.5">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                tx.status === 'SETTLED'
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                                  : 'bg-rose-950/40 text-rose-400 border border-rose-900/30'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              <motion.button
                                onClick={() => handleOpenDetails(tx)}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[10px] font-bold text-violet-400 hover:text-white hover:bg-violet-600 hover:border-violet-600 transition-colors duration-200 cursor-pointer"
                              >
                                Details
                              </motion.button>
                            </td>
                          </motion.tr>
                        ))}
                      </motion.tbody>
                    </table>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
                    <Activity className="mx-auto h-8 w-8 text-[var(--text-muted)] mb-3" />
                    <p className="text-[var(--text-muted)] italic text-xs font-mono">No transactions have been processed yet.</p>
                    <span className="block text-[10px] text-[var(--text-muted)] font-mono mt-1">Inject a payment to get started.</span>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.2 }}
        whileHover={{ y: -2, transition: { duration: 0.25 } }}
        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 backdrop-blur-md card-hover"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-5">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="h-4 w-4 text-violet-400" /> Server Logs Console
          </h2>
          <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono bg-[var(--bg-subtle)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Listening (SSE Feed Simulator)
          </span>
        </div>

        <motion.div
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 font-mono text-xs overflow-y-auto max-h-52 space-y-1.5 leading-relaxed shadow-inner"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {mockLogs.length > 0 ? (
            mockLogs.map((log, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150"
              >
                <span className="text-[var(--text-muted)] shrink-0">[{log.time}]</span>
                <span className={`font-semibold shrink-0 select-none ${
                  log.level === 'WARN' ? 'text-amber-500' :
                  log.level === 'ERROR' ? 'text-rose-500' :
                  'text-violet-400'
                }`}>
                  {log.level}
                </span>
                <span className="text-[var(--text-muted)] shrink-0 font-bold">[{log.service}]</span>
                <span className="text-[var(--text-primary)] break-all">{log.msg}</span>
              </motion.div>
            ))
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
              <FileText className="mx-auto h-6 w-6 text-[var(--text-muted)] mb-2" />
              <p className="text-[var(--text-muted)] italic">No log entries available.</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      <TransactionDetailsModal
        transaction={selectedTx}
        isOpen={isModalOpen}
        onClose={handleCloseDetails}
      />

    </div>
  );
};

const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <BarChart3 className="mx-auto h-8 w-8 text-[var(--text-muted)] mb-2 opacity-40" />
      <p className="text-xs text-[var(--text-muted)] font-mono italic">{message}</p>
    </div>
  </div>
);

export default Overview;
