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

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

    .dc-root {
      font-family: 'DM Sans', system-ui, sans-serif;
      padding: 28px 32px;
      max-width: 1200px;
      margin: 0 auto;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.45s cubic-bezier(0.22,1,0.36,1),
                  transform 0.45s cubic-bezier(0.22,1,0.36,1);
    }
    .dc-root.mounted { opacity: 1; transform: translateY(0); }

    /* ── Header ──────────────────────────────────────────── */
    .dc-header {
      display: flex;
      flex-direction: column;
      margin-bottom: 20px;
    }
    .dc-title {
      font-family: 'Syne', sans-serif;
      font-size: 26px; font-weight: 700;
      color: #09090b; letter-spacing: -0.5px;
      line-height: 1.1; margin: 0 0 6px;
    }
    .dc-subtitle { font-size: 13px; color: #71717a; font-weight: 400; margin: 0; }

    .dc-notice {
      background: #fffcf0; border: 1px solid #fef3c7; border-radius: 10px;
      padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #92400e;
      display: flex; align-items: flex-start; gap: 10px; line-height: 1.5;
    }

    /* ── Toolbar ─────────────────────────────────────────── */
    .dc-toolbar {
      display: flex; gap: 10px; margin-bottom: 24px; align-items: center;
    }
    .dc-search-wrap {
      position: relative; flex: 1; max-width: 400px;
    }
    .dc-search-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      color: #a1a1aa; pointer-events: none; display: flex; align-items: center;
    }
    .dc-search {
      width: 100%; height: 38px; padding: 0 12px 0 36px;
      background: white; border: 1px solid #e4e4e7; border-radius: 9px;
      font-size: 13.5px; color: #09090b; outline: none;
      font-family: 'DM Sans', sans-serif;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      box-sizing: border-box;
    }
    .dc-search::placeholder { color: #a1a1aa; }
    .dc-search:focus { border-color: #09090b; box-shadow: 0 0 0 3px rgba(9,9,11,0.06); }

    /* ── Card ────────────────────────────────────────────── */
    .dc-card { background: white; border: 1px solid #e4e4e7; border-radius: 14px; overflow: hidden; }
    .dc-card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; border-bottom: 1px solid #f4f4f5; background: #fafafa;
    }
    .dc-card-title { font-size: 13px; font-weight: 600; color: #09090b; margin: 0; }
    .dc-card-count { font-size: 12px; color: #a1a1aa; }

    /* ── Table ───────────────────────────────────────────── */
    .dc-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .dc-table thead { background: #fafafa; }
    .dc-table th {
      padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600;
      color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.6px;
      border-bottom: 1px solid #f4f4f5; white-space: nowrap;
    }
    .dc-table td { padding: 12px 16px; border-bottom: 1px solid #f4f4f5; color: #09090b; vertical-align: middle; }
    .dc-table tr:last-child td { border-bottom: none; }
    .dc-table tbody tr { transition: background 0.1s ease; }
    .dc-table tbody tr:hover td { background: #fafafa; }

    .dc-mono { font-family: 'Courier New', monospace; font-size: 12px; color: #71717a; letter-spacing: 0.3px; }
    .dc-stamp { font-size: 11px; color: #a1a1aa; font-family: 'Courier New', monospace; }
    
    .dc-badge {
      display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px;
      border-radius: 6px; font-size: 11px; font-weight: 600;
      background: #fef2f2; color: #991b1b; border: 1px solid #fee2e2;
    }
    .dc-dot { width: 5px; height: 5px; border-radius: 50%; background: #ef4444; }

    .dc-recover-btn {
      height: 30px; padding: 0 14px; border-radius: 7px;
      border: 1px solid #e4e4e7; font-size: 12px; font-weight: 500;
      cursor: pointer; background: white; color: #09090b;
      transition: all 0.15s ease;
    }
    .dc-recover-btn:hover { background: #09090b; color: white; border-color: #09090b; }
    .dc-recover-btn:disabled { opacity: 0.5; cursor: not-allowed; background: #f4f4f5; color: #a1a1aa; }

    .dc-empty { text-align: center; padding: 64px 24px; color: #a1a1aa; font-size: 13.5px; }
    .dc-footer { padding: 12px 20px; border-top: 1px solid #f4f4f5; font-size: 12px; color: #a1a1aa; }
  `

  async function fetchDeleted() {
    setLoading(true)
    setError(null)
    try {
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
      <div className={`dc-root ${mounted ? 'mounted' : ''}`}>

        <div className="dc-header">
          <h1 className="dc-title">Deleted Customers</h1>
          <p className="dc-subtitle">Review and restore soft-deleted customer records</p>
        </div>

        <div className="dc-notice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
             <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>
            These records are soft-deleted and invisible to standard users. 
            Recovery restores full visibility and system-wide access.
          </span>
        </div>

        <div className="dc-toolbar">
          <div className="dc-search-wrap">
            <span className="dc-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              className="dc-search"
              type="text"
              placeholder="Search by name or customer no."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
            <div style={{ padding: '0 20px 20px' }}>
              <SkeletonTable rows={5} cols={6} />
            </div>
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
                          {recovering === c.custno ? 'Restoring...' : 'Recover'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="dc-footer">
                Showing {filtered.length} of {customers.length} inactive records
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}