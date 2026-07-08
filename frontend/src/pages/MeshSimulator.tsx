import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMeshState } from '../hooks/useMeshState';
import { meshApi } from '../services/meshApi';
import type { VirtualDeviceState } from '../types';
import { Loading } from '../components/ui/Loading';
import { ErrorState } from '../components/ui/ErrorState';
import { Button } from '../components/ui/Button';
import {
  Network, Cpu, Wifi, Trash2, Smartphone, Share2, FolderOpen, Radio, Loader2,
  ZoomIn, ZoomOut, Maximize2, Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { staggerContainer, listItem, listItemScale, fadeInLeft, chartFadeIn } from '../utils/motionConfig';

// ─── Types ───────────────────────────────────────────────

interface NodePos { x: number; y: number }

interface Connection {
  from: string;
  to: string;
  signal: number;
}

interface PacketAnim {
  id: string;
  fromId: string;
  toId: string;
  status: 'alive' | 'delivered' | 'lost';
  delay: number;
}

interface PulseAnim {
  id: string;
  fromId: string;
  toId: string;
}

// ─── Constants & Helpers ────────────────────────────────

const VW = 900;
const VH = 580;
const NODE_R = 28;
const MAX_CON = 3;
const MAX_DIST = 480;

function layoutNodes(devices: VirtualDeviceState[]): Record<string, NodePos> {
  const n = devices.length;
  const cx = VW / 2;
  const cy = VH / 2;
  const rx = VW * 0.38;
  const ry = VH * 0.36;
  const pos: Record<string, NodePos> = {};
  devices.forEach((d, i) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    pos[d.deviceId] = {
      x: cx + rx * Math.cos(a) + Math.sin(i * 7.13 + 1) * 20,
      y: cy + ry * Math.sin(a) + Math.cos(i * 3.71 + 2) * 20,
    };
  });
  return pos;
}

function linkNodes(devices: VirtualDeviceState[], pos: Record<string, NodePos>): Connection[] {
  const ids = devices.map(d => d.deviceId);
  const edges: Connection[] = [];
  for (const id of ids) {
    const cands = ids
      .filter(o => o !== id)
      .map(o => {
        const dx = pos[id].x - pos[o].x;
        const dy = pos[id].y - pos[o].y;
        return { to: o, dist: Math.sqrt(dx * dx + dy * dy) };
      })
      .filter(c => c.dist < MAX_DIST)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, MAX_CON);
    for (const c of cands) {
      if (!edges.some(e => (e.from === id && e.to === c.to) || (e.from === c.to && e.to === id))) {
        edges.push({
          from: id,
          to: c.to,
          signal: c.dist < 100 ? 4 : c.dist < 180 ? 3 : c.dist < 260 ? 2 : 1,
        });
      }
    }
  }
  return edges;
}



// ─── Component ──────────────────────────────────────────

export const MeshSimulator: React.FC = () => {
  const { meshState, loading, error, refetch } = useMeshState();
  const [selectedDevice, setSelectedDevice] = useState<VirtualDeviceState | null>(null);
  const [gossipRounds, setGossipRounds] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const initialSelectionDone = useRef(false);

  const [view, setView] = useState({ x: 0, y: 0, s: 1 });
  const isPanning = useRef(false);
  const panRef = useRef({ sx: 0, sy: 0, cx: 0, cy: 0 });

  const [packets, setPackets] = useState<PacketAnim[]>([]);
  const [pulses, setPulses] = useState<PulseAnim[]>([]);
  const [tooltip, setTooltip] = useState<{ device: VirtualDeviceState; x: number; y: number } | null>(null);
  const pktCounter = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const devices = meshState.devices;
  const positions = useMemo(() => layoutNodes(devices), [devices]);
  const connections = useMemo(() => linkNodes(devices, positions), [devices, positions]);

  const nodeCount = devices.length;
  const onlineCount = devices.filter(d => d.hasInternet).length;
  const totalPackets = devices.reduce((s, d) => s + d.packetCount, 0);

  useEffect(() => {
    if (devices.length > 0 && !initialSelectionDone.current) {
      setSelectedDevice(devices[0]);
      initialSelectionDone.current = true;
    }
  }, [devices]);

  // Live Bluetooth pulses
  useEffect(() => {
    if (connections.length === 0) return;
    const tick = () => {
      if (Math.random() < 0.55) {
        const conn = connections[Math.floor(Math.random() * connections.length)];
        const id = `pulse-${Date.now()}-${Math.random()}`;
        setPulses(prev => [...prev.slice(-8), { id, fromId: conn.from, toId: conn.to }]);
        setTimeout(() => setPulses(prev => prev.filter(p => p.id !== id)), 1600);
      }
    };
    tick();
    const iv = setInterval(tick, 2200);
    return () => clearInterval(iv);
  }, [connections]);

  const spawnPackets = useCallback((count: number, fromId?: string) => {
    if (connections.length === 0) return;
    const fresh: PacketAnim[] = [];
    for (let i = 0; i < count; i++) {
      let from: string, to: string;
      if (fromId) {
        const cands = connections.filter(c => c.from === fromId || c.to === fromId);
        if (cands.length === 0) break;
        const c = cands[Math.floor(Math.random() * cands.length)];
        from = c.from; to = c.to;
      } else {
        const c = connections[Math.floor(Math.random() * connections.length)];
        from = c.from; to = c.to;
      }
      const isLost = Math.random() < 0.15;
      pktCounter.current += 1;
      fresh.push({
        id: `pkt-${pktCounter.current}`,
        fromId: from,
        toId: to,
        status: isLost ? 'lost' : 'alive',
        delay: i * 0.25,
      });
    }
    setPackets(prev => [...prev, ...fresh]);
    const alive = fresh.filter(p => p.status === 'alive');
    if (alive.length > 0) {
      setTimeout(() => {
        setPackets(prev => prev.map(p => alive.find(a => a.id === p.id) ? { ...p, status: 'delivered' as const } : p));
      }, 2200);
    }
    setTimeout(() => { setPackets(prev => prev.filter(p => !fresh.find(f => f.id === p.id))); }, 3200);
  }, [connections]);

  const handleInject = async () => {
    setActionLoading('inject');
    try {
      await meshApi.injectPacket({ senderVpa: 'alice@demo', receiverVpa: 'bob@demo', amount: 500, pin: '1234' });
      toast.success('Packet injected at phone-alice');
      spawnPackets(2, 'phone-alice');
      await refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to inject packet');
    } finally { setActionLoading(null); }
  };

  const handleGossip = async () => {
    setActionLoading('gossip');
    try {
      const result = await meshApi.triggerGossip();
      setGossipRounds(prev => prev + 1);
      toast.success(`Gossip completed: ${result.transfers} packet transfers`);
      spawnPackets(Math.min(result.transfers, 6));
      await refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to run gossip');
    } finally { setActionLoading(null); }
  };

  const handleFlush = async () => {
    setActionLoading('flush');
    try {
      const result = await meshApi.flushBridges();
      const settled = result.results.filter(r => r.outcome === 'SETTLED').length;
      const dropped = result.results.filter(r => r.outcome === 'DUPLICATE_DROPPED').length;
      toast.success(`Uploaded ${result.uploadsAttempted} packet(s). Settled: ${settled}, Duplicates: ${dropped}`);
      spawnPackets(Math.min(result.uploadsAttempted, 4));
      await refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to flush bridges');
    } finally { setActionLoading(null); }
  };

  const handleReset = async () => {
    setActionLoading('reset');
    try {
      await meshApi.resetMesh();
      setGossipRounds(0);
      setPackets([]);
      toast.success('Mesh and idempotency cache cleared');
      await refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset mesh');
    } finally { setActionLoading(null); }
  };

  // Zoom / Pan

  const getSvgScale = () => {
    if (!svgRef.current) return 1;
    return svgRef.current.getBoundingClientRect().width / VW;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgScale = getSvgScale();
    const mx = (e.clientX - rect.left) / svgScale;
    const my = (e.clientY - rect.top) / svgScale;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const ns = Math.max(0.3, Math.min(3, view.s * factor));
    setView({ s: ns, x: mx - (mx - view.x) * (ns / view.s), y: my - (my - view.y) * (ns / view.s) });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as Element;
    if (target.closest('[data-node]') || target.closest('.mesh-ctrl')) return;
    isPanning.current = true;
    panRef.current = { sx: view.x, sy: view.y, cx: e.clientX, cy: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning.current) return;
    const svgScale = getSvgScale();
    setView(prev => ({ ...prev, x: panRef.current.sx + (e.clientX - panRef.current.cx) / svgScale, y: panRef.current.sy + (e.clientY - panRef.current.cy) / svgScale }));
  };

  const handlePointerUp = () => { isPanning.current = false; };

  // Tooltip

  const handleNodeEnter = (e: React.MouseEvent, device: VirtualDeviceState) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ device, x: e.clientX - rect.left + 14, y: e.clientY - rect.top - 10 });
  };

  const handleNodeMove = (e: React.MouseEvent) => {
    if (!tooltip) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip(prev => prev ? { ...prev, x: e.clientX - rect.left + 14, y: e.clientY - rect.top - 10 } : null);
  };

  const handleNodeLeave = () => setTooltip(null);

  if (loading) return <Loading message="Loading mesh state..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <Radio className="h-5 w-5 text-[var(--accent)]" />
          <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Mesh Network</h1>
        </div>
        <p className="text-[var(--text-secondary)] text-sm ml-8">
          Interactive Bluetooth mesh topology — gossip transactions node-by-node and upload to the settlement gateway.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Graph area */}
        <motion.div
          variants={chartFadeIn}
          initial="hidden"
          animate="visible"
          className="lg:col-span-3 rounded-lg bg-[var(--bg-card)] shadow-[var(--shadow-md)] overflow-hidden"
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Network className="h-4 w-4 text-[var(--accent)]" />
              <h2 className="text-xs font-medium text-[var(--text-secondary)]">Bluetooth Gossip Topology</h2>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)]">
              <span>{nodeCount} nodes</span>
              <span className="text-[var(--success)]">{onlineCount} online</span>
              <span>{totalPackets} packets</span>
            </div>
          </div>

          <div
            ref={containerRef}
            className="relative overflow-hidden select-none"
            style={{ height: 560, cursor: isPanning.current ? 'grabbing' : 'grab', background: 'var(--bg-card-alt)' }}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {devices.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Network className="mx-auto h-8 w-8 text-[var(--text-muted)] mb-3" />
                  <p className="text-[var(--text-muted)] text-xs">No devices in the mesh.</p>
                </div>
              </div>
            ) : (
              <>
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${VW} ${VH}`}
                  className="w-full h-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <rect width={VW} height={VH} fill="transparent" className="mesh-bg" />

                  <g transform={`translate(${view.x},${view.y}) scale(${view.s})`}>
                    {/* Connection lines */}
                    {connections.map(conn => {
                      const f = positions[conn.from];
                      const t = positions[conn.to];
                      if (!f || !t) return null;
                      const isSelectedPair = selectedDevice &&
                        (selectedDevice.deviceId === conn.from || selectedDevice.deviceId === conn.to);
                      return (
                        <line
                          key={`line-${conn.from}-${conn.to}`}
                          x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                          stroke={isSelectedPair ? 'rgba(99,102,241,0.35)' : 'rgba(100,116,139,0.25)'}
                          strokeWidth={isSelectedPair ? 2 : 1.5}
                          strokeDasharray={isSelectedPair ? 'none' : '5 4'}
                        />
                      );
                    })}

                    {/* Bluetooth pulses */}
                    {pulses.map(p => {
                      const f = positions[p.fromId];
                      const t = positions[p.toId];
                      if (!f || !t) return null;
                      return (
                        <motion.circle
                          key={p.id}
                          r={3}
                          fill="rgba(99,102,241,0.4)"
                          initial={{ cx: f.x, cy: f.y, opacity: 0.6 }}
                          animate={{ cx: t.x, cy: t.y, opacity: 0 }}
                          transition={{ duration: 1.6, ease: 'linear' }}
                        />
                      );
                    })}

                    {/* Nodes */}
                    {devices.map(dev => {
                      const pos = positions[dev.deviceId];
                      if (!pos) return null;
                      const isSelected = selectedDevice?.deviceId === dev.deviceId;
                      const isOnline = dev.hasInternet;
                      return (
                        <g
                          key={dev.deviceId}
                          data-node={dev.deviceId}
                          onClick={() => setSelectedDevice(dev)}
                          onMouseEnter={e => handleNodeEnter(e, dev)}
                          onMouseMove={handleNodeMove}
                          onMouseLeave={handleNodeLeave}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Selection ring */}
                          {isSelected && (
                            <circle
                              cx={pos.x} cy={pos.y}
                              r={NODE_R + 5}
                              fill="none"
                              stroke="rgba(99,102,241,0.25)"
                              strokeWidth={2}
                            />
                          )}

                          {/* Main circle */}
                          <circle
                            cx={pos.x} cy={pos.y}
                            r={NODE_R}
                            fill="var(--bg-card)"
                            stroke={isOnline ? 'var(--success)' : '#64748b'}
                            strokeWidth={isSelected ? 2.5 : 1.5}
                          />

                          {/* Device icon */}
                          <Smartphone
                            x={pos.x - 10} y={pos.y - 10}
                            width={20} height={20}
                            color={isOnline ? '#22c55e' : '#64748b'}
                            opacity={0.9}
                          />

                          {/* Online dot */}
                          <circle
                            cx={pos.x - NODE_R + 9} cy={pos.y + NODE_R - 9}
                            r={4}
                            fill={isOnline ? '#22c55e' : '#ef4444'}
                            stroke="var(--bg-card)"
                            strokeWidth={1.5}
                          />

                          {/* Packet count badge */}
                          {dev.packetCount > 0 && (
                            <>
                              <circle
                                cx={pos.x + NODE_R - 7} cy={pos.y - NODE_R + 7}
                                r={9}
                                fill={isOnline ? '#22c55e' : '#52525b'}
                                stroke="var(--bg-card)"
                                strokeWidth={1.5}
                              />
                              <text
                                x={pos.x + NODE_R - 7} y={pos.y - NODE_R + 7}
                                textAnchor="middle" dominantBaseline="central"
                                fill="white" fontSize={8} fontWeight={700}
                              >
                                {dev.packetCount}
                              </text>
                            </>
                          )}

                          {/* Device name */}
                          <text
                            x={pos.x} y={pos.y + NODE_R + 16}
                            textAnchor="middle"
                            fill="var(--text-secondary)"
                            fontSize={9} fontWeight={500}
                          >
                            {dev.deviceId}
                          </text>

                          {/* Status */}
                          <text
                            x={pos.x} y={pos.y + NODE_R + 28}
                            textAnchor="middle"
                            fill={isOnline ? '#22c55e' : '#ef4444'}
                            fontSize={7.5} fontWeight={600}
                          >
                            {isOnline ? 'ONLINE' : 'OFFLINE'}
                          </text>
                        </g>
                      );
                    })}

                    {/* Animated packets */}
                    {packets.map(pkt => {
                      const from = positions[pkt.fromId];
                      const to = positions[pkt.toId];
                      if (!from || !to) return null;
                      const isLost = pkt.status === 'lost';
                      const isDelivered = pkt.status === 'delivered';
                      const endX = isLost ? (from.x + to.x) * 0.5 : to.x;
                      const endY = isLost ? (from.y + to.y) * 0.5 : to.y;
                      return (
                        <g key={pkt.id}>
                          <motion.circle
                            r={4.5}
                            fill={isLost ? '#ef4444' : isDelivered ? '#22c55e' : '#6366f1'}
                            initial={{ cx: from.x, cy: from.y, opacity: 0, scale: 0.3 }}
                            animate={{
                              cx: endX, cy: endY,
                              opacity: isLost ? [1, 1, 0] : isDelivered ? [1, 1, 1, 0] : [0, 1, 1, 0],
                              scale: isLost ? [0.3, 1.2, 0] : isDelivered ? [0.3, 1.3, 1.3, 0.3] : [0.3, 1.2, 1, 0.5],
                            }}
                            transition={{ duration: isLost ? 1.2 : 2.2, delay: pkt.delay, ease: 'easeInOut' }}
                          />
                          {isDelivered && (
                            <motion.circle
                              cx={to.x} cy={to.y} r={0}
                              fill="none" stroke="#22c55e" strokeWidth={2}
                              initial={{ r: 0, opacity: 1 }}
                              animate={{ r: 24, opacity: 0 }}
                              transition={{ duration: 0.6, delay: pkt.delay + 2 }}
                            />
                          )}
                          {isLost && (
                            <motion.circle
                              cx={endX} cy={endY} r={0}
                              fill="none" stroke="#ef4444" strokeWidth={1.5}
                              initial={{ r: 0, opacity: 1 }}
                              animate={{ r: 18, opacity: 0 }}
                              transition={{ duration: 0.5, delay: pkt.delay + 0.8 }}
                            />
                          )}
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Legend */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="mesh-ctrl absolute bottom-4 left-4 rounded-lg bg-[var(--bg-card)] px-3 py-2.5 shadow-[var(--shadow-md)]"
                >
                  <div className="flex items-center gap-4 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                      <span className="text-[var(--text-muted)]">Online</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
                      <span className="text-[var(--text-muted)]">Offline</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                      <span className="text-[var(--text-muted)]">In transit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                      <span className="text-[var(--text-muted)]">Delivered</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#ef4444] opacity-60" />
                      <span className="text-[var(--text-muted)]">Lost</span>
                    </div>
                  </div>
                </motion.div>

                {/* Zoom controls */}
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                  className="mesh-ctrl absolute bottom-4 right-4 flex flex-col gap-1.5"
                >
                  <button
                    onClick={() => setView(prev => ({ ...prev, s: Math.min(3, prev.s * 1.25) }))}
                    className="p-2 rounded-lg bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-all duration-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.3)]"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setView(prev => ({ ...prev, s: Math.max(0.3, prev.s / 1.25) }))}
                    className="p-2 rounded-lg bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-all duration-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.3)]"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setView({ x: 0, y: 0, s: 1 })}
                    className="p-2 rounded-lg bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-all duration-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.3)]"
                    title="Reset View"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </motion.div>

                {/* Zoom indicator */}
                <div className="mesh-ctrl absolute top-4 right-4 px-2.5 py-1 rounded-lg bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] shadow-[0_1px_3px_0_rgba(0,0,0,0.3)]">
                  {Math.round(view.s * 100)}%
                </div>

                {/* Tooltip */}
                <AnimatePresence>
                  {tooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="mesh-ctrl absolute z-10 pointer-events-none"
                      style={{ left: tooltip.x, top: tooltip.y }}
                    >
                      <div className="bg-[var(--bg-card)] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.4)] p-3 min-w-[180px]">
                        <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[var(--border)]">
                          <Smartphone className="h-3.5 w-3.5 text-[var(--accent)]" />
                          <span className="text-xs font-semibold text-[var(--text-primary)]">{tooltip.device.deviceId}</span>
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Status</span>
                            <span className={tooltip.device.hasInternet ? 'text-[var(--success)] font-medium' : 'text-[var(--danger)] font-medium'}>
                              {tooltip.device.hasInternet ? 'Online (4G)' : 'Offline'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Packets</span>
                            <span className="text-[var(--text-primary)] font-medium">{tooltip.device.packetCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Role</span>
                            <span className="text-[var(--text-primary)] font-medium">{tooltip.device.hasInternet ? 'Bridge' : 'Node'}</span>
                          </div>
                          {tooltip.device.packetIds.length > 0 && (
                            <div className="border-t border-[var(--border)] pt-1.5 mt-1.5">
                              <span className="text-[var(--text-muted)] block mb-1">Packet IDs</span>
                              <div className="max-h-[72px] overflow-y-auto space-y-0.5">
                                {tooltip.device.packetIds.map(pid => (
                                  <div key={pid} className="text-[var(--accent)] bg-[var(--bg-subtle)] px-1.5 py-0.5 rounded text-[9px] truncate">
                                    {pid}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </motion.div>

        {/* Controls sidebar */}
        <motion.div
          variants={fadeInLeft}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4, delay: 0.15 }}
          className="lg:col-span-1 space-y-4"
        >
          <motion.div
            variants={listItem}
            className="rounded-lg bg-[var(--bg-card)] p-5 shadow-[var(--shadow-md)]"
            style={{ willChange: 'transform, opacity' }}
          >
            <h2 className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-2 mb-5">
              <Cpu className="h-4 w-4 text-[var(--accent)]" /> Controls
            </h2>

            <motion.div
              className="space-y-2.5"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={listItemScale}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={actionLoading === 'inject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                  onClick={handleInject}
                  disabled={actionLoading !== null}
                  className="w-full justify-start"
                >
                  {actionLoading === 'inject' ? 'Injecting...' : 'Inject Packet'}
                </Button>
              </motion.div>

              <motion.div variants={listItemScale}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={actionLoading === 'gossip' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
                  onClick={handleGossip}
                  disabled={actionLoading !== null}
                  className="w-full justify-start"
                >
                  {actionLoading === 'gossip' ? 'Gossiping...' : `Gossip (${gossipRounds})`}
                </Button>
              </motion.div>

              <motion.div variants={listItemScale}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={actionLoading === 'flush' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5" />}
                  onClick={handleFlush}
                  disabled={actionLoading !== null}
                  className="w-full justify-start"
                >
                  {actionLoading === 'flush' ? 'Flushing...' : 'Flush Bridges'}
                </Button>
              </motion.div>

              <motion.div variants={listItemScale}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={actionLoading === 'reset' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  onClick={handleReset}
                  disabled={actionLoading !== null}
                  className="w-full justify-start text-[var(--danger)] hover:text-[var(--danger)] border-[var(--danger)]/20 hover:border-[var(--danger)]/40"
                >
                  {actionLoading === 'reset' ? 'Resetting...' : 'Reset State'}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Device Inspector */}
          <motion.div
            variants={listItem}
            className="rounded-lg bg-[var(--bg-card)] p-5 shadow-[var(--shadow-md)] flex flex-col"
            style={{ willChange: 'transform, opacity' }}
          >
            <h2 className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-2 mb-5">
              <FolderOpen className="h-4 w-4 text-[var(--accent)]" /> Device Inspector
            </h2>

            {selectedDevice ? (
              <motion.div
                key={selectedDevice.deviceId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 text-xs"
              >
                <div className="space-y-2 pb-4 border-b border-[var(--border)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Device</span>
                    <span className="text-[var(--text-primary)] font-medium">{selectedDevice.deviceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Internet</span>
                    <span className={selectedDevice.hasInternet ? 'text-[var(--success)] font-medium' : 'text-[var(--text-secondary)] font-medium'}>
                      {selectedDevice.hasInternet ? 'Online (4G)' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Packets</span>
                    <span className="text-[var(--text-primary)] font-medium">{selectedDevice.packetCount}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Packet Queue</span>

                  {selectedDevice.packetIds.length > 0 ? (
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {selectedDevice.packetIds.map(id => (
                        <motion.div
                          key={id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25 }}
                          className="rounded-lg bg-[var(--bg-card-alt)] px-3 py-2"
                        >
                          <span className="block text-[11px] font-medium text-[var(--accent)]">{id}</span>
                          <span className="block text-[9px] text-[var(--text-muted)] mt-0.5">ciphertext: base64(RSA_OAEP_AES_GCM[...])</span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[var(--text-muted)] py-6 text-center text-[11px]">No packets in buffer.</p>
                  )}
                </div>
              </motion.div>
            ) : (
              <p className="text-[var(--text-muted)] py-8 text-center text-xs">Click a device to inspect.</p>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default MeshSimulator;
