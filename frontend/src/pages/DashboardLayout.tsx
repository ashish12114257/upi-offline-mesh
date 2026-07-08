import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from '../components/navigation/Sidebar';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { pageTransition, smoothTransition } from '../utils/motionConfig';

const COLLAPSED_KEY = 'sidebar-collapsed';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  });
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleCollapse = () => setSidebarCollapsed(prev => !prev);

  return (
    <motion.div
      className="flex h-screen w-screen overflow-hidden bg-[var(--bg-page)] text-[var(--text-primary)]"
      initial={false}
      layout
    >
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} collapsed={sidebarCollapsed} onToggleCollapse={toggleCollapse} />

      <motion.div
        className="flex flex-col flex-1 min-w-0 overflow-hidden"
        layout
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <Navbar onToggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 lg:py-8 focus:outline-none">
          <div className="mx-auto max-w-[1400px] h-full flex flex-col justify-between">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  variants={pageTransition}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={smoothTransition}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>

            <motion.div
              className="mt-8 lg:mt-10 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Footer />
            </motion.div>
          </div>
        </main>
      </motion.div>
    </motion.div>
  );
};
