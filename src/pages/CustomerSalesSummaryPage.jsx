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

  const css = `
    .cs-page { padding: 28px 32px; max-width: 1100px; margin: 0 auto; font-family: sans-serif; }
    .cs-topbar { margin-bottom: 24px; }
    .cs-title { font-size: 22px; font-weight: 600; margin: 0 0 4px; color: #111827; }
    .cs-sub { font-size: 13px; color: #6b7280; margin: 0; }
    .cs-controls { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .cs-search { flex: 1; min-width: 200px; padding: 9px 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #111827; outline: none; }
    .cs-search:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .cs-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .cs-card-header { padding: 14px 18px; border-bottom: 1px solid #f3f4f6; background: #f9fafb; display: flex; justify-content: space-between; align-items: center; }
    .cs-card-title { font-size: 13px; font-weight: 600; color: #374151; margin: 0; }
    .cs-card-count { font-size: 12px; color: #9ca3af; }
    .cs-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .cs-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #f3f4f6; text-transform: uppercase; letter-spacing: 0.05em; background: #f9fafb; white-space: nowrap; cursor: pointer; user-select: none; }
    .cs-table th:hover { background: #f3f4f6; color: #374151; }
    .cs-table td { padding: 11px 14px; border-bottom: 1px solid #f9fafb; color: #111827; vertical-align: middle; }
    .cs-table tr:last-child td { border-bottom: none; }
    .cs-table tbody tr:hover td { background: #f9fafb; }
    .cs-mono { font-family: monospace; font-size: 12px; color: #6b7280; }
    .cs-empty { text-align: center; padding: 56px 24px; color: #9ca3af; font-size: 13px; }
    .cs-footer { padding: 10px 14px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; }
    .cs-spend { font-weight: 600; color: #059669; }
    @media (max-width: 640px) {
      .cs-page { padding: 16px; }
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
    if (sortField !== field) return ' ↕'
    return sortAsc ? ' ↑' : ' ↓'
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
      <div className="cs-page">

        <div className="cs-topbar">
          <h1 className="cs-title">Customer Sales Summary</h1>
          <p className="cs-sub">Total transactions and spend per customer — read only</p>
        </div>

        <div className="cs-controls">
          <input
            className="cs-search"
            type="text"
            placeholder="Search by customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="cs-card">
          <div className="cs-card-header">
            <span className="cs-card-title">All Customers</span>
            {!loading && (
              <span className="cs-card-count">
                {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <table className="cs-table">
              <tbody>
                <SkeletonTable rows={6} cols={5} />
              </tbody>
            </table>
          ) : error ? (
            <div className="cs-empty" style={{ color: '#dc2626' }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div className="cs-empty">No customers found.</div>
          ) : (
            <>
              <table className="cs-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('custno')}>Cust No{sortArrow('custno')}</th>
                    <th onClick={() => handleSort('custname')}>Customer Name{sortArrow('custname')}</th>
                    <th onClick={() => handleSort('totalTransactions')}>Transactions{sortArrow('totalTransactions')}</th>
                    <th onClick={() => handleSort('totalSpend')}>Total Spend{sortArrow('totalSpend')}</th>
                    <th onClick={() => handleSort('lastSaleDate')}>Last Sale{sortArrow('lastSaleDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.custno}>
                      <td className="cs-mono">{r.custno}</td>
                      <td style={{ fontWeight: 500 }}>{r.custname}</td>
                      <td>{r.totalTransactions ?? 0}</td>
                      <td className="cs-spend">{formatCurrency(r.totalSpend)}</td>
                      <td>{formatDate(r.lastSaleDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="cs-footer">
                Showing {filtered.length} of {data.length} customers
              </div>
            </>
          )}
        </div>

      </div>
    </>
  )
}