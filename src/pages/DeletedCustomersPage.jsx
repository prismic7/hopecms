import { useState, useEffect } from 'react'
import { getCustomers, recoverCustomer } from '../services/customerService'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { SkeletonTable } from '../components/Skeleton'

export default function DeletedCustomersPage() {
  const { currentUser } = useAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [recovering, setRecovering] = useState(null)
  const [search, setSearch] = useState('')
  const { showToast, ToastComponent } = useToast()

  const css = `
    .dc-page { padding: 28px 32px; max-width: 1100px; margin: 0 auto; font-family: sans-serif; }
    .dc-topbar { margin-bottom: 24px; }
    .dc-title { font-size: 22px; font-weight: 600; margin: 0 0 4px; color: #111827; }
    .dc-sub { font-size: 13px; color: #6b7280; margin: 0; }
    .dc-warning { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; font-size: 13px; color: #9a3412; }
    .dc-controls { margin-bottom: 20px; }
    .dc-search { width: 100%; box-sizing: border-box; padding: 9px 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #111827; outline: none; }
    .dc-search:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .dc-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .dc-card-header { padding: 14px 18px; border-bottom: 1px solid #f3f4f6; background: #f9fafb; display: flex; justify-content: space-between; align-items: center; }
    .dc-card-title { font-size: 13px; font-weight: 600; color: #374151; margin: 0; }
    .dc-card-count { font-size: 12px; color: #9ca3af; }
    .dc-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .dc-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #f3f4f6; text-transform: uppercase; letter-spacing: 0.05em; background: #f9fafb; white-space: nowrap; }
    .dc-table td { padding: 11px 14px; border-bottom: 1px solid #f9fafb; color: #111827; vertical-align: middle; }
    .dc-table tr:last-child td { border-bottom: none; }
    .dc-table tbody tr:hover td { background: #fef9f0; }
    .dc-mono { font-family: monospace; font-size: 12px; color: #6b7280; }
    .dc-stamp { font-size: 11px; color: #9ca3af; font-family: monospace; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dc-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #fee2e2; color: #991b1b; }
    .dc-dot { width: 5px; height: 5px; border-radius: 50%; background: #dc2626; display: inline-block; }
    .dc-recover-btn { padding: 5px 12px; border-radius: 6px; border: 1px solid #bbf7d0; font-size: 12px; font-weight: 500; cursor: pointer; background: #f0fdf4; color: #166534; }
    .dc-recover-btn:hover { background: #dcfce7; }
    .dc-recover-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .dc-empty { text-align: center; padding: 56px 24px; color: #9ca3af; font-size: 13px; }
    .dc-footer { padding: 10px 14px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; }
  `

  async function fetchDeleted() {
    setLoading(true)
    setError(null)
    try {
      // Pass SUPERADMIN so we get all rows including INACTIVE
      const all = await getCustomers('SUPERADMIN')
      setCustomers((all || []).filter((c) => c.record_status === 'INACTIVE'))
    } catch {
      setError('Failed to load deleted customers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDeleted() }, [])

  async function handleRecover(custno) {
    setRecovering(custno)
    try {
      await recoverCustomer(custno, currentUser?.userid || currentUser?.id)
      await fetchDeleted()
    } catch {
      showToast('Failed to recover customer. Please try again.', 'error')
    } finally {
      setRecovering(null)
    }
  }

  const filtered = customers.filter((c) =>
    c.custname?.toLowerCase().includes(search.toLowerCase()) ||
    c.custno?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {ToastComponent}
      <style>{css}</style>
      <div className="dc-page">

        <div className="dc-topbar">
          <h1 className="dc-title">Deleted Customers</h1>
          <p className="dc-sub">Soft-deleted records — recoverable by Admin and Superadmin only</p>
        </div>

        <div className="dc-warning">
          These customers have been soft-deleted and are invisible to USER accounts
          everywhere in the system — including direct API calls blocked by RLS.
          Recovery restores full visibility.
        </div>

        <div className="dc-controls">
          <input
            className="dc-search"
            type="text"
            placeholder="Search by name or customer no."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="dc-card">
          <div className="dc-card-header">
            <span className="dc-card-title">Inactive Records</span>
            {!loading && (
              <span className="dc-card-count">
                {filtered.length} record{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <table className="dc-table">
              <tbody>
                <SkeletonTable rows={5} cols={6} />
              </tbody>
            </table>
          ) : error ? (
            <div className="dc-empty" style={{ color: '#dc2626' }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div className="dc-empty">No deleted customers found.</div>
          ) : (
            <>
              <table className="dc-table">
                <thead>
                  <tr>
                    <th>Cust No.</th>
                    <th>Name</th>
                    <th>Pay Term</th>
                    <th>Status</th>
                    <th>Stamp</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.custno}>
                      <td className="dc-mono">{c.custno}</td>
                      <td style={{ fontWeight: 500 }}>{c.custname}</td>
                      <td>{c.payterm}</td>
                      <td>
                        <span className="dc-badge">
                          <span className="dc-dot" />
                          Inactive
                        </span>
                      </td>
                      <td className="dc-stamp" title={c.stamp || ''}>{c.stamp || '—'}</td>
                      <td>
                        <button
                          className="dc-recover-btn"
                          disabled={recovering === c.custno}
                          onClick={() => handleRecover(c.custno)}
                        >
                          {recovering === c.custno ? 'Recovering...' : 'Recover'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="dc-footer">
                Showing {filtered.length} of {customers.length} inactive customers
              </div>
            </>
          )}
        </div>

      </div>
    </>
  )
}