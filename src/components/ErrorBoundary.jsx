import { Component } from 'react'

// Catches any render errors in child components and shows a fallback UI
// instead of crashing the whole app.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          gap: '12px',
          padding: '32px',
          color: '#64748b',
          fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        }}>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#ef4444' }}>
            Something went wrong.
          </p>
          <p style={{ fontSize: '14px', margin: 0 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: '8px',
              padding: '8px 20px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}