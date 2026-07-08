import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, listItem } from '../utils/motionConfig';
import {
  WifiOff, Zap, Layers, Lock, Radio, CheckCircle,
  ShieldCheck, Clock, Shuffle, BookOpen,
  Server,
} from 'lucide-react';

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; number: string }> = ({ icon, title, number }) => (
  <div className="flex items-center gap-3 mb-6">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)]">
      {icon}
    </span>
    <div>
      <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">{number}</span>
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
    </div>
  </div>
);

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => (
  <div className="rounded-lg bg-[var(--bg-card-alt)] border border-[var(--border)] overflow-hidden">
    {language && (
      <div className="px-4 py-1.5 border-b border-[var(--border)] text-[10px] font-medium text-[var(--text-muted)]">{language}</div>
    )}
    <pre className="p-4 text-[11px] font-mono text-[var(--text-secondary)] leading-relaxed overflow-x-auto whitespace-pre">{code}</pre>
  </div>
);

export const About: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-16 max-w-4xl mx-auto pb-16"
    >
      {/* Hero */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-5 w-5 text-[var(--accent)]" />
          <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">About</h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Technical deep-dive into the mesh-routed, offline-first payment system — from encryption to settlement.
        </p>
      </motion.div>

      {/* Problem */}
      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
        <SectionHeader icon={<WifiOff className="h-4 w-4" />} title="The Offline Payment Problem" number="01" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Billions of people in emerging markets own smartphones but lack reliable cellular data or internet connectivity.
              Traditional digital payments require both sender and receiver to be online at the time of transaction.
              This excludes large populations from participating in the digital economy.
            </p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              The core challenge: how do you authorize a payment when neither phone can reach a bank server?
              How do you prevent fraud when the transaction data passes through untrusted intermediate devices?
            </p>
          </div>
          <div className="md:col-span-2 flex items-center justify-center">
            <svg viewBox="0 0 200 140" className="w-full max-w-[200px]">
              <rect x="10" y="20" width="70" height="100" rx="8" fill="var(--bg-card-alt)" stroke="var(--border)" strokeWidth="1.5" />
              <rect x="25" y="30" width="40" height="6" rx="2" fill="var(--bg-subtle)" />
              <circle cx="45" cy="55" r="12" fill="var(--bg-subtle)" stroke="var(--text-muted)" strokeWidth="1" />
              <rect x="30" y="75" width="30" height="4" rx="1" fill="var(--bg-subtle)" />
              <rect x="30" y="83" width="30" height="4" rx="1" fill="var(--bg-subtle)" />

              <rect x="120" y="20" width="70" height="100" rx="8" fill="var(--bg-card-alt)" stroke="var(--border)" strokeWidth="1.5" />
              <rect x="135" y="30" width="40" height="6" rx="2" fill="var(--bg-subtle)" />
              <circle cx="155" cy="55" r="12" fill="var(--bg-subtle)" stroke="var(--text-muted)" strokeWidth="1" />
              <rect x="140" y="75" width="30" height="4" rx="1" fill="var(--bg-subtle)" />
              <rect x="140" y="83" width="30" height="4" rx="1" fill="var(--bg-subtle)" />

              <line x1="80" y1="70" x2="120" y2="70" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 3" />
              <text x="100" y="65" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="600">NO CELL</text>

              <line x1="80" y1="50" x2="120" y2="50" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="80" y1="90" x2="120" y2="90" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" />

              <text x="45" y="132" textAnchor="middle" fill="var(--text-muted)" fontSize="7">Sender</text>
              <text x="155" y="132" textAnchor="middle" fill="var(--text-muted)" fontSize="7">Receiver</text>
            </svg>
          </div>
        </div>
      </motion.section>

      {/* Solution */}
      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
        <SectionHeader icon={<Zap className="h-4 w-4" />} title="Mesh-Routed Deferred Settlement" number="02" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              The system enables offline peer-to-peer transactions by encrypting payment instructions into tamper-proof packets
              that propagate through a Bluetooth mesh network of nearby phones until one of them has internet access.
              That "bridge" node delivers the packet to a central settlement server.
            </p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              This deferred settlement model means the actual balance transfer happens minutes or hours after the payment
              was initiated — the encrypted packet serves as a cryptographic IOU that cannot be forged or altered.
            </p>
          </div>
          <div className="md:col-span-2 flex items-center justify-center">
            <svg viewBox="0 0 240 130" className="w-full max-w-[240px]">
              <rect x="5" y="40" width="32" height="50" rx="5" fill="var(--bg-card-alt)" stroke="var(--border)" strokeWidth="1" />
              <circle cx="21" cy="58" r="6" fill="var(--bg-subtle)" />
              <rect x="12" y="70" width="18" height="3" rx="1" fill="var(--bg-subtle)" />

              <rect x="55" y="30" width="32" height="50" rx="5" fill="var(--bg-card-alt)" stroke="var(--border)" strokeWidth="1" />
              <circle cx="71" cy="48" r="6" fill="var(--bg-subtle)" />
              <rect x="62" y="60" width="18" height="3" rx="1" fill="var(--bg-subtle)" />

              <rect x="105" y="40" width="32" height="50" rx="5" fill="var(--bg-card-alt)" stroke="var(--border)" strokeWidth="1" />
              <circle cx="121" cy="58" r="6" fill="var(--bg-subtle)" />
              <rect x="112" y="70" width="18" height="3" rx="1" fill="var(--bg-subtle)" />

              <rect x="155" y="20" width="32" height="50" rx="5" fill="var(--bg-card-alt)" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="171" cy="38" r="6" fill="var(--accent-subtle)" stroke="var(--accent)" strokeWidth="1" />
              <rect x="162" y="50" width="18" height="3" rx="1" fill="var(--bg-subtle)" />

              <rect x="205" y="20" width="30" height="55" rx="6" fill="var(--accent-subtle)" stroke="var(--accent)" strokeWidth="1.5" />
              <rect x="210" y="28" width="20" height="4" rx="1" fill="var(--accent)" opacity="0.3" />
              <text x="220" y="55" textAnchor="middle" fill="var(--accent)" fontSize="6" fontWeight="700">DB</text>

              <circle cx="21" cy="58" r="2" fill="var(--accent)" />
              <circle cx="71" cy="48" r="2" fill="var(--accent)" />
              <circle cx="121" cy="58" r="2" fill="var(--accent)" />

              <path d="M 37 58 Q 46 48 55 48" fill="none" stroke="var(--accent)" strokeWidth="1.2" opacity="0.5" />
              <path d="M 87 48 Q 96 52 105 58" fill="none" stroke="var(--accent)" strokeWidth="1.2" opacity="0.5" />
              <path d="M 137 58 Q 146 40 155 40" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.7" markerEnd="url(#arrow)" />
              <path d="M 187 40 Q 196 45 205 45" fill="none" stroke="#22c55e" strokeWidth="1.5" markerEnd="url(#arrowGreen)" />

              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill="var(--accent)" /></marker>
                <marker id="arrowGreen" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill="#22c55e" /></marker>
              </defs>

              <text x="21" y="103" textAnchor="middle" fill="var(--text-muted)" fontSize="7">Alice</text>
              <text x="71" y="93" textAnchor="middle" fill="var(--text-muted)" fontSize="7">Node</text>
              <text x="121" y="103" textAnchor="middle" fill="var(--text-muted)" fontSize="7">Node</text>
              <text x="171" y="83" textAnchor="middle" fill="var(--text-muted)" fontSize="7">Bridge</text>
              <text x="220" y="85" textAnchor="middle" fill="var(--text-muted)" fontSize="7">Server</text>
            </svg>
          </div>
        </div>
      </motion.section>

      {/* Encryption Flow */}
      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
        <SectionHeader icon={<Lock className="h-4 w-4" />} title="Hybrid Encryption Flow" number="03" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Each payment packet is encrypted using a hybrid cryptosystem combining RSA-OAEP and AES-256-GCM.
              This ensures only the settlement server can decrypt the contents, and any tampering is immediately detected.
            </p>
            <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-0.5">1.</span>
                <span>A random 256-bit AES-GCM session key is generated per transaction</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-0.5">2.</span>
                <span>The payment payload (VPA, amount, PIN hash, timestamp) is encrypted with AES-GCM</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-0.5">3.</span>
                <span>The AES session key is encrypted with the server's RSA-2048 public key (RSA-OAEP)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-0.5">4.</span>
                <span>The ciphertext and encrypted key are bundled into a packet and sent into the mesh</span>
              </li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <CodeBlock language="Encryption Pseudo-code" code={`function encrypt(payload, serverPubKey):
  sessionKey = randomBytes(32)        // AES-256 key
  ciphertext = AES_GCM_encrypt(       // Encrypt payload
    payload, sessionKey
  )
  encryptedKey = RSA_OAEP_encrypt(    // Wrap session key
    sessionKey, serverPubKey
  )
  return { ciphertext, encryptedKey } // Bundle`} />
          </div>
        </div>
      </motion.section>

      {/* Bluetooth Mesh */}
      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
        <SectionHeader icon={<Radio className="h-4 w-4" />} title="Bluetooth Gossip Mesh" number="04" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Once encrypted, the packet propagates through the mesh using a gossip protocol. Each node periodically
              broadcasts its inventory of packet IDs to nearby devices. Nodes request missing packets from peers,
              spreading the data throughout the network.
            </p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              This epidemic-style dissemination ensures packets eventually reach a bridge node with internet access,
              even if the path requires multiple hops through intermediate phones.
            </p>
          </div>
          <div className="md:col-span-2">
            <CodeBlock language="Gossip Protocol" code={`function gossipRound(nodes):
  for each node in nodes:
    peers = discoverNearby()
    inventory = node.getPacketIds()
    for each peer in peers:
      peerInventory = peer.getPacketIds()
      missing = inventory - peerInventory
      for each packetId in missing:
        peer.request(packetId)
        packet = node.transfer(packetId)
        peer.store(packet)`} />
          </div>
        </div>
      </motion.section>

      {/* Settlement */}
      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
        <SectionHeader icon={<CheckCircle className="h-4 w-4" />} title="Bridge Upload & Settlement" number="05" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              When a bridge node (a phone with internet access) receives a packet, it uploads it to the settlement server.
              The server performs the following validation pipeline:
            </p>
            <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--success)] mt-0.5">1.</span>
                <span><strong>Idempotency check</strong> — SHA-256 hash of ciphertext checked against Redis SETNX</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--success)] mt-0.5">2.</span>
                <span><strong>Decryption</strong> — RSA-OAEP unwraps session key, AES-GCM decrypts payload</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--success)] mt-0.5">3.</span>
                <span><strong>Freshness check</strong> — signedAt must be within 24 hours, nonce must be unique</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--success)] mt-0.5">4.</span>
                <span><strong>PIN verification</strong> — PIN hash compared against stored account credentials</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--success)] mt-0.5">5.</span>
                <span><strong>Balance check</strong> — sufficient funds verified, amount debited from sender</span>
              </li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <svg viewBox="0 0 200 160" className="w-full max-w-[200px]">
              <rect x="10" y="5" width="50" height="35" rx="5" fill="var(--bg-card-alt)" stroke="var(--border)" strokeWidth="1" />
              <text x="35" y="28" textAnchor="middle" fill="var(--text-muted)" fontSize="8">Bridge</text>
              <path d="M 60 22 L 80 22" stroke="var(--accent)" strokeWidth="1.5" markerEnd="url(#a1)" />
              <rect x="80" y="5" width="50" height="35" rx="5" fill="var(--accent-subtle)" stroke="var(--accent)" strokeWidth="1" />
              <text x="105" y="28" textAnchor="middle" fill="var(--accent)" fontSize="7">Server</text>
              <path d="M 130 22 L 150 22" stroke="#22c55e" strokeWidth="1.5" markerEnd="url(#a2)" />
              <rect x="150" y="5" width="40" height="35" rx="5" fill="var(--bg-card-alt)" stroke="var(--border)" strokeWidth="1" />
              <text x="170" y="28" textAnchor="middle" fill="var(--text-muted)" fontSize="7">DB</text>

              <rect x="10" y="55" width="50" height="35" rx="5" fill="var(--bg-card-alt)" stroke="var(--border)" strokeWidth="1" />
              <text x="35" y="78" textAnchor="middle" fill="var(--text-muted)" fontSize="8">Bridge 2</text>
              <path d="M 60 72 L 160 35" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 3" />
              <text x="125" y="60" textAnchor="middle" fill="#ef4444" fontSize="6">DUPLICATE</text>

              <rect x="10" y="105" width="50" height="35" rx="5" fill="var(--bg-card-alt)" stroke="var(--border)" strokeWidth="1" />
              <text x="35" y="128" textAnchor="middle" fill="var(--text-muted)" fontSize="8">Bridge 3</text>
              <path d="M 60 122 L 80 35" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 3" />
              <text x="45" y="95" textAnchor="middle" fill="#ef4444" fontSize="6">DUPLICATE</text>

              <defs>
                <marker id="a1" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill="var(--accent)" /></marker>
                <marker id="a2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" fill="#22c55e" /></marker>
              </defs>
            </svg>
          </div>
        </div>
      </motion.section>

      {/* Architecture */}
      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
        <SectionHeader icon={<Layers className="h-4 w-4" />} title="System Architecture" number="06" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              The system is divided into four logical layers. Each layer is independently replaceable
              and communicates through well-defined interfaces.
            </p>
            <motion.div
              className="space-y-2"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                { layer: 'Client Layer', desc: 'Android/iOS apps with BLE, encryption engine, local key cache', color: 'text-[var(--accent)]' },
                { layer: 'Mesh Layer', desc: 'Gossip protocol, peer discovery, packet store-and-forward', color: 'text-[var(--accent)]' },
                { layer: 'Bridge Layer', desc: 'Internet gateway nodes, HTTP transport, batch upload', color: 'text-[var(--success)]' },
                { layer: 'Settlement Layer', desc: 'REST API, HSM decryption, ledger DB, idempotency cache', color: 'text-[var(--warning)]' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={listItem}
                  className="flex items-start gap-3 rounded-lg bg-[var(--bg-card-alt)] p-3"
                  style={{ willChange: 'transform, opacity' }}
                >
                  <span className={`text-[10px] font-bold ${item.color} mt-0.5`}>{item.layer}</span>
                  <span className="text-[11px] text-[var(--text-secondary)]">{item.desc}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
          <div className="md:col-span-2 flex items-center justify-center">
            <svg viewBox="0 0 180 180" className="w-full max-w-[180px]">
              {[
                { y: 10, h: 30, color: 'var(--accent-subtle)', stroke: 'var(--accent)', label: 'Client', sub: 'BLE + Crypto' },
                { y: 50, h: 30, color: 'var(--bg-card-alt)', stroke: 'var(--border)', label: 'Mesh', sub: 'Gossip Protocol' },
                { y: 90, h: 30, color: 'var(--bg-card-alt)', stroke: 'var(--border)', label: 'Bridge', sub: 'HTTP Transport' },
                { y: 130, h: 30, color: 'var(--bg-card-alt)', stroke: 'var(--border)', label: 'Settlement', sub: 'REST API' },
              ].map((layer, i) => (
                <g key={i}>
                  <rect x="20" y={layer.y} width="140" height={layer.h} rx="6" fill={layer.color} stroke={layer.stroke} strokeWidth="1" />
                  <text x="35" y={layer.y + layer.h / 2 + 1} fill="var(--text-primary)" fontSize="8" fontWeight="600">{layer.label}</text>
                  <text x="35" y={layer.y + layer.h / 2 + 11} fill="var(--text-muted)" fontSize="6">{layer.sub}</text>
                  {i < 3 && <line x1="90" y1={layer.y + layer.h} x2="90" y2={layer.y + layer.h + 10} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="2 2" />}
                  {i < 3 && <path d="M 86 50 L 90 55 L 94 50" fill="none" stroke="var(--text-muted)" strokeWidth="1" />}
                  {i < 3 && <path d="M 86 90 L 90 95 L 94 90" fill="none" stroke="var(--text-muted)" strokeWidth="1" />}
                  {i < 3 && <path d="M 86 130 L 90 135 L 94 130" fill="none" stroke="var(--text-muted)" strokeWidth="1" />}
                </g>
              ))}
            </svg>
          </div>
        </div>
      </motion.section>

      {/* Security */}
      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
        <SectionHeader icon={<ShieldCheck className="h-4 w-4" />} title="End-to-End Security" number="07" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Security is enforced at multiple layers. The hybrid encryption ensures confidentiality,
              AES-GCM provides integrity verification, and the server's RSA key guarantees that only
              the authorized backend can read transaction contents.
            </p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Intermediate mesh nodes cannot decrypt, modify, or forge packets. They act as blind carriers,
              only storing and forwarding opaque ciphertext blobs. The server validates the authenticity
              of every decrypted payload against known account structures.
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="rounded-lg bg-[var(--bg-card-alt)] border border-[var(--border)] p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Lock className="h-3.5 w-3.5 text-[var(--success)]" />
                <span className="text-[var(--text-primary)] font-medium">Confidentiality</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] pl-5">RSA-OAEP + AES-256-GCM hybrid encryption</p>
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--success)]" />
                <span className="text-[var(--text-primary)] font-medium">Integrity</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] pl-5">AES-GCM authentication tags detect tampering</p>
              <div className="flex items-center gap-2 text-xs">
                <Shuffle className="h-3.5 w-3.5 text-[var(--success)]" />
                <span className="text-[var(--text-primary)] font-medium">Non-Repudiation</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] pl-5">Server-signed settlement records on ledger</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Replay Protection */}
      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
        <SectionHeader icon={<Clock className="h-4 w-4" />} title="Replay Attack Protection" number="08" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              An attacker who intercepts a packet cannot replay it later. Each encrypted payload contains
              a <code className="text-[var(--accent)]">signedAt</code> timestamp that the server checks against a
              24-hour freshness window. Additionally, a UUID nonce ensures each packet produces a unique
              SHA-256 hash, making every replay attempt distinguishable.
            </p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              If an attacker replays an old packet, the server either rejects it due to timestamp expiry
              or the idempotency cache already contains its hash and silently drops it.
            </p>
          </div>
          <div className="md:col-span-2">
            <CodeBlock language="Packet Structure" code={`{
  "senderVpa": "alice@demo",
  "receiverVpa": "bob@demo",
  "amount": 500.00,
  "pinHash": "a1b2...",
  "nonce": "uuid-v4",
  "signedAt": "2026-07-08T12:05:22Z",
  "ttl": 5
}
// Frozen in AES-GCM
// Nonce ensures unique hash`} />
          </div>
        </div>
      </motion.section>

      {/* Duplicate Prevention */}
      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
        <SectionHeader icon={<Shuffle className="h-4 w-4" />} title="Duplicate Prevention via Idempotency" number="09" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Multiple bridge nodes may upload the same packet. The server computes a SHA-256 hash of the raw ciphertext
              and uses an atomic compare-and-set operation (backed by Redis) to claim it. Only the first claimant
              proceeds to settlement; all duplicates are silently dropped.
            </p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              This guarantees exactly-once processing semantics despite the at-least-once delivery from the mesh.
            </p>
          </div>
          <div className="md:col-span-2">
            <CodeBlock language="Idempotency Check" code={`// Atomic claim on ciphertext hash
hash = SHA256(ciphertext)
claimed = redis.SETNX(
  "packet:" + hash,
  bridgeNodeId,
  EX: 86400  // 24h TTL
)
if claimed:
  decryptAndSettle(ciphertext)
else:
  log("Duplicate dropped",
    bridgeNodeId)`} />
          </div>
        </div>
      </motion.section>

      {/* Architecture Evolution Table */}
      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
        <SectionHeader icon={<Server className="h-4 w-4" />} title="Demo vs. Production Architecture" number="10" />
        <div className="rounded-lg bg-[var(--bg-card)] shadow-[0_1px_3px_0_rgba(0,0,0,0.3)] overflow-hidden">
          <table className="w-full text-left text-xs text-[var(--text-secondary)] border-collapse">
            <thead>
              <tr className="bg-[var(--bg-card-alt)]">
                <th className="py-3 px-5 font-medium text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Component</th>
                <th className="py-3 px-5 font-medium text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Demo</th>
                <th className="py-3 px-5 font-medium text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Production</th>
              </tr>
            </thead>
            <motion.tbody
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                ['Database', 'H2 In-Memory', 'PostgreSQL / Oracle Cluster'],
                ['Cache', 'JVM ConcurrentHashMap', 'Distributed Redis (SETNX + EX)'],
                ['Key Management', 'Startup-generated RSA', 'HSM / AWS KMS'],
                ['Mesh Transport', 'Simulated in-memory', 'BLE GATT / Wi-Fi Direct'],
                ['Balances', 'Pre-loaded demo accounts', 'NPCI / Bank Core Banking OAuth'],
              ].map((row, i) => (
                <motion.tr
                  key={i}
                  variants={listItem}
                  className="border-t border-[var(--border)]/50 hover:bg-[var(--bg-subtle)]/50 transition-colors"
                  style={{ willChange: 'transform, opacity' }}
                >
                  <td className="py-3.5 px-5 font-medium text-[var(--text-primary)]">{row[0]}</td>
                  <td className="py-3.5 px-5 text-[var(--text-secondary)]">{row[1]}</td>
                  <td className="py-3.5 px-5 text-[var(--text-secondary)]">{row[2]}</td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default About;
