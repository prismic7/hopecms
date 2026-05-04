import { useState, useEffect } from 'react'
import { getSalesByCustomer, getSalesDetail } from '../services/salesProductService'
import { useToast } from '../components/Toast'

export default function SalesPage() {
  const [custNo, setCustNo] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [sales, setSales] = useState([])
  const [detail, setDetail] = useState(null)
  const [selectedTrans, setSelectedTrans] = useState(null)
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)
  const { showToast, ToastComponent } = useToast()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

    .sp-root {
      font-family: 'DM Sans', system-ui, sans-serif;
      padding: 28px 32px;
      max-width: 1200px;
      margin: 0 auto;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.45s cubic-bezier(0.22,1,0.36,1),
                  transform 0.45s cubic-bezier(0.22,1,0.36,1);
    }
    .sp-root.mounted { opacity: 1; transform: translateY(0); }

    .sp-header {
      display: flex;
      flex-direction: column;
      margin-bottom: 20px;
    }
    
    .sp-title {
      font-family: 'Syne', sans-serif;
      font-size: 26px; font-weight: 700;
      color: #09090b; letter-spacing: -0.5px;
      line-height: 1.1; margin: 0 0 6px;
    }
    
    .sp-subtitle { font-size: 13px; color: #71717a; font-weight: 400; margin: 0; }

    .sp-notice {
      background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px;
      padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #71717a;
      display: flex; align-items: center; gap: 8px;
    }

    .sp-toolbar {
      display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; align-items: center;
    }

    .sp-search-wrap {
      position: relative; flex: 1; min-width: 220px; max-width: 400px;
    }
    
    .sp-search-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      color: #a1a1aa; pointer-events: none; display: flex; align-items: center;
    }

    .sp-input {
      width: 100%; height: 38px; padding: 0 12px 0 36px;
      background: white; border: 1px solid #e4e4e7; border-radius: 9px;
      font-size: 13.5px; color: #09090b; outline: none;
      font-family: 'DM Sans', sans-serif;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      box-sizing: border-box;
    }
    .sp-input::placeholder { color: #a1a1aa; }
    .sp-input:focus { border-color: #09090b; box-shadow: 0 0 0 3px rgba(9,9,11,0.06); }

    .sp-btn {
      height: 38px; padding: 0 20px;
      background: #09090b; color: white; border: none; border-radius: 9px;
      font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif;
      cursor: pointer; white-space: nowrap; display: flex; align-items: center; justify-content: center;
      transition: opacity 0.15s ease, transform 0.1s ease;
    }
    .sp-btn:hover { opacity: 0.85; transform: translateY(-1px); }
    .sp-btn:active { transform: translateY(0); opacity: 1; }

    .sp-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }

    .sp-card { background: white; border: 1px solid #e4e4e7; border-radius: 14px; overflow: hidden; }
    .sp-card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; border-bottom: 1px solid #f4f4f5; background: #fafafa;
    }
    .sp-card-title { font-size: 13px; font-weight: 600; color: #09090b; margin: 0; }
    .sp-card-sub { font-size: 12px; color: #a1a1aa; margin: 0; }

    .sp-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .sp-table thead { background: #fafafa; }
    .sp-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 1px solid #f4f4f5; white-space: nowrap; }
    .sp-table td { padding: 12px 16px; border-bottom: 1px solid #f4f4f5; color: #09090b; vertical-align: middle; }
    .sp-table tr:last-child td { border-bottom: none; }
    .sp-table tbody tr { transition: background 0.1s ease; cursor: pointer; }
    .sp-table tbody tr:hover td { background: #fafafa; }
    .sp-table tbody tr.selected td { background: #f4f4f5; }

    .sp-mono { font-family: 'Courier New', monospace; font-size: 12px; color: #71717a; letter-spacing: 0.3px; }
    
    .sp-empty { text-align: center; padding: 64px 24px; color: #a1a1aa; font-size: 13.5px; }
    
    .sp-badge {
      display: inline-block; padding: 3px 9px; border-radius: 6px;
      font-size: 11px; font-weight: 600; background: #f4f4f5; color: #3f3f46; border: 1px solid #e4e4e7;
    }

    /* Skeleton Loading Outline */
    @keyframes sp-shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
    .sp-skel { height: 13px; border-radius: 6px; background: linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%); background-size: 600px 100%; animation: sp-shimmer 1.4s infinite; }

    @media (max-width: 768px) { .sp-layout { grid-template-columns: 1fr; } .sp-search-wrap { max-width: 100%; } }
  `

  async function handleSearch() {
    const trimmed = inputVal.trim().toUpperCase()
    if (!trimmed) return
    setCustNo(trimmed)
    setLoading(true)
    setError(null)
    setSales([])
    setDetail(null)
    setSelectedTrans(null)
    setSearched(true)
    try {
      const data = await getSalesByCustomer(trimmed)
      setSales(data || [])
    } catch {
      showToast('Failed to load sales. Please check the customer number.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectTransaction(transNo) {
    setSelectedTrans(transNo)
    setDetailLoading(true)
    setDetail(null)
    try {
      const data = await getSalesDetail(transNo)
      setDetail(data || [])
    } catch {
      setDetail([])
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <>
      {ToastComponent}
      <style>{css}</style>
      <div className={`sp-root ${mounted ? 'mounted' : ''}`}>

        <div className="sp-header">
          <h1 className="sp-title">Sales Transactions</h1>
          <p className="sp-subtitle">View past transactions and itemized details by customer</p>
        </div>

        <div className="sp-notice">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
             <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          This page is view-only. Modifications to sales records are not permitted here.
        </div>

        <div className="sp-toolbar">
          <div className="sp-search-wrap">
            <span className="sp-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              className="sp-input"
              type="text"
              placeholder="Enter customer no. (e.g. C0001)"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="sp-btn" onClick={handleSearch}>Search</button>
        </div>

        <div className="sp-layout">
          {/* Left — transaction list */}
          <div className="sp-card">
            <div className="sp-card-header">
              <p className="sp-card-title">
                Transactions {custNo ? <span style={{color: '#a1a1aa', fontWeight: 400}}>— {custNo}</span> : ''}
              </p>
              {sales.length > 0 && (
                <p className="sp-card-sub">{sales.length} record{sales.length !== 1 ? 's' : ''}</p>
              )}
            </div>
            {loading ? (
              <div style={{ padding: '24px' }}>
                <div className="sp-skel" style={{ width: '100%', marginBottom: '16px', height: '24px' }}></div>
                <div className="sp-skel" style={{ width: '100%', marginBottom: '16px', height: '24px' }}></div>
                <div className="sp-skel" style={{ width: '100%', height: '24px' }}></div>
              </div>
            ) : error ? (
              <div className="sp-empty" style={{ color: '#dc2626' }}>{error}</div>
            ) : !searched ? (
              <div className="sp-empty">Enter a customer number above to view their sales.</div>
            ) : sales.length === 0 ? (
              <div className="sp-empty">No sales found for {custNo}.</div>
            ) : (
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Trans No.</th>
                    <th>Date</th>
                    <th>Emp No.</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr
                      key={s.transno}
                      className={selectedTrans === s.transno ? 'selected' : ''}
                      onClick={() => handleSelectTransaction(s.transno)}
                    >
                      <td className="sp-mono">{s.transno}</td>
                      <td>{s.salesdate}</td>
                      <td className="sp-mono">{s.empno}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Right — line items */}
          <div className="sp-card">
            <div className="sp-card-header">
              <p className="sp-card-title">
                Line Items {selectedTrans ? <span style={{color: '#a1a1aa', fontWeight: 400}}>— {selectedTrans}</span> : ''}
              </p>
              {detail && (
                <p className="sp-card-sub">{detail.length} item{detail.length !== 1 ? 's' : ''}</p>
              )}
            </div>
            {!selectedTrans ? (
              <div className="sp-empty">Select a transaction to view its line items.</div>
            ) : detailLoading ? (
               <div style={{ padding: '24px' }}>
                <div className="sp-skel" style={{ width: '100%', marginBottom: '16px', height: '24px' }}></div>
                <div className="sp-skel" style={{ width: '80%', marginBottom: '16px', height: '24px' }}></div>
                <div className="sp-skel" style={{ width: '90%', height: '24px' }}></div>
              </div>
            ) : !detail || detail.length === 0 ? (
              <div className="sp-empty">No line items found.</div>
            ) : (
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Description</th>
                    <th>Unit</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.map((d, i) => (
                    <tr key={i}>
                      <td className="sp-mono">{d.product?.prodcode}</td>
                      <td style={{ fontWeight: 500 }}>{d.product?.description}</td>
                      <td>
                        <span className="sp-badge">{d.product?.unit}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{d.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </>
  )
}