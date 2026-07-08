import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Smartphone, Wifi, ShieldCheck, Database,
  Layers, Radio, Lock, Zap, Server,
  Mail, GitBranch, Menu, X, Key,
  Hexagon, Cloud,
} from 'lucide-react';
import { staggerContainer, listItem, listItemScale } from '../utils/motionConfig';

const NAV_ITEMS = [
  { label: 'Features', href: '#features' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Security', href: '#security' },
  { label: 'Workflow', href: '#workflow' },
];

const FEATURES = [
  {
    icon: Wifi,
    title: 'Offline-First Payments',
    description: 'Initiate and route UPI transactions through a Bluetooth mesh network without cellular connectivity. Payments propagate hop-by-hop until they reach a bridge node.',
  },
  {
    icon: Lock,
    title: 'Hybrid Cryptography',
    description: 'Each payment envelope is sealed with AES-256-GCM and the session key is wrapped with RSA-OAEP. Intermediate nodes cannot read or tamper with transaction data.',
  },
  {
    icon: ShieldCheck,
    title: 'Idempotent Settlement',
    description: 'SHA-256 packet hashing combined with atomic compare-and-set guarantees that every transaction is settled exactly once, even when multiple bridge nodes upload duplicates.',
  },
  {
    icon: Radio,
    title: 'Gossip Protocol',
    description: 'Virtual devices propagate packets using a pull-based rumor-mongering gossip algorithm. Each round randomly exchanges packets between peer nodes in the mesh.',
  },
  {
    icon: Database,
    title: 'Deduplication Cache',
    description: 'An in-memory idempotency store prevents replay attacks and duplicate settlement. Each ciphertext hash is registered before processing, dropping redundant uploads.',
  },
  {
    icon: Zap,
    title: 'Deferred Settlement',
    description: 'Balance validation and UPI PIN verification happen at settlement time when a bridge node uploads the envelope to the central ledger.',
  },
];

const ARCH_STEPS = [
  {
    icon: Smartphone,
    title: 'Client Device',
    description: 'The sender encrypts the payment payload and injects it into the mesh via BLE.',
  },
  {
    icon: Radio,
    title: 'Mesh Gossip',
    description: 'Packets propagate through neighboring devices using a gossip protocol until reaching an internet-connected bridge node.',
  },
  {
    icon: Server,
    title: 'Bridge Ingestion',
    description: 'Bridge nodes upload collected packets to the central settlement API with hop-count metadata.',
  },
  {
    icon: Database,
    title: 'Settlement Engine',
    description: 'The backend verifies the PIN, checks balances, and settles or rejects the transaction.',
  },
];

const WORKFLOW_STEPS = [
  {
    num: '01',
    title: 'Compose Payment',
    desc: 'Enter sender VPA, receiver VPA, amount, and UPI PIN. The client creates a cryptographically sealed packet.',
  },
  {
    num: '02',
    title: 'Inject & Gossip',
    desc: 'The encrypted packet is injected into the mesh at a starting device. Each gossip round exchanges packets between peers.',
  },
  {
    num: '03',
    title: 'Bridge Upload',
    desc: 'When a packet reaches a device with internet access, it is uploaded to the settlement API.',
  },
  {
    num: '04',
    title: 'Verify & Settle',
    desc: 'The backend checks idempotency, decrypts the envelope, validates the PIN, and settles the transaction.',
  },
];

const SECURITY_POINTS = [
  {
    icon: Lock,
    title: 'AES-256-GCM Encryption',
    desc: 'Payment payloads are sealed with AES-256-GCM. Each packet uses a unique session key and initialization vector.',
  },
  {
    icon: Key,
    title: 'RSA-OAEP Key Wrapping',
    desc: 'The AES session key is wrapped with RSA-OAEP-SHA256 using the server\'s 2048-bit public key. Only the server can unwrap it.',
  },
  {
    icon: ShieldCheck,
    title: 'Replay Attack Protection',
    desc: 'A 24-hour freshness window and UUID nonces ensure captured packets cannot be replayed. Stale packets are rejected.',
  },
  {
    icon: Layers,
    title: 'Idempotency via SHA-256',
    desc: 'Each ciphertext is hashed before processing. The atomic compare-and-set cache guarantees exactly-once settlement.',
  },
];

const TECH_LOGOS = [
  'React', 'Spring Boot', 'TypeScript', 'Java 17', 'Tailwind CSS',
  'Framer Motion', 'H2 Database', 'Vite',
];

function TechBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-[#2b3240] bg-[#202532] px-3 py-1.5 text-xs text-[#94a3b8]">
      <Hexagon className="h-3 w-3 text-[#6366f1]" />
      {name}
    </span>
  );
}

function MeshIllustration() {
  const [activePath, setActivePath] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActivePath(p => (p + 1) % 4);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const devices = [
    { id: 'sender', label: 'Sender', x: 50, y: 180, color: '#6366f1' },
    { id: 'relay1', label: 'Relay', x: 160, y: 100, color: '#64748b' },
    { id: 'relay2', label: 'Relay', x: 160, y: 260, color: '#64748b' },
    { id: 'bridge', label: 'Bridge', x: 280, y: 180, color: '#22c55e' },
    { id: 'server', label: 'Server', x: 400, y: 180, color: '#6366f1' },
  ];

  const paths = [
    { from: 'sender', to: 'relay1' },
    { from: 'relay1', to: 'relay2' },
    { from: 'relay2', to: 'bridge' },
    { from: 'bridge', to: 'server' },
  ];

  const getPos = (id: string) => devices.find(d => d.id === id)!;

  const packetPos = (() => {
    const p = paths[activePath];
    const from = getPos(p.from);
    const to = getPos(p.to);
    const progress = (Date.now() % 2200) / 2200;
    const x = from.x + (to.x - from.x) * progress;
    const y = from.y + (to.y - from.y) * progress;
    return { x, y, fromId: p.from, toId: p.to };
  })();

  return (
    <svg viewBox="0 0 480 360" className="w-full h-full" fill="none">
      <defs>
        <radialGradient id="bg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="480" height="360" rx="12" fill="url(#bg-glow)" />

      {/* Connection lines */}
      {paths.map((path, i) => {
        const from = getPos(path.from);
        const to = getPos(path.to);
        const isActive = i === activePath;
        return (
          <g key={i}>
            <line
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={isActive ? '#6366f1' : '#2b3240'}
              strokeWidth={isActive ? 2 : 1}
              strokeDasharray={isActive ? 'none' : '4 4'}
            />
          </g>
        );
      })}

      {/* Cloud connection */}
      <motion.path
        d="M330 180 Q360 140 380 160"
        stroke="#6366f1"
        strokeWidth="1"
        strokeDasharray="3 3"
        fill="none"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={{ pathLength: 1, opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Device nodes */}
      {devices.map(d => (
        <g key={d.id}>
          {d.id === 'bridge' && (
            <>
              <circle cx={d.x} cy={d.y} r="22" stroke="#22c55e" strokeWidth="1" fill="#0a2818" />
              <path d="M-6-8 L6-8 L8 0 L6 8 L-6 8 L-8 0 Z" transform={`translate(${d.x},${d.y})`} fill="#22c55e" opacity="0.6" />
            </>
          )}
          {d.id === 'server' && (
            <>
              <rect x={d.x - 20} y={d.y - 16} width="40" height="32" rx="6" stroke="#6366f1" strokeWidth="1" fill="#202532" />
              <Cloud className="text-[#6366f1]" size={16} style={{ transform: `translate(${d.x - 8}px,${d.y - 8}px)` }} />
            </>
          )}
          {(d.id !== 'bridge' && d.id !== 'server') && (
            <>
              {d.id === 'sender' && (
                <motion.circle
                  cx={d.x} cy={d.y} r="20"
                  stroke="#6366f1" strokeWidth="1.5" fill="#202532"
                  animate={{ r: [20, 24, 20] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              {d.id !== 'sender' && (
                <circle cx={d.x} cy={d.y} r="16" stroke="#64748b" strokeWidth="1" fill="#202532" />
              )}
              <rect x={d.x - 7} y={d.y - 10} width="14" height="20" rx="3" fill={d.color} opacity="0.3" />
              <circle cx={d.x} cy={d.y - 12} r="6" fill={d.color} opacity="0.5" />
            </>
          )}
          <text x={d.x} y={d.y + 38} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="Inter, sans-serif">
            {d.label}
          </text>
        </g>
      ))}

      {/* Animated packet */}
      <motion.g
        key={activePath}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.3 }}
      >
        <circle cx={packetPos.x} cy={packetPos.y} r="5" fill="#6366f1" />
        <circle cx={packetPos.x} cy={packetPos.y} r="10" fill="#6366f1" opacity="0.2" />
      </motion.g>

      {/* BLE pulse waves */}
      <motion.circle
        cx={devices[0].x} cy={devices[0].y} r="28"
        stroke="#6366f1" strokeWidth="0.5"
        fill="none"
        initial={{ r: 20, opacity: 0.5 }}
        animate={{ r: 35, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.circle
        cx={devices[0].x} cy={devices[0].y} r="28"
        stroke="#6366f1" strokeWidth="0.5"
        fill="none"
        initial={{ r: 20, opacity: 0.5 }}
        animate={{ r: 35, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
      />

      {/* Legend */}
      <text x="20" y="340" fill="#64748b" fontSize="8" fontFamily="Inter, sans-serif">Encrypted Packet</text>
      <rect x="120" y="334" width="8" height="8" rx="4" fill="#6366f1" />
      <text x="360" y="340" fill="#64748b" fontSize="8" fontFamily="Inter, sans-serif">End-to-End Encrypted</text>
    </svg>
  );
}

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#f8fafc]">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Soft ambient light */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[#6366f1] opacity-[0.03] blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <motion.nav
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#0f1117]/90 border-b border-[#2b3240]' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 cursor-pointer">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6366f1] text-white">
                <Radio className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-[#f8fafc]">UPI Mesh</span>
            </button>

            <div className="hidden md:flex items-center gap-8">
              {NAV_ITEMS.map(item => (
                <a key={item.href} href={item.href}
                  className="text-xs text-[#94a3b8] hover:text-[#f8fafc] transition-colors duration-200"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/overview')}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-4 py-2 text-xs font-medium text-white hover:bg-[#4f46e5] transition-colors duration-200 cursor-pointer"
              >
                Dashboard
                <ArrowRight className="h-3 w-3" />
              </button>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-[#2b3240] text-[#94a3b8] hover:text-[#f8fafc] transition-colors cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden overflow-hidden border-t border-[#2b3240]"
              >
                <div className="flex flex-col gap-2 py-4">
                  {NAV_ITEMS.map(item => (
                    <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                      className="text-sm text-[#94a3b8] hover:text-[#f8fafc] px-2 py-2"
                    >
                      {item.label}
                    </a>
                  ))}
                  <button onClick={() => navigate('/overview')}
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#6366f1] px-4 py-2.5 text-xs font-medium text-white mt-2 cursor-pointer"
                  >
                    Dashboard <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Hero Section — Two Column */}
      <section className="relative pt-28 pb-20 lg:pt-32 lg:pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#6366f1]/20 bg-[#6366f1]/5 px-3 py-1 text-[11px] text-[#6366f1] font-medium mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6366f1]" />
                Offline Payment Protocol Simulation
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#f8fafc] leading-[1.2] mb-5">
                UPI Payments{' '}
                <span className="text-[#6366f1]">Without Internet</span>
              </h1>

              <p className="text-sm text-[#94a3b8] leading-relaxed max-w-md mb-8">
                A simulated Bluetooth mesh network that routes encrypted UPI transactions
                hop-by-hop through peer devices until they reach an internet-connected bridge
                node for settlement.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-3">
                <button
                  onClick={() => navigate('/overview')}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#6366f1] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#4f46e5] transition-colors duration-200 cursor-pointer"
                >
                  Launch Dashboard <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <a href="#features"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#2b3240] px-5 py-2.5 text-sm font-medium text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#202532] transition-all duration-200"
                >
                  Explore Features
                </a>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-6 mt-10 pt-8 border-t border-[#2b3240]">
                {[
                  { value: 'End-to-End', label: 'Encryption' },
                  { value: 'Gossip', label: 'Protocol' },
                  { value: 'Zero', label: 'Infrastructure' },
                ].map((item) => (
                  <div key={item.label}>
                    <span className="block text-xs font-medium text-[#6366f1]">{item.value}</span>
                    <span className="block text-[10px] text-[#64748b] mt-0.5">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right Column — SVG Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="w-full max-w-[480px] mx-auto"
            >
              <div className="rounded-xl border border-[#2b3240] bg-[#181c24] overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#2b3240]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
                  <span className="ml-2 text-[10px] text-[#64748b] font-mono">mesh-flow.svg</span>
                </div>
                <MeshIllustration />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted Technologies */}
      <section className="py-16 border-t border-[#2b3240]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs text-[#64748b] font-medium text-center mb-6 tracking-wider uppercase"
          >
            Built with
          </motion.p>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-2"
          >
            {TECH_LOGOS.map(tech => (
              <motion.div key={tech} variants={listItemScale} style={{ willChange: 'transform, opacity' }}>
                <TechBadge name={tech} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mb-14"
          >
            <span className="text-xs text-[#6366f1] font-medium tracking-wider uppercase mb-2 block">Features</span>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[#f8fafc]">
              Everything you need to simulate offline payments
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#2b3240] rounded-xl overflow-hidden"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={listItem}
                className="bg-[#202532] p-6 lg:p-8"
                style={{ willChange: 'transform, opacity' }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6366f1]/10 border border-[#6366f1]/20 mb-4">
                  <feature.icon className="h-4 w-4 text-[#6366f1]" />
                </div>
                <h3 className="text-sm font-medium text-[#f8fafc] mb-2">{feature.title}</h3>
                <p className="text-xs text-[#94a3b8] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="py-20 lg:py-28 bg-[#181c24]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mb-14"
          >
            <span className="text-xs text-[#6366f1] font-medium tracking-wider uppercase mb-2 block">Architecture</span>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[#f8fafc]">
              How the mesh network works
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {ARCH_STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                variants={listItem}
                style={{ willChange: 'transform, opacity' }}
              >
                <div className="rounded-lg border border-[#2b3240] bg-[#202532] p-6 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6366f1]/10 text-xs font-medium text-[#6366f1]">
                      {i + 1}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1]/10 border border-[#6366f1]/20">
                      <step.icon className="h-4 w-4 text-[#6366f1]" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-[#f8fafc] mb-2">{step.title}</h3>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Flow arrow between rows (desktop) */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="hidden lg:flex justify-center mt-8"
          >
            <div className="flex items-center gap-2 text-[10px] text-[#64748b] font-mono">
              <span>Encrypted Packet</span>
              <span className="text-[#6366f1]">→</span>
              <span>BLE Gossip</span>
              <span className="text-[#6366f1]">→</span>
              <span>Bridge Upload</span>
              <span className="text-[#6366f1]">→</span>
              <span>Settlement</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mb-14"
          >
            <span className="text-xs text-[#6366f1] font-medium tracking-wider uppercase mb-2 block">Security</span>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[#f8fafc]">
              Cryptographic guarantees at every hop
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {SECURITY_POINTS.map((point) => (
              <motion.div
                key={point.title}
                variants={listItem}
                className="rounded-lg border border-[#2b3240] bg-[#202532] p-6 flex items-start gap-4"
                style={{ willChange: 'transform, opacity' }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#6366f1]/10 border border-[#6366f1]/20">
                  <point.icon className="h-5 w-5 text-[#6366f1]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#f8fafc] mb-1.5">{point.title}</h3>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">{point.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Demo Workflow */}
      <section id="workflow" className="py-20 lg:py-28 bg-[#181c24]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mb-14"
          >
            <span className="text-xs text-[#6366f1] font-medium tracking-wider uppercase mb-2 block">Workflow</span>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[#f8fafc]">
              From payment to settlement in 4 steps
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {WORKFLOW_STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                variants={listItem}
                className="relative"
                style={{ willChange: 'transform, opacity' }}
              >
                <span className="block text-xl font-semibold text-[#2b3240] mb-2">{step.num}</span>
                <h3 className="text-sm font-medium text-[#f8fafc] mb-2">{step.title}</h3>
                <p className="text-xs text-[#94a3b8] leading-relaxed">{step.desc}</p>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-4 text-[#2b3240] text-xl">→</div>
                )}
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <button
              onClick={() => navigate('/overview')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#6366f1] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#4f46e5] transition-colors duration-200 cursor-pointer"
            >
              Try the Interactive Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[#f8fafc] mb-4">
              Ready to explore the mesh?
            </h2>
            <p className="text-sm text-[#94a3b8] max-w-md mx-auto mb-8 leading-relaxed">
              Launch the interactive dashboard to create encrypted payment packets, gossip them through virtual devices, and observe real-time settlement.
            </p>
            <button
              onClick={() => navigate('/overview')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#6366f1] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#4f46e5] transition-colors duration-200 cursor-pointer"
            >
              Launch Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2b3240] py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6366f1] text-white">
                <Radio className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold text-[#f8fafc]">UPI Mesh</span>
            </div>

            <div className="flex items-center gap-6 text-xs text-[#64748b]">
              <a href="#features" className="hover:text-[#94a3b8] transition-colors">Features</a>
              <a href="#architecture" className="hover:text-[#94a3b8] transition-colors">Architecture</a>
              <a href="#security" className="hover:text-[#94a3b8] transition-colors">Security</a>
              <a href="#workflow" className="hover:text-[#94a3b8] transition-colors">Workflow</a>
            </div>

            <div className="flex items-center gap-3">
              <motion.a
                href="https://github.com" target="_blank" rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[#2b3240] text-[#64748b] hover:text-[#f8fafc] hover:border-[#6366f1]/50 transition-all duration-200"
                aria-label="GitHub"
              >
                <GitBranch className="h-3.5 w-3.5" />
              </motion.a>
              <motion.a
                href="mailto:hello@upimesh.dev"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[#2b3240] text-[#64748b] hover:text-[#f8fafc] hover:border-[#6366f1]/50 transition-all duration-200"
                aria-label="Email"
              >
                <Mail className="h-3.5 w-3.5" />
              </motion.a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[#2b3240] text-center">
            <p className="text-[10px] text-[#64748b] font-mono">
              &copy; {new Date().getFullYear()} UPI Offline Mesh Network Simulator
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
