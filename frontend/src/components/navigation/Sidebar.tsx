import React from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Network, Receipt, Send, Info, ChevronLeft, ChevronRight, Hexagon } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const NAV_LINKS = [
  { to: '/overview', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/overview/send-payment', label: 'Send Payment', icon: Send },
  { to: '/overview/mesh-simulator', label: 'Mesh Network', icon: Network },
  { to: '/overview/ledger', label: 'Transaction History', icon: Receipt },
  { to: '/overview/about', label: 'About Project', icon: Info },
] as const;

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[var(--bg-overlay)] lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        aria-label="Main navigation"
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)] transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          collapsed ? 'w-14' : 'w-52'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center border-b border-[var(--border)] px-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)] shrink-0">
              <Hexagon className="h-3.5 w-3.5 text-white" />
            </div>
            {!collapsed && <span className="text-sm font-medium text-[var(--text-primary)]">UPI Mesh</span>}
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center rounded-md text-sm font-medium transition-colors duration-150 ${
                    collapsed ? 'justify-center py-2' : 'gap-3 px-3 py-2'
                  } ${
                    isActive
                      ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{link.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div>
          {!collapsed && (
            <div className="px-3 py-3">
              <div className="rounded-lg bg-[var(--bg-subtle)] px-3 py-2.5">
                <span className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">System</span>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-[var(--success)] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                  Local Simulation
                </span>
                <p className="mt-1 text-[10px] leading-relaxed text-[var(--text-muted)]">
                  API at localhost:8080
                </p>
              </div>
            </div>
          )}

          <div className={`border-t border-[var(--border)] ${collapsed ? 'px-2 py-1.5' : 'px-3 py-1.5'}`}>
            <button
              onClick={onToggleCollapse}
              className={`flex items-center rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors duration-150 ${
                collapsed ? 'justify-center py-2 w-full' : 'gap-2 px-3 py-2 w-full'
              }`}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              {!collapsed && <span>Collapse</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
