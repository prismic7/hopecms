import { useState, useEffect } from 'react'

export function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const colors = {
    error: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', icon: '✕' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534', icon: '✓' },
    info: { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', icon: 'ℹ' },
  }

  const c = colors[type] || colors.error

  const css = `
    .toast-wrap {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 10px;
      border: 1px solid ${c.border};
      background: ${c.bg};
      color: ${c.color};
      font-size: 13px;
      font-weight: 500;
      font-family: sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      max-width: 320px;
      animation: toast-in 0.2s ease;
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .toast-icon {
      font-size: 14px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .toast-msg { flex: 1; }
    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      color: ${c.color};
      opacity: 0.6;
      padding: 0;
      line-height: 1;
      flex-shrink: 0;
    }
    .toast-close:hover { opacity: 1; }
  `

  return (
    <>
      <style>{css}</style>
      <div className="toast-wrap" role="alert">
        <span className="toast-icon">{c.icon}</span>
        <span className="toast-msg">{message}</span>
        <button className="toast-close" onClick={onClose}>✕</button>
      </div>
    </>
  )
}

export function useToast() {
  const [toast, setToast] = useState(null)

  function showToast(message, type = 'error') {
    setToast({ message, type })
  }

  function hideToast() {
    setToast(null)
  }

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={hideToast} />
  ) : null

  return { showToast, ToastComponent }
}