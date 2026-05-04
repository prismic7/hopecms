import { useState, useEffect } from 'react'
import { getProductRevenue } from '../services/reportsService'
import { useToast } from '../components/Toast'
import { SkeletonTable } from '../components/Skeleton'

export default function ProductRevenuePage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('totalRevenue')
  const [sortAsc, setSortAsc] = useState(false)
  const { showToast, ToastComponent } = useToast()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

    .pr-root {
      font-family: 'DM Sans', system-ui, sans-serif;
      padding: 28px 32px;
      max-width: 1200px;
      margin: 0 auto;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.45s cubic-bezier(0.22,1,0.36,1),
                  transform 0.45s cubic-bezier(0.22,1,0.36,1);
    }
    .pr-root.mounted { opacity: 1; transform: translateY(0); }

    /* ── Header ──────────────────────────────────────────── */
    .pr-header {
      display: flex;
      flex-direction: column;
      margin-bottom: 24px;
    }
    .pr-title {
      font-family: 'Syne', sans-serif;
      font-size: 26px; font-weight: 700;
      color: #09090b; letter-spacing: -0.5px;
      line-height: 1.1; margin: 0 0 6px;
    }
    .pr-subtitle { font-size: 13px; color: #71717a; font-weight: 400; margin: 0; }
    
    .pr-notice {
      display: inline-flex; align-items: center; gap: 8px;
      background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px;
      padding: 8px 14px; margin-bottom: 24px; font-size: 12px; color: #71717a;
    }

    /* ── Toolbar ─────────────────────────────────────────── */
    .pr-toolbar {
      display: flex; gap: 10px; margin-bottom: 24px; align-items: center;
    }
    .pr-search-wrap {
      position: relative; flex: 1; max-width: 400px;
    }
    .pr-search-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      color: #a1a1aa; pointer-events: none; display: flex; align-items: center;
    }
    .pr-search {
      width: 100%; height: 38px; padding: 0 12px 0 36px;
      background: white; border: 1px solid #e4e4e7; border-radius: 9px;
      font-size: 13.5px; color: #09090b; outline: none;
      font-family: 'DM Sans', sans-serif;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      box-sizing: border-box;
    }
    .pr-search::placeholder { color: #a1a1aa; }
    .pr-search:focus { border-color: #09090b; box-shadow: 0 0 0 3px rgba(9,9,11,0.06); }

    /* ── Card ────────────────────────────────────────────── */
    .pr-card { background: white; border: 1px solid #e4e4e7; border-radius: 14px; overflow: hidden; }
    .pr-card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; border-bottom: 1px solid #f4f4f5; background: #fafafa;
    }
    .pr-card-title { font-size: 13px; font-weight: 600; color: #09090b; margin: 0; }
    .pr-card-count { font-size: 12px; color: #a1a1aa; }

    /* ── Table ───────────────────────────────────────────── */
    .pr-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .pr-table thead { background: #fafafa; }
    .pr-table th {
      padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 600;
      color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.6px;
      border-bottom: 1px solid #f4f4f5; white-space: nowrap;
      cursor: pointer; user-select: none; transition: color 0.15s ease;
    }
    .pr-table th:hover { color: #09090b; }
    .pr-table td { padding: 14px 16px; border-bottom: 1px solid #f4f4f5; color: #09090b; vertical-align: middle; }
    .pr-table tr:last-child td { border-bottom: none; }
    .pr-table tbody tr { transition: background 0.1s ease; }
    .pr-table tbody tr:hover td { background: #fafafa; }

    .pr-mono { font-family: 'Courier New', monospace; font-size: 12px; color: #71717a; letter-spacing: 0.3px; }
    .pr-badge { 
      display: inline-block; padding: 2px 8px; border-radius: 5px; 
      font-size: 11px; font-weight: 600; background: #f4f4f5; 
      color: #09090b; border: 1px solid #e4e4e7;
    }
    .pr-rev-text { font-weight: 700; color: #09090b; }
    .pr-sort-icon { font-size: 10px; margin-left: 4px; color: #d4d4d8; }
    .pr-sort-active { color: #09090b; }

    .pr-empty { text-align: center; padding: 64px 24px; color: #a1a1aa; font-size: 13.5px; }
    .pr-footer { padding: 12px 20px; border-top: 1px solid #f4f4f5; font-size: 12px; color: #a1a1aa; }

    @media (max-width: 768px) {
      .pr-table th:nth-child(1), .pr-table td:nth-child(1) { display: none; }
    }
  `

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const result = await getProductRevenue()
        setData(result || [])
      } catch {
        showToast('Failed to load product revenue report.', 'error')
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
      <span className={`pr-sort-icon ${isActive ? 'pr-sort-active' : ''}`}>
        {!isActive ? '↕' : sortAsc ? '↑' : '↓'}
      </span>
    )
  }

  const filtered = data
    .filter((r) =>
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.prodcode?.toLowerCase().includes(search.toLowerCase())
    )
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

  return (
    <>
      {ToastComponent}
      <style>{css}</style>
      <div className={`pr-root ${mounted ? 'mounted' : ''}`}>

        <div className="pr-header">
          <h1 className="pr-title">Product Revenue</h1>
          <p className="pr-subtitle">Total sales performance metrics across inventory</p>
        </div>

        <div className="pr-notice">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          This is a read-only report for auditing purposes.
        </div>

        <div className="pr-toolbar">
          <div className="pr-search-wrap">
            <span className="pr-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              className="pr-search"
              type="text"
              placeholder="Filter by code or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="pr-card">
          <div className="pr-card-header">
            <span className="pr-card-title">Inventory Performance</span>
            {!loading && (
              <span className="pr-card-count">
                {filtered.length} total items
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '0 20px 20px' }}>
              <SkeletonTable rows={6} cols={5} />
            </div>
          ) : error ? (
            <div className="pr-empty" style={{ color: '#dc2626' }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div className="pr-empty">No matching products found.</div>
          ) : (
            <>
              <table className="pr-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('prodcode')}>
                      Code {sortArrow('prodcode')}
                    </th>
                    <th onClick={() => handleSort('description')}>
                      Description {sortArrow('description')}
                    </th>
                    <th onClick={() => handleSort('unit')}>
                      Unit {sortArrow('unit')}
                    </th>
                    <th onClick={() => handleSort('totalQtySold')}>
                      Qty Sold {sortArrow('totalQtySold')}
                    </th>
                    <th onClick={() => handleSort('totalRevenue')}>
                      Total Revenue {sortArrow('totalRevenue')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.prodcode}>
                      <td className="pr-mono">{r.prodcode}</td>
                      <td style={{ fontWeight: 600 }}>{r.description}</td>
                      <td><span className="pr-badge">{r.unit}</span></td>
                      <td>{r.totalQtySold ?? 0}</td>
                      <td className="pr-rev-text">{formatCurrency(r.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pr-footer">
                Summarizing revenue for {filtered.length} products.
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}