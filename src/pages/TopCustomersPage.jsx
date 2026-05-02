import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTopCustomers } from '../services/reportsService'
import { useToast } from '../components/Toast'

export default function TopCustomersPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { showToast, ToastComponent } = useToast()

  const css = `
    .tc-page { padding: 28px 32px; max-width: 1100px; margin: 0 auto; font-family: sans-serif; }
    .tc-topbar { margin-bottom: 24px; }
    .tc-title { font-size: 22px; font-weight: 600; margin: 0 0 4px; color: #111827; }
    .tc-sub { font-size: 13px; color: #6b7280; margin: 0; }
    .tc-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
    .tc-card-header { padding: 14px 18px; border-bottom: 1px solid #f3f4f6; background: #f9fafb; display: flex; justify-content: space-between; align-items: center; }
    .tc-card-title { font-size: 13px; font-weight: 600; color: #374151; margin: 0; }
    .tc-card-sub { font-size: 12px; color: #9ca3af; margin: 0; }
    .tc-list { padding: 12px 0; }
    .tc-row { display: flex; align-items: center; gap: 16px; padding: 12px 18px; border-bottom: 1px solid #f9fafb; cursor: pointer; transition: background 0.15s; }
    .tc-row:last-child { border-bottom: none; }
    .tc-row:hover { background: #f9fafb; }
    .tc-rank { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .tc-rank-1 { background: #fef3c7; color: #92400e; }
    .tc-rank-2 { background: #f3f4f6; color: #374151; }
    .tc-rank-3 { background: #fef3c7; color: #b45309; }
    .tc-rank-other { background: #f3f4f6; color: #6b7280; }
    .tc-info { flex: 1; min-width: 0; }
    .tc-name { font-size: 13px; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tc-meta { font-size: 12px; color: #9ca3af; margin-top: 2px; }
    .tc-spend { font-size: 14px; font-weight: 700; color: #059669; flex-shrink: 0; }
    .tc-bar-wrap { width: 120px; flex-shrink: 0; }
    .tc-bar-bg { background: #f3f4f6; border-radius: 9999px; height: 6px; overflow: hidden; }
    .tc-bar-fill { height: 6px; border-radius: 9999px; background: linear-gradient(90deg, #10b981, #059669); }
    .tc-empty { text-align: center; padding: 56px 24px; color: #9ca3af; font-size: 13px; }
    @media (max-width: 640px) {
      .tc-page { padding: 16px; }
      .tc-bar-wrap { display: none; }
    }
  `

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const result = await getTopCustomers()
        setData(result || [])
      } catch {
        showToast('Failed to load top customers.', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function formatCurrency(val) {
    if (val == null) return '—'
    return '₱' + Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2 })
  }

  const maxSpend = data.length > 0 ? Math.max(...data.map((r) => r.totalSpend ?? 0)) : 1

  function rankClass(i) {
    if (i === 0) return 'tc-rank tc-rank-1'
    if (i === 1) return 'tc-rank tc-rank-2'
    if (i === 2) return 'tc-rank tc-rank-3'
    return 'tc-rank tc-rank-other'
  }

  return (
    <>
      {ToastComponent}
      <style>{css}</style>
      <div className="tc-page">

        <div className="tc-topbar">
          <h1 className="tc-title">Top Customers</h1>
          <p className="tc-sub">Top 10 customers ranked by total spend — click a row to view details</p>
        </div>

        <div className="tc-card">
          <div className="tc-card-header">
            <span className="tc-card-title">Leaderboard</span>
            <span className="tc-card-sub">Top {data.length} customers by spend</span>
          </div>

          {loading ? (
            <div className="tc-empty">Loading...</div>
          ) : error ? (
            <div className="tc-empty" style={{ color: '#dc2626' }}>{error}</div>
          ) : data.length === 0 ? (
            <div className="tc-empty">No data available.</div>
          ) : (
            <div className="tc-list">
              {data.map((r, i) => (
                <div
                  key={r.custno}
                  className="tc-row"
                  onClick={() => navigate(`/customers/${r.custno}`)}
                >
                  <div className={rankClass(i)}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </div>
                  <div className="tc-info">
                    <div className="tc-name">{r.custname}</div>
                    <div className="tc-meta">{r.totalTransactions} transaction{r.totalTransactions !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="tc-bar-wrap">
                    <div className="tc-bar-bg">
                      <div
                        className="tc-bar-fill"
                        style={{ width: `${((r.totalSpend ?? 0) / maxSpend) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="tc-spend">{formatCurrency(r.totalSpend)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  )
}