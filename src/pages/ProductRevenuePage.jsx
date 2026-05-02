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

  const css = `
    .pr-page { padding: 28px 32px; max-width: 1100px; margin: 0 auto; font-family: sans-serif; }
    .pr-topbar { margin-bottom: 24px; }
    .pr-title { font-size: 22px; font-weight: 600; margin: 0 0 4px; color: #111827; }
    .pr-sub { font-size: 13px; color: #6b7280; margin: 0; }
    .pr-notice { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; font-size: 13px; color: #166534; }
    .pr-controls { margin-bottom: 20px; }
    .pr-search { width: 100%; box-sizing: border-box; padding: 9px 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #111827; outline: none; }
    .pr-search:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .pr-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .pr-card-header { padding: 14px 18px; border-bottom: 1px solid #f3f4f6; background: #f9fafb; display: flex; justify-content: space-between; align-items: center; }
    .pr-card-title { font-size: 13px; font-weight: 600; color: #374151; margin: 0; }
    .pr-card-count { font-size: 12px; color: #9ca3af; }
    .pr-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .pr-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #f3f4f6; text-transform: uppercase; letter-spacing: 0.05em; background: #f9fafb; white-space: nowrap; cursor: pointer; user-select: none; }
    .pr-table th:hover { background: #f3f4f6; color: #374151; }
    .pr-table td { padding: 11px 14px; border-bottom: 1px solid #f9fafb; color: #111827; vertical-align: middle; }
    .pr-table tr:last-child td { border-bottom: none; }
    .pr-table tbody tr:hover td { background: #f9fafb; }
    .pr-mono { font-family: monospace; font-size: 12px; color: #6b7280; }
    .pr-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
    .pr-revenue { font-weight: 600; color: #059669; }
    .pr-empty { text-align: center; padding: 56px 24px; color: #9ca3af; font-size: 13px; }
    .pr-footer { padding: 10px 14px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; }
    @media (max-width: 640px) {
      .pr-page { padding: 16px; }
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
        showToast('Failed to load product revenue.', 'error')
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
    if (sortField !== field) return ' ↕'
    return sortAsc ? ' ↑' : ' ↓'
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
      <div className="pr-page">

        <div className="pr-topbar">
          <h1 className="pr-title">Product Revenue</h1>
          <p className="pr-sub">Total quantity sold and revenue per product — read only</p>
        </div>

        <div className="pr-notice">
          This page is view-only. No add, edit, or delete operations are available.
        </div>

        <div className="pr-controls">
          <input
            className="pr-search"
            type="text"
            placeholder="Search by product code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="pr-card">
          <div className="pr-card-header">
            <span className="pr-card-title">All Products</span>
            {!loading && (
              <span className="pr-card-count">
                {filtered.length} product{filtered.length !== 1 ? 's' : ''}
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
            <div className="pr-empty" style={{ color: '#dc2626' }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div className="pr-empty">No products found.</div>
          ) : (
            <>
              <table className="pr-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('prodcode')}>Prod Code{sortArrow('prodcode')}</th>
                    <th onClick={() => handleSort('description')}>Description{sortArrow('description')}</th>
                    <th onClick={() => handleSort('unit')}>Unit{sortArrow('unit')}</th>
                    <th onClick={() => handleSort('totalQtySold')}>Qty Sold{sortArrow('totalQtySold')}</th>
                    <th onClick={() => handleSort('totalRevenue')}>Total Revenue{sortArrow('totalRevenue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.prodcode}>
                      <td className="pr-mono">{r.prodcode}</td>
                      <td style={{ fontWeight: 500 }}>{r.description}</td>
                      <td><span className="pr-badge">{r.unit}</span></td>
                      <td>{r.totalQtySold ?? 0}</td>
                      <td className="pr-revenue">{formatCurrency(r.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pr-footer">
                Showing {filtered.length} of {data.length} products
              </div>
            </>
          )}
        </div>

      </div>
    </>
  )
}