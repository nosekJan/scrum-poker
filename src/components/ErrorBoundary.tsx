import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: "",
  };

  public static getDerivedStateFromError(error: Error): State {
    // Aktualizujeme stav, aby ďalší render ukázal fallback UI.
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Tu by sa v produkcii logovali chyby napr. do Sentry
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-4">
          <div className="max-w-md w-full bg-neutral-900 border border-red-500/30 rounded-xl p-8 text-center shadow-lg">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">
              Oops, something went wrong
            </h2>
            <p className="text-neutral-400 mb-6 text-sm">
              {this.state.errorMessage}
            </p>
            <button
              className="px-6 py-2 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 rounded-lg transition-colors font-medium text-sm text-white"
              onClick={() => (window.location.href = "/")}
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
