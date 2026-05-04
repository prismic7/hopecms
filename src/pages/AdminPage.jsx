import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getUsers, activateUser, deactivateUser, changeUserRole } from '../services/adminService'
import { useToast } from '../components/Toast'
import { SkeletonTable } from '../components/Skeleton'

export default function AdminPage() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [roleLoading, setRoleLoading] = useState(null)
  const [search, setSearch] = useState('')
  const { showToast, ToastComponent } = useToast()

  const [mounted, setMounted] = useState(false)

  // Confirm modal state[cite: 7]
  const [pendingRoleChange, setPendingRoleChange] = useState(null)
  // { userId, username, currentRole, newRole }

  const isSuperAdmin = currentUser?.user_type === 'SUPERADMIN'

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

    .ap-root {
      font-family: 'DM Sans', system-ui, sans-serif;
      padding: 28px 32px;
      max-width: 1200px;
      margin: 0 auto;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.45s cubic-bezier(0.22,1,0.36,1),
                  transform 0.45s cubic-bezier(0.22,1,0.36,1);
    }
    .ap-root.mounted { opacity: 1; transform: translateY(0); }

    /* ── Header ──────────────────────────────────────────── */
    .ap-header {
      display: flex;
      flex-direction: column;
      margin-bottom: 20px;
    }
    .ap-title {
      font-family: 'Syne', sans-serif;
      font-size: 26px; font-weight: 700;
      color: #09090b; letter-spacing: -0.5px;
      line-height: 1.1; margin: 0 0 6px;
    }
    .ap-subtitle { font-size: 13px; color: #71717a; font-weight: 400; margin: 0; }

    .ap-notice {
      background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px;
      padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #71717a;
      display: flex; align-items: flex-start; gap: 10px; line-height: 1.5;
    }

    /* ── Toolbar ─────────────────────────────────────────── */
    .ap-toolbar {
      display: flex; gap: 10px; margin-bottom: 24px; align-items: center;
    }
    .ap-search-wrap {
      position: relative; flex: 1; max-width: 400px;
    }
    .ap-search-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      color: #a1a1aa; pointer-events: none; display: flex; align-items: center;
    }
    .ap-search {
      width: 100%; height: 38px; padding: 0 12px 0 36px;
      background: white; border: 1px solid #e4e4e7; border-radius: 9px;
      font-size: 13.5px; color: #09090b; outline: none;
      font-family: 'DM Sans', sans-serif;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      box-sizing: border-box;
    }
    .ap-search::placeholder { color: #a1a1aa; }
    .ap-search:focus { border-color: #09090b; box-shadow: 0 0 0 3px rgba(9,9,11,0.06); }

    /* ── Card ────────────────────────────────────────────── */
    .ap-card { background: white; border: 1px solid #e4e4e7; border-radius: 14px; overflow: hidden; }
    .ap-card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; border-bottom: 1px solid #f4f4f5; background: #fafafa;
    }
    .ap-card-title { font-size: 13px; font-weight: 600; color: #09090b; margin: 0; }
    .ap-card-count { font-size: 12px; color: #a1a1aa; }

    /* ── Table ───────────────────────────────────────────── */
    .ap-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .ap-table thead { background: #fafafa; }
    .ap-table th {
      padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600;
      color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.6px;
      border-bottom: 1px solid #f4f4f5; white-space: nowrap;
    }
    .ap-table td { padding: 12px 16px; border-bottom: 1px solid #f4f4f5; color: #09090b; vertical-align: middle; }
    .ap-table tr:last-child td { border-bottom: none; }
    .ap-table tbody tr { transition: background 0.1s ease; }
    .ap-table tbody tr:hover td { background: #fafafa; }
    .ap-table tr.disabled-row td { opacity: 0.45; }

    .ap-mono { font-family: 'Courier New', monospace; font-size: 12px; color: #71717a; letter-spacing: 0.3px; }
    
    .ap-badge-active, .ap-badge-inactive {
      display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px;
      border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid transparent;
    }
    .ap-badge-active { background: #f0fdf4; color: #166534; border-color: #dcfce7; }
    .ap-badge-inactive { background: #fef2f2; color: #991b1b; border-color: #fee2e2; }
    .ap-badge-dot { width: 5px; height: 5px; border-radius: 50%; }

    .ap-type-pill { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid #e4e4e7; }
    .ap-type-super { background: #18181b; color: #ffffff; border-color: #18181b; }
    .ap-type-admin { background: #f4f4f5; color: #18181b; }
    .ap-type-user { background: white; color: #71717a; }

    /* ── Buttons ─────────────────────────────────────────── */
    .ap-btn {
      height: 30px; padding: 0 14px; border-radius: 7px;
      border: 1px solid #e4e4e7; font-size: 12px; font-weight: 500;
      cursor: pointer; transition: all 0.15s ease; font-family: inherit;
    }
    .ap-btn-activate { background: #09090b; color: white; border-color: #09090b; margin-right: 8px; }
    .ap-btn-activate:hover { opacity: 0.85; }
    .ap-btn-deactivate { background: white; color: #ef4444; border-color: #fee2e2; }
    .ap-btn-deactivate:hover { background: #fef2f2; }
    .ap-btn-disabled { background: #f4f4f5; color: #a1a1aa; border-color: #e4e4e7; cursor: not-allowed; }

    /* Role dropdown */
    .ap-role-wrap { display: flex; align-items: center; gap: 8px; }
    .ap-role-select {
      height: 28px; padding: 0 6px; border-radius: 6px; font-size: 11px; font-weight: 600;
      border: 1px solid #e4e4e7; cursor: pointer; outline: none;
      background: white; color: #09090b; font-family: inherit;
      transition: border-color 0.15s;
    }
    .ap-role-select:focus { border-color: #09090b; }
    .ap-role-saving { font-size: 11px; color: #a1a1aa; }

    /* ── Modal ───────────────────────────────────────────── */
    .ap-modal-overlay {
      position: fixed; inset: 0; background: rgba(255,255,255,0.8);
      backdrop-filter: blur(4px); z-index: 200; display: flex;
      align-items: center; justify-content: center; padding: 20px;
    }
    .ap-modal {
      background: white; border-radius: 16px; padding: 32px;
      width: 100%; max-width: 400px; border: 1px solid #e4e4e7;
      box-shadow: 0 20px 40px rgba(0,0,0,0.08);
    }
    .ap-modal-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; margin: 0 0 12px; color: #09090b; }
    .ap-modal-body { font-size: 13.5px; color: #71717a; line-height: 1.6; margin: 0 0 24px; }
    .ap-modal-body strong { color: #09090b; font-weight: 600; }
    .ap-modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
    .ap-modal-btn {
      height: 38px; padding: 0 18px; border-radius: 9px; font-size: 13px;
      font-weight: 500; cursor: pointer; transition: all 0.15s ease;
      font-family: 'DM Sans', sans-serif;
    }
    .ap-modal-cancel { background: white; border: 1px solid #e4e4e7; color: #71717a; }
    .ap-modal-cancel:hover { background: #f4f4f5; }
    .ap-modal-confirm { background: #09090b; border: none; color: white; }
    .ap-modal-confirm:hover { opacity: 0.85; }

    .ap-empty { text-align: center; padding: 64px 24px; color: #a1a1aa; font-size: 13.5px; }
    .ap-footer { padding: 12px 20px; border-top: 1px solid #f4f4f5; font-size: 12px; color: #a1a1aa; }

    @media (max-width: 768px) {
      .ap-table th:nth-child(1), .ap-table td:nth-child(1) { display: none; }
    }
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

  function handleRoleDropdownChange(user, newRole) {
    if (newRole === user.user_type) return
    setPendingRoleChange({
      userId: user.userid,
      username: user.username,
      currentRole: user.user_type,
      newRole,
    })
  }

  async function handleRoleConfirm() {
    if (!pendingRoleChange) return
    const { userId, newRole } = pendingRoleChange
    setRoleLoading(userId)
    setPendingRoleChange(null)
    try {
      await changeUserRole(userId, newRole)
      await fetchUsers()
    } catch (err) {
      alert(err.message || 'Failed to change role.')
    } finally {
      setRoleLoading(null)
    }
  }

  const filtered = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.userid?.toLowerCase().includes(search.toLowerCase())
  )

  function TypePill({ type }) {
    const cls = type === 'SUPERADMIN'
      ? 'ap-type-super'
      : type === 'ADMIN'
        ? 'ap-type-admin'
        : 'ap-type-user'
    return <span className={`ap-type-pill ${cls}`}>{type}</span>
  }

  return (
    <>
      {ToastComponent}
      <style>{css}</style>
      <div className={`ap-root ${mounted ? 'mounted' : ''}`}>

        <div className="ap-header">
          <h1 className="ap-title">User Management</h1>
          <p className="ap-subtitle">Activate, deactivate, and manage roles of CMS user accounts</p>
        </div>

        <div className="ap-notice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
             <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>
            SUPERADMIN accounts are protected and cannot be modified. Only SUPERADMIN can reassign user roles. 
            New registrations require manual activation before system access is granted[cite: 7].
          </span>
        </div>

        <div className="ap-toolbar">
          <div className="ap-search-wrap">
            <span className="ap-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              className="ap-search"
              type="text"
              placeholder="Search by username or user ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
            <div style={{ padding: '0 20px 20px' }}>
              <SkeletonTable rows={5} cols={5} />
            </div>
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
                    const isSA = u.user_type === 'SUPERADMIN'
                    const isActive = u.record_status === 'ACTIVE'
                    const isCurrentUser = u.userid === currentUser?.userid
                    const isDisabled = isSA || isCurrentUser
                    const isRoleChanging = roleLoading === u.userid

                    return (
                      <tr key={u.userid} className={isDisabled ? 'disabled-row' : ''}>
                        <td className="ap-mono">{u.userid}</td>
                        <td style={{ fontWeight: 600 }}>{u.username || '-'}</td>
                        <td>
                          {isSuperAdmin && !isSA && !isCurrentUser ? (
                            <div className="ap-role-wrap">
                              <select
                                className="ap-role-select"
                                value={u.user_type}
                                disabled={isRoleChanging}
                                onChange={(e) => handleRoleDropdownChange(u, e.target.value)}
                              >
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                              {isRoleChanging && <span className="ap-role-saving">...</span>}
                            </div>
                          ) : (
                            <TypePill type={u.user_type} />
                          )}
                        </td>
                        <td>
                          <span className={isActive ? 'ap-badge-active' : 'ap-badge-inactive'}>
                            <span className="ap-badge-dot" style={{ background: isActive ? '#059669' : '#dc2626' }} />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {isDisabled ? (
                            <span className="ap-btn ap-btn-disabled">
                              {isSA ? 'Protected' : 'Current User'}
                            </span>
                          ) : (
                            <>
                              {!isActive && (
                                <button
                                  className="ap-btn ap-btn-activate"
                                  disabled={actionLoading === u.userid}
                                  onClick={() => handleActivate(u.userid)}
                                >
                                  {actionLoading === u.userid ? '...' : 'Activate'}
                                </button>
                              )}
                              {isActive && (
                                <button
                                  className="ap-btn ap-btn-deactivate"
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
                Showing {filtered.length} of {users.length} registered accounts[cite: 7]
              </div>
            </>
          )}
        </div>
      </div>

      {pendingRoleChange && (
        <div className="ap-modal-overlay">
          <div className="ap-modal">
            <p className="ap-modal-title">Confirm Role Change</p>
            <p className="ap-modal-body">
              Change <strong>{pendingRoleChange.username}</strong>'s role from{' '}
              <strong>{pendingRoleChange.currentRole}</strong> to{' '}
              <strong>{pendingRoleChange.newRole}</strong>?
              <br /><br />
              New permissions will be applied immediately[cite: 7].
            </p>
            <div className="ap-modal-actions">
              <button className="ap-modal-btn ap-modal-cancel" onClick={() => setPendingRoleChange(null)}>
                Cancel
              </button>
              <button className="ap-modal-btn ap-modal-confirm" onClick={handleRoleConfirm}>
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}