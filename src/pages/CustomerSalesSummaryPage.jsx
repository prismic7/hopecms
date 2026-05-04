import { useState, useEffect } from 'react'
import { getCustomerSalesSummary } from '../services/reportsService'
import { useToast } from '../components/Toast'
import { SkeletonTable } from '../components/Skeleton'

export default function CustomerSalesSummaryPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('totalSpend')
  const [sortAsc, setSortAsc] = useState(false)
  const { showToast, ToastComponent } = useToast()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

    .cs-root {
      font-family: 'DM Sans', system-ui, sans-serif;
      padding: 28px 32px;
      max-width: 1200px;
      margin: 0 auto;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.45s cubic-bezier(0.22,1,0.36,1),
                  transform 0.45s cubic-bezier(0.22,1,0.36,1);
    }
    .cs-root.mounted { opacity: 1; transform: translateY(0); }

    /* ── Header ──────────────────────────────────────────── */
    .cs-header {
      display: flex;
      flex-direction: column;
      margin-bottom: 20px;
    }
    .cs-title {
      font-family: 'Syne', sans-serif;
      font-size: 26px; font-weight: 700;
      color: #09090b; letter-spacing: -0.5px;
      line-height: 1.1; margin: 0 0 6px;
    }
    .cs-subtitle { font-size: 13px; color: #71717a; font-weight: 400; margin: 0; }

    /* ── Toolbar ─────────────────────────────────────────── */
    .cs-toolbar {
      display: flex; gap: 10px; margin-bottom: 24px; align-items: center;
    }
    .cs-search-wrap {
      position: relative; flex: 1; max-width: 400px;
    }
    .cs-search-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      color: #a1a1aa; pointer-events: none; display: flex; align-items: center;
    }
    .cs-search {
      width: 100%; height: 38px; padding: 0 12px 0 36px;
      background: white; border: 1px solid #e4e4e7; border-radius: 9px;
      font-size: 13.5px; color: #09090b; outline: none;
      font-family: 'DM Sans', sans-serif;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      box-sizing: border-box;
    }
    .cs-search::placeholder { color: #a1a1aa; }
    .cs-search:focus { border-color: #09090b; box-shadow: 0 0 0 3px rgba(9,9,11,0.06); }

    /* ── Card ────────────────────────────────────────────── */
    .cs-card { background: white; border: 1px solid #e4e4e7; border-radius: 14px; overflow: hidden; }
    .cs-card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; border-bottom: 1px solid #f4f4f5; background: #fafafa;
    }
    .cs-card-title { font-size: 13px; font-weight: 600; color: #09090b; margin: 0; }
    .cs-card-count { font-size: 12px; color: #a1a1aa; }

    /* ── Table ───────────────────────────────────────────── */
    .cs-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .cs-table thead { background: #fafafa; }
    .cs-table th {
      padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600;
      color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.6px;
      border-bottom: 1px solid #f4f4f5; white-space: nowrap;
      cursor: pointer; user-select: none; transition: color 0.15s ease;
    }
    .cs-table th:hover { color: #09090b; }
    .cs-table td { padding: 12px 16px; border-bottom: 1px solid #f4f4f5; color: #09090b; vertical-align: middle; }
    .cs-table tr:last-child td { border-bottom: none; }
    .cs-table tbody tr { transition: background 0.1s ease; }
    .cs-table tbody tr:hover td { background: #fafafa; }

    .cs-mono { font-family: 'Courier New', monospace; font-size: 12px; color: #71717a; letter-spacing: 0.3px; }
    .cs-spend { font-weight: 600; color: #09090b; }
    .cs-sort-icon { font-size: 10px; margin-left: 4px; color: #d4d4d8; }
    .cs-sort-active { color: #09090b; }

    .cs-empty { text-align: center; padding: 64px 24px; color: #a1a1aa; font-size: 13.5px; }
    .cs-footer { padding: 12px 20px; border-top: 1px solid #f4f4f5; font-size: 12px; color: #a1a1aa; }

    @media (max-width: 768px) {
      .cs-table th:nth-child(1), .cs-table td:nth-child(1) { display: none; }
    }
  `

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const result = await getCustomerSalesSummary()
        setData(result || [])
      } catch {
        showToast('Failed to load customer sales summary.', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function handleSort(field) {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  function sortArrow(field) {
    const isActive = sortField === field
    return (
      <span className={`cs-sort-icon ${isActive ? 'cs-sort-active' : ''}`}>
        {!isActive ? '↕' : sortAsc ? '↑' : '↓'}
      </span>
    )
  }

  const filtered = data
    .filter((r) => r.custname?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortField] ?? 0
      const bv = b[sortField] ?? 0
      if (typeof av === 'string') return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortAsc ? av - bv : bv - av
    })

  function formatCurrency(val) {
    if (val == null) return '—'
    return '₱' + Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2 })
  }

  function formatDate(val) {
    if (!val) return '—'
    return new Date(val).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <>
      {ToastComponent}
      <style>{css}</style>
      <div className={`cs-root ${mounted ? 'mounted' : ''}`}>

        <div className="cs-header">
          <h1 className="cs-title">Customer Sales Summary</h1>
          <p className="cs-subtitle">Aggregate transaction data and spend metrics (Read-only)</p>
        </div>

        <div className="cs-toolbar">
          <div className="cs-search-wrap">
            <span className="cs-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              className="cs-search"
              type="text"
              placeholder="Search by customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="cs-card">
          <div className="cs-card-header">
            <span className="cs-card-title">Customer Insights</span>
            {!loading && (
              <span className="cs-card-count">
                {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '0 20px 20px' }}>
              <SkeletonTable rows={6} cols={5} />
            </div>
          ) : error ? (
            <div className="cs-empty" style={{ color: '#dc2626' }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div className="cs-empty">No records found.</div>
          ) : (
            <>
              <table className="cs-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('custno')}>
                      Cust No {sortArrow('custno')}
                    </th>
                    <th onClick={() => handleSort('custname')}>
                      Customer Name {sortArrow('custname')}
                    </th>
                    <th onClick={() => handleSort('totalTransactions')}>
                      Transactions {sortArrow('totalTransactions')}
                    </th>
                    <th onClick={() => handleSort('totalSpend')}>
                      Total Spend {sortArrow('totalSpend')}
                    </th>
                    <th onClick={() => handleSort('lastSaleDate')}>
                      Last Sale {sortArrow('lastSaleDate')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.custno}>
                      <td className="cs-mono">{r.custno}</td>
                      <td style={{ fontWeight: 600 }}>{r.custname}</td>
                      <td>{r.totalTransactions ?? 0}</td>
                      <td className="cs-spend">{formatCurrency(r.totalSpend)}</td>
                      <td className="cs-mono" style={{ fontSize: '14px' }}>
                        {formatDate(r.lastSaleDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="cs-footer">
                Showing {filtered.length} of {data.length} customers summarized
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}