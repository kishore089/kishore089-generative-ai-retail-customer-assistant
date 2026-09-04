import { Component } from "react";
import type { ComponentType, ErrorInfo, ReactNode } from "react";
import ErrorState from "./ErrorState";

export interface ErrorBoundaryProps {
  /** Optional custom fallback rendered with the caught error and a reset callback. */
  fallback?: ComponentType<{ error: Error; reset: () => void }>;
  /** Subtree that this boundary protects. */
  children: ReactNode;
}

export interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * React error boundary. Catches render-time errors in its subtree and renders
 * a fallback UI. When a `fallback` component is provided it receives the caught
 * `error` and a `reset` callback; otherwise the shared `ErrorState` is shown.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface the error for diagnostics; keep it lightweight for the client.
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    const { fallback: Fallback, children } = this.props;

    if (error) {
      if (Fallback) {
        return <Fallback error={error} reset={this.reset} />;
      }
      return <ErrorState message={error.message} onRetry={this.reset} />;
    }

    return children;
  }
}

export default ErrorBoundary;
