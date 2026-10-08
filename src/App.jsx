import { Component } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import MarketDashboard from './pages/MarketDashboard';

class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Dashboard crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container">
          <div className="banner banner-error" role="alert">
            Something went wrong rendering the dashboard.
            <button type="button" className="btn btn-sm" onClick={() => this.setState({ error: null })}>
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <MarketDashboard />
      </ErrorBoundary>
    </ThemeProvider>
  );
}