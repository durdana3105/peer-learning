import React from "react";
import * as Sentry from "@sentry/react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// wraps the app so a crash in any child doesn't take down the whole UI
class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
    Sentry.captureException(error, {
      extra: {
        componentStack: info.componentStack,
      },
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;

    if (!hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Oops, something broke
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Sorry about that. You can try again or head back to the home page.
        </p>
        <div className="flex gap-3">
          <button
            onClick={this.resetError}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
         </button>
          
            <a href="/"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Go home
          </a>
        </div>

        {import.meta.env.DEV && error && (
          <pre className="mt-4 max-w-xl overflow-auto rounded-md bg-muted p-4 text-left text-xs text-muted-foreground">
            {error.message}
          </pre>
        )}
      </div>
    );
  }
}

export default ErrorBoundary;