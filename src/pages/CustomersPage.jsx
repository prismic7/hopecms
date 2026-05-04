import { useState, useEffect } from 'react'
import { getCustomers } from '../services/customerService'
import { useAuth } from '../context/AuthContext'
import { useRights } from '../context/UserRightsContext'
import { useNavigate } from 'react-router-dom'
import AddCustomerModal from '../components/AddCustomerModal'
import EditCustomerModal from '../components/EditCustomerModal'
import SoftDeleteConfirmDialog from '../components/SoftDeleteConfirmDialog'
import { useToast } from '../components/Toast'
import { SkeletonTable } from '../components/Skeleton'

const PAYTERM_LABEL = { COD: 'Cash on Delivery', '30D': '30-day', '45D': '45-day' }
const PAYTERM_COLOR = {
  COD:  { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  '30D':{ bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
  '45D':{ bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff' },
}

export default function CustomersPage() {
  const { currentUser } = useAuth()
  const { rights } = useRights()
  const userType = currentUser?.user_type
  const navigate = useNavigate()

  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [paytermFilter, setPaytermFilter] = useState('')
  const [mounted, setMounted] = useState(false)

  const { showToast, ToastComponent } = useToast()

  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const showStamp = userType === 'ADMIN' || userType === 'SUPERADMIN'
  const canAdd  = rights.CUST_ADD  === 1
  const canEdit = rights.CUST_EDIT === 1
  const canDel  = rights.CUST_DEL  === 1

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  async function fetchCustomers() {
    setLoading(true)
    try {
      const data = await getCustomers(userType)
      setCustomers(data || [])
    } catch {
      showToast('Failed to load customers.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCustomers() }, [userType])

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = c.custname?.toLowerCase().includes(q) || c.custno?.toLowerCase().includes(q)
    const matchPayterm = paytermFilter ? c.payterm === paytermFilter : true
    return matchSearch && matchPayterm
  })

  const activeCount   = customers.filter(c => c.record_status === 'ACTIVE').length
  const inactiveCount = customers.filter(c => c.record_status === 'INACTIVE').length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

        .cp-root {
          font-family: 'DM Sans', system-ui, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.45s cubic-bezier(0.22,1,0.36,1),
                      transform 0.45s cubic-bezier(0.22,1,0.36,1);
        }
        .cp-root.mounted { opacity: 1; transform: translateY(0); }

        /* ── Header ──────────────────────────────────────────── */
        .cp-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .cp-title-block {}
        .cp-title {
          font-family: 'Syne', sans-serif;
          font-size: 26px; font-weight: 700;
          color: #09090b; letter-spacing: -0.5px;
          line-height: 1.1; margin: 0 0 6px;
        }
        .cp-subtitle { font-size: 13px; color: #71717a; font-weight: 400; }

        /* ── Stat pills ──────────────────────────────────────── */
        .cp-stats {
          display: flex; gap: 8px; flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .cp-stat {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px;
          background: white;
          border: 1px solid #e4e4e7;
          border-radius: 10px;
          font-size: 13px;
        }
        .cp-stat-dot {
          width: 7px; height: 7px;
          border-radius: 50%; flex-shrink: 0;
        }
        .cp-stat-val { font-weight: 600; color: #09090b; }
        .cp-stat-lbl { color: #71717a; }

        /* ── Toolbar ─────────────────────────────────────────── */
        .cp-toolbar {
          display: flex; gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
          align-items: center;
        }

        .cp-search-wrap {
          position: relative; flex: 1; min-width: 220px;
        }
        .cp-search-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%);
          color: #a1a1aa; pointer-events: none;
          display: flex; align-items: center;
        }
        .cp-search {
          width: 100%; height: 38px;
          padding: 0 12px 0 36px;
          background: white;
          border: 1px solid #e4e4e7;
          border-radius: 9px;
          font-size: 13.5px; color: #09090b;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .cp-search::placeholder { color: #a1a1aa; }
        .cp-search:focus {
          border-color: #09090b;
          box-shadow: 0 0 0 3px rgba(9,9,11,0.06);
        }

        .cp-filter-select {
          height: 38px; padding: 0 12px;
          background: white;
          border: 1px solid #e4e4e7;
          border-radius: 9px;
          font-size: 13.5px; color: #09090b;
          outline: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.15s ease;
        }
        .cp-filter-select:focus { border-color: #09090b; }

        /* Add button */
        .cp-add-btn {
          height: 38px; padding: 0 16px;
          background: #09090b; color: white;
          border: none; border-radius: 9px;
          font-size: 13.5px; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; white-space: nowrap;
          display: flex; align-items: center; gap: 7px;
          transition: opacity 0.15s ease, transform 0.1s ease;
          flex-shrink: 0;
        }
        .cp-add-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .cp-add-btn:active { transform: translateY(0); opacity: 1; }

        /* ── Table card ──────────────────────────────────────── */
        .cp-card {
          background: white;
          border: 1px solid #e4e4e7;
          border-radius: 14px;
          overflow: hidden;
        }

        .cp-card-header {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid #f4f4f5;
          background: #fafafa;
        }
        .cp-card-title {
          font-size: 13px; font-weight: 600; color: #09090b;
        }
        .cp-card-count {
          font-size: 12px; color: #a1a1aa;
        }

        /* Table */
        .cp-table {
          width: 100%; border-collapse: collapse;
          font-size: 13.5px;
        }
        .cp-table thead { background: #fafafa; }
        .cp-table th {
          padding: 10px 16px;
          text-align: left;
          font-size: 11px; font-weight: 600;
          color: #a1a1aa;
          text-transform: uppercase; letter-spacing: 0.6px;
          border-bottom: 1px solid #f4f4f5;
          white-space: nowrap;
        }
        .cp-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f4f4f5;
          color: #09090b; vertical-align: middle;
        }
        .cp-table tr:last-child td { border-bottom: none; }
        .cp-table tbody tr {
          transition: background 0.1s ease;
        }
        .cp-table tbody tr:hover td { background: #fafafa; }

        /* Cell types */
        .cp-custno {
          font-family: 'Courier New', monospace;
          font-size: 12px; color: #71717a;
          letter-spacing: 0.3px;
        }
        .cp-custname {
          font-weight: 500; color: #09090b;
          cursor: pointer;
          transition: color 0.15s ease;
          display: flex; align-items: center; gap: 6px;
        }
        .cp-custname:hover { color: #09090b; }
        .cp-custname-arrow {
          font-size: 11px; color: #a1a1aa;
          opacity: 0;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .cp-table tbody tr:hover .cp-custname-arrow {
          opacity: 1; transform: translateX(2px);
        }

        .cp-address {
          color: #71717a; font-size: 12.5px;
          max-width: 180px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* Payterm badge */
        .cp-payterm {
          display: inline-block;
          padding: 3px 9px;
          border-radius: 6px;
          font-size: 11px; font-weight: 600;
          border: 1px solid;
          white-space: nowrap;
        }

        /* Status badge */
        .cp-status {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 100px;
          font-size: 11px; font-weight: 600;
        }
        .cp-status-dot {
          width: 5px; height: 5px;
          border-radius: 50%; flex-shrink: 0;
        }
        .cp-status.active  { background: #dcfce7; color: #166534; }
        .cp-status.inactive{ background: #fee2e2; color: #991b1b; }

        /* Stamp */
        .cp-stamp {
          font-size: 11px; color: #a1a1aa;
          font-family: 'Courier New', monospace;
          max-width: 160px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* Action buttons */
        .cp-actions { display: flex; align-items: center; gap: 6px; }
        .cp-btn-edit {
          height: 28px; padding: 0 10px;
          background: none;
          border: 1px solid #e4e4e7;
          border-radius: 6px;
          font-size: 12px; font-weight: 500; color: #3f3f46;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .cp-btn-edit:hover {
          background: #09090b; border-color: #09090b; color: white;
        }
        .cp-btn-del {
          height: 28px; padding: 0 10px;
          background: none;
          border: 1px solid #fecaca;
          border-radius: 6px;
          font-size: 12px; font-weight: 500; color: #dc2626;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .cp-btn-del:hover {
          background: #dc2626; border-color: #dc2626; color: white;
        }

        /* Empty / loading states */
        .cp-empty {
          text-align: center;
          padding: 64px 24px;
          color: #a1a1aa; font-size: 13.5px;
        }
        .cp-empty-icon {
          font-size: 32px; margin-bottom: 12px;
          display: block; opacity: 0.4;
        }
        .cp-empty-title {
          font-weight: 500; color: #71717a;
          margin-bottom: 4px;
        }

        /* Footer */
        .cp-footer {
          padding: 10px 20px;
          border-top: 1px solid #f4f4f5;
          font-size: 12px; color: #a1a1aa;
          background: #fafafa;
          display: flex; align-items: center; justify-content: space-between;
        }

        /* Skeleton shimmer override for light pages */
        @keyframes cp-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .cp-skel {
          height: 13px; border-radius: 6px;
          background: linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%);
          background-size: 600px 100%;
          animation: cp-shimmer 1.4s infinite;
        }

        @media (max-width: 768px) {
          .cp-header { flex-direction: column; }
          .cp-table th:nth-child(3),
          .cp-table td:nth-child(3) { display: none; }
        }
        @media (max-width: 560px) {
          .cp-table th:nth-child(5),
          .cp-table td:nth-child(5) { display: none; }
        }
      `}</style>

      {ToastComponent}

      {/* Modals */}
      {showAdd && (
        <AddCustomerModal onClose={() => setShowAdd(false)} onSuccess={fetchCustomers} />
      )}
      {editTarget && (
        <EditCustomerModal customer={editTarget} onClose={() => setEditTarget(null)} onSuccess={fetchCustomers} />
      )}
      {deleteTarget && (
        <SoftDeleteConfirmDialog customer={deleteTarget} onClose={() => setDeleteTarget(null)} onSuccess={fetchCustomers} />
      )}

      <div className={`cp-root ${mounted ? 'mounted' : ''}`}>

        {/* Header */}
        <div className="cp-header">
          <div className="cp-title-block">
            <h1 className="cp-title">Customers</h1>
            <p className="cp-subtitle">
              Manage customer records, payment terms, and sales history
            </p>
          </div>
          {canAdd && (
            <button className="cp-add-btn" onClick={() => setShowAdd(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Customer
            </button>
          )}
        </div>

        {/* Stats */}
        {!loading && (
          <div className="cp-stats">
            <div className="cp-stat">
              <span className="cp-stat-dot" style={{ background: '#09090b' }} />
              <span className="cp-stat-val">{customers.length}</span>
              <span className="cp-stat-lbl">Total</span>
            </div>
            <div className="cp-stat">
              <span className="cp-stat-dot" style={{ background: '#16a34a' }} />
              <span className="cp-stat-val">{activeCount}</span>
              <span className="cp-stat-lbl">Active</span>
            </div>
            {inactiveCount > 0 && (
              <div className="cp-stat">
                <span className="cp-stat-dot" style={{ background: '#dc2626' }} />
                <span className="cp-stat-val">{inactiveCount}</span>
                <span className="cp-stat-lbl">Inactive</span>
              </div>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="cp-toolbar">
          <div className="cp-search-wrap">
            <span className="cp-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              className="cp-search"
              type="text"
              placeholder="Search by name or customer no."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="cp-filter-select"
            value={paytermFilter}
            onChange={e => setPaytermFilter(e.target.value)}
          >
            <option value="">All payment terms</option>
            <option value="COD">COD</option>
            <option value="30D">30D</option>
            <option value="45D">45D</option>
          </select>
        </div>

        {/* Table */}
        <div className="cp-card">
          <div className="cp-card-header">
            <span className="cp-card-title">Customer Records</span>
            {!loading && (
              <span className="cp-card-count">
                {filtered.length} of {customers.length} shown
              </span>
            )}
          </div>

          {loading ? (
            <table className="cp-table">
              <thead>
                <tr>
                  <th>Cust No.</th><th>Name</th><th>Address</th>
                  <th>Pay Term</th><th>Status</th>
                  {showStamp && <th>Stamp</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {[60, 140, 180, 70, 80, ...(showStamp ? [130] : []), 90].map((w, j) => (
                      <td key={j}>
                        <div className="cp-skel" style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : filtered.length === 0 ? (
            <div className="cp-empty">
              <span className="cp-empty-icon">🔍</span>
              <p className="cp-empty-title">No customers found</p>
              <p>Try adjusting your search or filter.</p>
            </div>
          ) : (
            <>
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>Cust No.</th>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Pay Term</th>
                    <th>Status</th>
                    {showStamp && <th>Stamp</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const pt = PAYTERM_COLOR[c.payterm] || {}
                    const isActive = c.record_status === 'ACTIVE'
                    return (
                      <tr key={c.custno} style={{ animationDelay: `${i * 0.02}s` }}>
                        <td>
                          <span className="cp-custno">{c.custno}</span>
                        </td>
                        <td>
                          <span
                            className="cp-custname"
                            onClick={() => navigate(`/customers/${c.custno}`)}
                          >
                            {c.custname}
                            <span className="cp-custname-arrow">→</span>
                          </span>
                        </td>
                        <td>
                          <span className="cp-address" title={c.address}>
                            {c.address || '—'}
                          </span>
                        </td>
                        <td>
                          <span
                            className="cp-payterm"
                            style={{
                              background: pt.bg,
                              color: pt.color,
                              borderColor: pt.border,
                            }}
                          >
                            {c.payterm}
                          </span>
                        </td>
                        <td>
                          <span className={`cp-status ${isActive ? 'active' : 'inactive'}`}>
                            <span
                              className="cp-status-dot"
                              style={{ background: isActive ? '#16a34a' : '#dc2626' }}
                            />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        {showStamp && (
                          <td>
                            <span className="cp-stamp" title={c.stamp || ''}>
                              {c.stamp || '—'}
                            </span>
                          </td>
                        )}
                        <td>
                          <div className="cp-actions">
                            {isActive ? (
                              <>
                                {canEdit && (
                                  <button className="cp-btn-edit" onClick={() => setEditTarget(c)}>
                                    Edit
                                  </button>
                                )}
                                {canDel && (
                                  <button className="cp-btn-del" onClick={() => setDeleteTarget(c)}>
                                    Delete
                                  </button>
                                )}
                                {!canEdit && !canDel && (
                                  <span style={{ fontSize: 12, color: '#a1a1aa' }}>—</span>
                                )}
                              </>
                            ) : (
                              <span style={{ fontSize: 12, color: '#a1a1aa' }}>—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div className="cp-footer">
                <span>
                  Showing <strong style={{ color: '#09090b' }}>{filtered.length}</strong> of{' '}
                  <strong style={{ color: '#09090b' }}>{customers.length}</strong> customers
                </span>
                {paytermFilter && (
                  <button
                    onClick={() => setPaytermFilter('')}
                    style={{
                      background: 'none', border: 'none',
                      fontSize: 12, color: '#09090b',
                      cursor: 'pointer', fontFamily: 'inherit',
                      textDecoration: 'underline',
                    }}
                  >
                    Clear filter
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}