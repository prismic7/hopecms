import { useState } from 'react'
import { getSalesByCustomer, getSalesDetail } from '../services/salesProductService'

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

  const css = `
    .sp-page { padding: 28px 32px; max-width: 1100px; margin: 0 auto; font-family: sans-serif; }
    .sp-topbar { margin-bottom: 24px; }
    .sp-title { font-size: 22px; font-weight: 600; margin: 0 0 4px; color: #111827; }
    .sp-sub { font-size: 13px; color: #6b7280; margin: 0; }
    .sp-search-row { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
    .sp-input { flex: 1; min-width: 180px; padding: 9px 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #111827; outline: none; }
    .sp-input:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .sp-btn { padding: 9px 20px; background: #1d4ed8; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; }
    .sp-btn:hover { background: #1e40af; }
    .sp-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .sp-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .sp-card-header { padding: 14px 18px; border-bottom: 1px solid #f3f4f6; background: #f9fafb; }
    .sp-card-title { font-size: 13px; font-weight: 600; color: #374151; margin: 0; }
    .sp-card-sub { font-size: 12px; color: #9ca3af; margin: 2px 0 0; }
    .sp-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .sp-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #f3f4f6; text-transform: uppercase; letter-spacing: 0.05em; background: #f9fafb; white-space: nowrap; }
    .sp-table td { padding: 11px 14px; border-bottom: 1px solid #f9fafb; color: #111827; vertical-align: middle; }
    .sp-table tr:last-child td { border-bottom: none; }
    .sp-table tbody tr { cursor: pointer; }
    .sp-table tbody tr:hover td { background: #eff6ff; }
    .sp-table tbody tr.selected td { background: #dbeafe; }
    .sp-mono { font-family: monospace; font-size: 12px; color: #6b7280; }
    .sp-empty { text-align: center; padding: 48px 24px; color: #9ca3af; font-size: 13px; }
    .sp-badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #dbeafe; color: #1e40af; }
    .sp-notice { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; font-size: 13px; color: #166534; }
    @media (max-width: 700px) { .sp-layout { grid-template-columns: 1fr; } }
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
      setError('Failed to load sales. Please check the customer number.')
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
      <style>{css}</style>
      <div className="sp-page">

        <div className="sp-topbar">
          <h1 className="sp-title">Sales</h1>
          <p className="sp-sub">View sales transactions by customer — read only</p>
        </div>

        <div className="sp-notice">
          This page is view-only. No add, edit, or delete operations are available on sales records.
        </div>

        <div className="sp-search-row">
          <input
            className="sp-input"
            type="text"
            placeholder="Enter customer no. (e.g. C0001)"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="sp-btn" onClick={handleSearch}>Search</button>
        </div>

        <div className="sp-layout">
          {/* Left — transaction list */}
          <div className="sp-card">
            <div className="sp-card-header">
              <p className="sp-card-title">
                Transactions {custNo ? `— ${custNo}` : ''}
              </p>
              {sales.length > 0 && (
                <p className="sp-card-sub">{sales.length} record{sales.length !== 1 ? 's' : ''} found</p>
              )}
            </div>
            {loading ? (
              <div className="sp-empty">Loading…</div>
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
                      key={s.transNo}
                      className={selectedTrans === s.transNo ? 'selected' : ''}
                      onClick={() => handleSelectTransaction(s.transNo)}
                    >
                      <td className="sp-mono">{s.transNo}</td>
                      <td>{s.salesDate}</td>
                      <td className="sp-mono">{s.empNo}</td>
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
                Line Items {selectedTrans ? `— ${selectedTrans}` : ''}
              </p>
              {detail && (
                <p className="sp-card-sub">{detail.length} item{detail.length !== 1 ? 's' : ''}</p>
              )}
            </div>
            {!selectedTrans ? (
              <div className="sp-empty">Select a transaction to view its line items.</div>
            ) : detailLoading ? (
              <div className="sp-empty">Loading…</div>
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
                      <td className="sp-mono">{d.product?.prodCode}</td>
                      <td>{d.product?.description}</td>
                      <td>
                        <span className="sp-badge">{d.product?.unit}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{d.quantity}</td>
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