import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getUsers, activateUser, deactivateUser } from '../services/adminService'
import { useToast } from '../components/Toast'
import { SkeletonTable } from '../components/Skeleton'

export default function AdminPage() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [search, setSearch] = useState('')
  const { showToast, ToastComponent } = useToast()

  const css = `
    .ap-page { padding: 28px 32px; max-width: 1100px; margin: 0 auto; font-family: sans-serif; }
    .ap-topbar { margin-bottom: 24px; }
    .ap-title { font-size: 22px; font-weight: 600; margin: 0 0 4px; color: #111827; }
    .ap-sub { font-size: 13px; color: #6b7280; margin: 0; }
    .ap-notice { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; font-size: 13px; color: #1e40af; }
    .ap-controls { margin-bottom: 20px; }
    .ap-search { width: 100%; box-sizing: border-box; padding: 9px 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #111827; outline: none; }
    .ap-search:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .ap-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .ap-card-header { padding: 14px 18px; border-bottom: 1px solid #f3f4f6; background: #f9fafb; display: flex; justify-content: space-between; align-items: center; }
    .ap-card-title { font-size: 13px; font-weight: 600; color: #374151; margin: 0; }
    .ap-card-count { font-size: 12px; color: #9ca3af; }
    .ap-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .ap-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #f3f4f6; text-transform: uppercase; letter-spacing: 0.05em; background: #f9fafb; white-space: nowrap; }
    .ap-table td { padding: 11px 14px; border-bottom: 1px solid #f9fafb; color: #111827; vertical-align: middle; }
    .ap-table tr:last-child td { border-bottom: none; }
    .ap-table tbody tr:hover td { background: #f9fafb; }
    .ap-table tr.disabled-row td { opacity: 0.5; }
    .ap-mono { font-family: monospace; font-size: 12px; color: #6b7280; }
    .ap-badge-active { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #d1fae5; color: #065f46; }
    .ap-badge-inactive { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #fee2e2; color: #991b1b; }
    .ap-badge-dot { width: 5px; height: 5px; border-radius: 50%; display: inline-block; }
    .ap-type-pill { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .ap-type-super { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .ap-type-admin { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
    .ap-type-user { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
    .ap-btn-activate { padding: 5px 12px; border-radius: 6px; border: 1px solid #bbf7d0; font-size: 12px; font-weight: 500; cursor: pointer; background: #f0fdf4; color: #166534; margin-right: 6px; }
    .ap-btn-activate:hover { background: #dcfce7; }
    .ap-btn-deactivate { padding: 5px 12px; border-radius: 6px; border: 1px solid #fecaca; font-size: 12px; font-weight: 500; cursor: pointer; background: #fff; color: #dc2626; }
    .ap-btn-deactivate:hover { background: #fef2f2; }
    .ap-btn-disabled { padding: 5px 12px; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 12px; font-weight: 500; cursor: not-allowed; background: #f9fafb; color: #9ca3af; }
    .ap-empty { text-align: center; padding: 56px 24px; color: #9ca3af; font-size: 13px; }
    .ap-footer { padding: 10px 14px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; }
  `

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const data = await getUsers()
      setUsers(data || [])
    } catch {
      showToast('Failed to load users.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  async function handleActivate(userId) {
    setActionLoading(userId)
    try {
      await activateUser(userId)
      await fetchUsers()
    } catch (err) {
      showToast(err.message || 'Failed to activate user.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDeactivate(userId) {
    setActionLoading(userId)
    try {
      await deactivateUser(userId)
      await fetchUsers()
    } catch (err) {
      showToast(err.message || 'Failed to deactivate user.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.userid?.toLowerCase().includes(search.toLowerCase())
  )

  function TypePill({ type }) {
    const cls = type === 'SUPERADMIN' ? 'ap-type-super' : type === 'ADMIN' ? 'ap-type-admin' : 'ap-type-user'
    return <span className={`ap-type-pill ${cls}`}>{type}</span>
  }

  return (
    <>
      {ToastComponent}
      <style>{css}</style>
      <div className="ap-page">

        <div className="ap-topbar">
          <h1 className="ap-title">User Management</h1>
          <p className="ap-sub">Activate or deactivate CMS user accounts</p>
        </div>

        <div className="ap-notice">
          SUPERADMIN accounts cannot be modified. Activate a new user after they
          register to grant them access.
        </div>

        <div className="ap-controls">
          <input
            className="ap-search"
            type="text"
            placeholder="Search by username or user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ap-card">
          <div className="ap-card-header">
            <span className="ap-card-title">All Users</span>
            {!loading && (
              <span className="ap-card-count">
                {filtered.length} user{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <table className="ap-table">
              <tbody>
                <SkeletonTable rows={5} cols={5} />
              </tbody>
            </table>
          ) : error ? (
            <div className="ap-empty" style={{ color: '#dc2626' }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div className="ap-empty">No users found.</div>
          ) : (
            <>
              <table className="ap-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const isSuperAdmin = u.user_type === 'SUPERADMIN'
                    const isActive = u.record_status === 'ACTIVE'
                    const isCurrentUser = u.userid === currentUser?.userid
                    const isDisabled = isSuperAdmin || isCurrentUser

                    return (
                      <tr key={u.userid} className={isDisabled ? 'disabled-row' : ''}>
                        <td className="ap-mono">{u.userid}</td>
                        <td style={{ fontWeight: 500 }}>{u.username || '-'}</td>
                        <td><TypePill type={u.user_type} /></td>
                        <td>
                          <span className={isActive ? 'ap-badge-active' : 'ap-badge-inactive'}>
                            <span
                              className="ap-badge-dot"
                              style={{ background: isActive ? '#059669' : '#dc2626' }}
                            />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {isDisabled ? (
                            <span
                              className="ap-btn-disabled"
                              title="SUPERADMIN accounts cannot be modified"
                            >
                              Protected
                            </span>
                          ) : (
                            <>
                              {!isActive && (
                                <button
                                  className="ap-btn-activate"
                                  disabled={actionLoading === u.userid}
                                  onClick={() => handleActivate(u.userid)}
                                >
                                  {actionLoading === u.userid ? '...' : 'Activate'}
                                </button>
                              )}
                              {isActive && (
                                <button
                                  className="ap-btn-deactivate"
                                  disabled={actionLoading === u.userid}
                                  onClick={() => handleDeactivate(u.userid)}
                                >
                                  {actionLoading === u.userid ? '...' : 'Deactivate'}
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="ap-footer">
                Showing {filtered.length} of {users.length} users
              </div>
            </>
          )}
        </div>

      </div>
    </>
  )
}