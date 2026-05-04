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

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

    .tc-root {
      font-family: 'DM Sans', system-ui, sans-serif;
      padding: 28px 32px;
      max-width: 1000px;
      margin: 0 auto;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.45s cubic-bezier(0.22,1,0.36,1),
                  transform 0.45s cubic-bezier(0.22,1,0.36,1);
    }
    .tc-root.mounted { opacity: 1; transform: translateY(0); }

    /* ── Header ──────────────────────────────────────────── */
    .tc-header {
      display: flex;
      flex-direction: column;
      margin-bottom: 32px;
    }
    .tc-title {
      font-family: 'Syne', sans-serif;
      font-size: 26px; font-weight: 700;
      color: #09090b; letter-spacing: -0.5px;
      line-height: 1.1; margin: 0 0 6px;
    }
    .tc-subtitle { font-size: 13px; color: #71717a; font-weight: 400; margin: 0; }

    /* ── Card ────────────────────────────────────────────── */
    .tc-card { 
      background: white; 
      border: 1px solid #e4e4e7; 
      border-radius: 14px; 
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .tc-card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid #f4f4f5; background: #fafafa;
    }
    .tc-card-title { font-size: 13px; font-weight: 600; color: #09090b; margin: 0; }
    .tc-card-sub { font-size: 12px; color: #a1a1aa; }

    /* ── List ────────────────────────────────────────────── */
    .tc-list { padding: 8px 0; }
    .tc-row { 
      display: flex; 
      align-items: center; 
      gap: 16px; 
      padding: 14px 20px; 
      border-bottom: 1px solid #f4f4f5; 
      cursor: pointer; 
      transition: all 0.2s ease; 
    }
    .tc-row:last-child { border-bottom: none; }
    .tc-row:hover { background: #fafafa; }
    
    .tc-rank-wrap {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 500; flex-shrink: 0;
      border: 1px solid #e4e4e7; background: #fff; color: #09090b;
    }
    .tc-rank-top { background: #09090b; color: #fff; border-color: #09090b; }

    .tc-info { flex: 1; min-width: 0; }
    .tc-name { font-size: 14px; font-weight: 550; color: #09090b; margin-bottom: 2px; }
    .tc-meta { font-size: 12px; color: #a1a1aa; font-family: 'Courier New', monospace; }

    /* ── Visualization ───────────────────────────────────── */
    .tc-bar-container { width: 140px; flex-shrink: 0; margin: 0 12px; }
    .tc-bar-bg { background: #f4f4f5; border-radius: 10px; height: 5px; overflow: hidden; }
    .tc-bar-fill { height: 100%; border-radius: 10px; background: #09090b; transition: width 1s ease-out; }
    
    .tc-spend { 
      font-size: 14px; 
      font-weight: 700; 
      color: #09090b; 
      text-align: right; 
      min-width: 100px;
      font-family: 'DM Sans', sans-serif;
    }

    .tc-empty { text-align: center; padding: 64px 24px; color: #a1a1aa; font-size: 13.5px; }

    @media (max-width: 640px) {
      .tc-root { padding: 16px; }
      .tc-bar-container { display: none; }
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

  return (
    <>
      {ToastComponent}
      <style>{css}</style>
      <div className={`tc-root ${mounted ? 'mounted' : ''}`}>

        <div className="tc-header">
          <h1 className="tc-title">Top Customers</h1>
          <p className="tc-subtitle">Top performers ranked by cumulative spend</p>
        </div>

        <div className="tc-card">
          <div className="tc-card-header">
            <span className="tc-card-title">Performance Leaderboard</span>
            <span className="tc-card-sub">Top {data.length} Customers</span>
          </div>

          {loading ? (
            <div className="tc-empty">Analyzing transaction data...</div>
          ) : error ? (
            <div className="tc-empty" style={{ color: '#dc2626' }}>{error}</div>
          ) : data.length === 0 ? (
            <div className="tc-empty">No ranking data available.</div>
          ) : (
            <div className="tc-list">
              {data.map((r, i) => {
                const isTop3 = i < 3;
                return (
                  <div
                    key={r.custno}
                    className="tc-row"
                    onClick={() => navigate(`/customers/${r.custno}`)}
                  >
                    <div className={`tc-rank-wrap ${isTop3 ? 'tc-rank-top' : ''}`}>
                      {i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : i + 1}
                    </div>
                    
                    <div className="tc-info">
                      <div className="tc-name">{r.custname}</div>
                      <div className="tc-meta">
                        {r.totalTransactions} total transaction{r.totalTransactions !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="tc-bar-container">
                      <div className="tc-bar-bg">
                        <div
                          className="tc-bar-fill"
                          style={{ width: `${((r.totalSpend ?? 0) / maxSpend) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="tc-spend">
                      {formatCurrency(r.totalSpend)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}