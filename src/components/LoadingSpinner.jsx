// src/components/LoadingSpinner.jsx
// Inline page-level loading state — matches the dark glass design system.
// Used on data-fetching pages (CustomerListPage, ProductsPage, etc.)

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400&display=swap');

        .lsp-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 240px;
          gap: 16px;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        /* Spinner ring */
        .lsp-spinner {
          position: relative;
          width: 36px;
          height: 36px;
          flex-shrink: 0;
        }
        .lsp-track {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid rgba(0,0,0,0.06);
        }
        .lsp-arc {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #111;
          border-right-color: rgba(0,0,0,0.15);
          animation: lsp-spin 0.85s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes lsp-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .lsp-label {
          font-size: 13px;
          font-weight: 400;
          color: #9ca3af;
          letter-spacing: 0.2px;
        }

        /* Respect dark mode if the app ever uses it globally */
        @media (prefers-color-scheme: dark) {
          .lsp-track  { border-color: rgba(255,255,255,0.08); }
          .lsp-arc    { border-top-color: rgba(255,255,255,0.7); border-right-color: rgba(255,255,255,0.15); }
          .lsp-label  { color: rgba(255,255,255,0.3); }
        }
      `}</style>

      <div className="lsp-wrap">
        <div className="lsp-spinner">
          <div className="lsp-track" />
          <div className="lsp-arc" />
        </div>
        <p className="lsp-label">{message}</p>
      </div>
    </>
  )
}