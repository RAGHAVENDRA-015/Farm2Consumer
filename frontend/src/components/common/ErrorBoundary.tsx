import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-100 shadow-card text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-2xl mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-darkText">Something went wrong</h2>
              <p className="text-xs text-grayText leading-relaxed">
                An unexpected error occurred while rendering this page.
              </p>
              {this.state.error?.message && (
                <div className="p-3 bg-red-50/70 rounded-xl text-left font-mono text-[11px] text-red-800 break-words">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-700 transition-all shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </button>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
