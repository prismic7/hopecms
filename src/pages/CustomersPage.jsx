import { useState, useEffect } from 'react'
import { getCustomers } from '../services/customerService'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import AddCustomerModal from '../components/AddCustomerModal'
import EditCustomerModal from '../components/EditCustomerModal'
import SoftDeleteConfirmDialog from '../components/SoftDeleteConfirmDialog'

export default function CustomersPage() {
  const { currentUser } = useAuth()
  const userType = currentUser?.user_type

  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [paytermFilter, setPaytermFilter] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const showStamp = userType === 'ADMIN' || userType === 'SUPERADMIN'
  const navigate = useNavigate()

  async function fetchCustomers() {
    setLoading(true)
    setError(null)
    try {
      const data = await getCustomers(userType)
      setCustomers(data || [])
    } catch {
      setError('Failed to load customers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCustomers() }, [userType])

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.custname?.toLowerCase().includes(search.toLowerCase()) ||
      c.custno?.toLowerCase().includes(search.toLowerCase())
    const matchesPayterm = paytermFilter ? c.payterm === paytermFilter : true
    return matchesSearch && matchesPayterm
  })

  const css = `
    .cms-page { padding: 28px 32px; font-family: sans-serif; max-width: 1100px; margin: 0 auto; }
    .cms-topbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .cms-title { font-size: 22px; font-weight: 600; margin: 0 0 4px; color: #111827; }
    .cms-sub { font-size: 13px; color: #6b7280; margin: 0; }
    .cms-add-btn { background: #1d4ed8; color: #fff; border: none; border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; }
    .cms-add-btn:hover { background: #1e40af; }
    .cms-controls { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .cms-search-wrap { position: relative; flex: 1; min-width: 200px; }
    .cms-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #9ca3af; font-size: 15px; pointer-events: none; }
    .cms-search { width: 100%; box-sizing: border-box; padding: 8px 12px 8px 34px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #111827; outline: none; }
    .cms-search:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .cms-select { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #111827; background: #fff; outline: none; }
    .cms-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .cms-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .cms-table thead { background: #f9fafb; }
    .cms-table th { padding: 10px 14px; text-align: left; font-weight: 600; font-size: 11px; color: #6b7280; border-bottom: 1px solid #f3f4f6; white-space: nowrap; letter-spacing: 0.05em; text-transform: uppercase; }
    .cms-table td { padding: 11px 14px; border-bottom: 1px solid #f9fafb; color: #111827; vertical-align: middle; }
    .cms-table tr:last-child td { border-bottom: none; }
    .cms-table tr:hover td { background: #f9fafb; }
    .cms-custno { font-family: monospace; font-size: 12px; color: #6b7280; }
    .cms-custname { font-weight: 500; }
    .cms-address { color: #6b7280; font-size: 12px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .payterm-pill { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
    .badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
    .badge-active { background: #d1fae5; color: #065f46; }
    .badge-inactive { background: #fee2e2; color: #991b1b; }
    .badge-dot { width: 5px; height: 5px; border-radius: 50%; display: inline-block; }
    .stamp-cell { font-size: 11px; color: #9ca3af; font-family: monospace; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .btn-edit { padding: 4px 10px; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 12px; cursor: pointer; background: #fff; color: #374151; margin-right: 6px; }
    .btn-edit:hover { background: #f9fafb; }
    .btn-del { padding: 4px 10px; border-radius: 6px; border: 1px solid #fecaca; font-size: 12px; cursor: pointer; background: #fff; color: #dc2626; }
    .btn-del:hover { background: #fef2f2; }
    .cms-footer { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; }
    .cms-empty { text-align: center; padding: 56px 24px; color: #9ca3af; font-size: 14px; }
    .cms-error { text-align: center; padding: 56px 24px; color: #dc2626; font-size: 14px; }
  `

  if (loading) return <><style>{css}</style><div className="cms-empty">Loading customers…</div></>
  if (error) return <><style>{css}</style><div className="cms-error">{error}</div></>

  return (
    <>
      <style>{css}</style>

      {/* Modals */}
      {showAdd && (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onSuccess={fetchCustomers}
        />
      )}
      {editTarget && (
        <EditCustomerModal
          customer={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={fetchCustomers}
        />
      )}
      {deleteTarget && (
        <SoftDeleteConfirmDialog
          customer={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={fetchCustomers}
        />
      )}

      <div className="cms-page">
        {/* Header */}
        <div className="cms-topbar">
          <div>
            <h1 className="cms-title">Customers</h1>
            <p className="cms-sub">{customers.length} total records</p>
          </div>
          {/* Add button — rights gating wired by M4 */}
          <button className="cms-add-btn" onClick={() => setShowAdd(true)}>
            + Add customer
          </button>
        </div>

        {/* Search & Filter */}
        <div className="cms-controls">
          <div className="cms-search-wrap">
            <span className="cms-search-icon">⌕</span>
            <input
              className="cms-search"
              type="text"
              placeholder="Search by name or customer no."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="cms-select"
            value={paytermFilter}
            onChange={(e) => setPaytermFilter(e.target.value)}
          >
            <option value="">All payment terms</option>
            <option value="COD">COD</option>
            <option value="30D">30D</option>
            <option value="45D">45D</option>
          </select>
        </div>

        {/* Table */}
        <div className="cms-card">
          {filtered.length === 0 ? (
            <div className="cms-empty">No customers found.</div>
          ) : (
            <>
              <table className="cms-table">
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
                  {filtered.map((c) => (
                    <tr key={c.custno}>
                      <td className="cms-custno">{c.custno}</td>
                      <td
                        className="cms-custname"
                        style={{ cursor: 'pointer', color: '#1d4ed8' }}
                        onClick={() => navigate(`/customers/${c.custno}`)}
                      >
                        {c.custname}
                      </td>
                      <td className="cms-address" title={c.address}>{c.address}</td>
                      <td><span className="payterm-pill">{c.payterm}</span></td>
                      <td>
                        <span className={`badge ${c.record_status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
                          <span className="badge-dot" style={{ background: c.record_status === 'ACTIVE' ? '#059669' : '#dc2626' }} />
                          {c.record_status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {showStamp && (
                        <td className="stamp-cell" title={c.stamp || ''}>{c.stamp || '—'}</td>
                      )}
                      <td>
                        {/* Rights gating wired by M4 */}
                        <button className="btn-edit" onClick={() => setEditTarget(c)}>Edit</button>
                        {userType === 'SUPERADMIN' && (
                          <button className="btn-del" onClick={() => setDeleteTarget(c)}>Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="cms-footer">
                <span>Showing {filtered.length} of {customers.length} customers</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}