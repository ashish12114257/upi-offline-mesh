import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './routes';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useTheme } from './context/ThemeContext';

function ThemedToaster() {
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const bg = isDark ? 'var(--bg-card)' : '#ffffff';
  const text = isDark ? 'var(--text-primary)' : '#0f172a';
  const border = isDark ? 'var(--border)' : '#e2e8f0';
  const inverse = isDark ? '#0f1117' : '#ffffff';
  const shadow = isDark
    ? '0 4px 24px rgba(0, 0, 0, 0.5)'
    : '0 4px 24px rgba(0, 0, 0, 0.06)';

  return (
    <Toaster
      position="top-right"
      gutter={10}
      toastOptions={{
        duration: 4000,
        style: {
          background: bg,
          color: text,
          border: `1px solid ${border}`,
          borderRadius: '10px',
          padding: '12px 16px',
          fontSize: '13px',
          fontFamily: 'Inter, system-ui, sans-serif',
          boxShadow: shadow,
        },
        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: inverse,
          },
          style: {
            borderLeft: '3px solid #22c55e',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: inverse,
          },
          style: {
            borderLeft: '3px solid #ef4444',
          },
        },
        loading: {
          iconTheme: {
            primary: '#6366f1',
            secondary: inverse,
          },
          style: {
            borderLeft: '3px solid #6366f1',
          },
        },
      }}
    />
  );
}

function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <ThemedToaster />
    </ErrorBoundary>
  );
}

export default App;
