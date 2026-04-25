import { useState } from 'react'
import { softDeleteCustomer } from '../services/customerService'
import { useAuth } from '../context/AuthContext'

export default function SoftDeleteConfirmDialog({ customer, onClose, onSuccess }) {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const css = `
    .dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
    .dialog-box { background: #fff; border-radius: 14px; border: 1px solid #e5e7eb; width: 100%; max-width: 420px; overflow: hidden; }
    .dialog-header { padding: 20px 24px 0; }
    .dialog-icon { width: 44px; height: 44px; border-radius: 50%; background: #fee2e2; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; font-size: 20px; }
    .dialog-title { font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 8px; }
    .dialog-body { padding: 0 24px 20px; }
    .dialog-desc { font-size: 13px; color: #6b7280; line-height: 1.6; margin: 0 0 12px; }
    .dialog-name { font-size: 13px; font-weight: 600; color: #111827; background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; display: flex; justify-content: space-between; }
    .dialog-name-mono { font-family: monospace; font-size: 12px; color: #9ca3af; }
    .dialog-warning { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #9a3412; line-height: 1.5; }
    .dialog-error { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #9f1239; margin-top: 12px; }
    .dialog-footer { padding: 16px 24px; border-top: 1px solid #f3f4f6; display: flex; justify-content: flex-end; gap: 10px; background: #f9fafb; }
    .btn-cancel { padding: 8px 18px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; color: #374151; font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-cancel:hover { background: #f9fafb; }
    .btn-delete { padding: 8px 18px; border-radius: 8px; border: none; background: #dc2626; color: #fff; font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-delete:hover { background: #b91c1c; }
    .btn-delete:disabled { opacity: 0.6; cursor: not-allowed; }
  `

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      await softDeleteCustomer(
        customer.custno,
        currentUser?.userid || currentUser?.id
      )
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to delete customer. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="dialog-box">
          <div className="dialog-header">
            <div className="dialog-icon">🗑</div>
            <h2 className="dialog-title">Delete Customer?</h2>
          </div>

          <div className="dialog-body">
            <p className="dialog-desc">
              You are about to soft-delete this customer. They will be hidden from regular users but can be recovered by an Admin.
            </p>

            <div className="dialog-name">
              <span>{customer.custname}</span>
              <span className="dialog-name-mono">{customer.custno}</span>
            </div>

            <div className="dialog-warning">
              This does not permanently delete any data. The customer's sales history remains intact and visible to Admins.
            </div>

            {error && <div className="dialog-error">{error}</div>}
          </div>

          <div className="dialog-footer">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button className="btn-delete" onClick={handleConfirm} disabled={loading}>
              {loading ? 'Deleting…' : 'Yes, delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}