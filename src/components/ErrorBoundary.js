/**
 * Error Boundary Component
 * Catches React render errors and displays them instead of crashing the page
 */
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      return (
        <div style={{
          padding: 40,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#1e1e1e',
          color: '#f0f0f0',
          minHeight: '100vh',
        }}>
          <h1 style={{ color: '#f44336', marginBottom: 20 }}>Something went wrong</h1>
          <p style={{ color: '#ffcc00', marginBottom: 20 }}>
            The page encountered an error. Please check the console for details.
          </p>
          {error && (
            <div style={{
              background: '#2d2d2d',
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
              fontFamily: 'monospace',
              fontSize: 14,
              overflow: 'auto',
            }}>
              <strong style={{ color: '#f44336' }}>Error:</strong><br />
              {error.toString()}
            </div>
          )}
          {errorInfo && errorInfo.componentStack && (
            <div style={{
              background: '#2d2d2d',
              padding: 16,
              borderRadius: 8,
              fontFamily: 'monospace',
              fontSize: 12,
              overflow: 'auto',
              maxHeight: 300,
              whiteSpace: 'pre-wrap',
            }}>
              <strong style={{ color: '#2196F3' }}>Component Stack:</strong>
              {errorInfo.componentStack}
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              padding: '10px 20px',
              background: '#0077B6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
