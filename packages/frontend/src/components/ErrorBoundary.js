import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-5 rounded-md border border-danger bg-danger-subtle p-5">
          <h2 className="mb-3 text-xl font-bold text-danger-text">Something went wrong!</h2>
          <pre className="mb-4 whitespace-pre-wrap text-sm text-danger-text">
            {this.state.error && this.state.error.toString()}
          </pre>
          <button className="btn-danger" onClick={() => window.location.reload()} type="button">
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
