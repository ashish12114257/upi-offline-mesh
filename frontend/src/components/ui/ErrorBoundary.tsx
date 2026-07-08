import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 shadow-[var(--shadow-md)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--danger-subtle)] text-[var(--danger)] border border-[var(--danger)]/30">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-sm font-semibold tracking-tight text-[var(--text-primary)]">Something went wrong</h3>
            <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={this.handleRetry}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-[var(--danger)] px-4 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity duration-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
