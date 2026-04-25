// Reusable inline loading spinner for data-fetching pages
export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      gap: '12px',
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes spinner-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: '3px solid #e2e8f0',
        borderTopColor: '#2563eb',
        animation: 'spinner-spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
        {message}
      </p>
    </div>
  )
}