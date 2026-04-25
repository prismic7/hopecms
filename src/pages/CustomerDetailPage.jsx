import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCustomers } from '../services/customerService'
import { getSalesByCustomer, getSalesDetail } from '../services/salesProductService'
import { useAuth } from '../context/AuthContext'

export default function CustomerDetailPage() {
  const { custno } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const userType = currentUser?.user_type

  const [customer, setCustomer] = useState(null)
  const [sales, setSales] = useState([])
  const [custLoading, setCustLoading] = useState(true)
  const [salesLoading, setSalesLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedTrans, setSelectedTrans] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const showStamp = userType === 'ADMIN' || userType === 'SUPERADMIN'

  const css = `
    .cd-page { padding: 28px 32px; max-width: 1100px; margin: 0 auto; font-family: sans-serif; }
    .cd-back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7280; background: none; border: none; cursor: pointer; padding: 0; margin-bottom: 20px; }
    .cd-back:hover { color: #111827; }
    .cd-profile-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; }
    .cd-profile-left { display: flex; align-items: flex-start; gap: 16px; }
    .cd-avatar { width: 52px; height: 52px; border-radius: 50%; background: #dbeafe; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: #1d4ed8; flex-shrink: 0; }
    .cd-name { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 4px; }
    .cd-custno { font-size: 12px; color: #9ca3af; font-family: monospace; margin: 0 0 8px; }
    .cd-meta { display: flex; gap: 8px; flex-wrap: wrap; }
    .cd-pill { display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
    .cd-badge-active { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #d1fae5; color: #065f46; }
    .cd-badge-inactive { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #fee2e2; color: #991b1b; }
    .cd-dot { width: 5px; height: 5px; border-radius: 50%; display: inline-block; }
    .cd-address { font-size: 13px; color: #6b7280; margin: 8px 0 0; max-width: 400px; }
    .cd-stamp { font-size: 11px; color: #9ca3af; font-family: monospace; margin: 6px 0 0; }
    .cd-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .cd-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .cd-card-header { padding: 14px 18px; border-bottom: 1px solid #f3f4f6; background: #f9fafb; display: flex; justify-content: space-between; align-items: center; }
    .cd-card-title { font-size: 13px; font-weight: 600; color: #374151; margin: 0; }
    .cd-card-sub { font-size: 12px; color: #9ca3af; }
    .cd-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .cd-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #f3f4f6; text-transform: uppercase; letter-spacing: 0.05em; background: #f9fafb; white-space: nowrap; }
    .cd-table td { padding: 11px 14px; border-bottom: 1px solid #f9fafb; color: #111827; vertical-align: middle; }
    .cd-table tr:last-child td { border-bottom: none; }
    .cd-table tbody tr { cursor: pointer; }
    .cd-table tbody tr:hover td { background: #eff6ff; }
    .cd-table tbody tr.selected td { background: #dbeafe; }
    .cd-mono { font-family: monospace; font-size: 12px; color: #6b7280; }
    .cd-empty { text-align: center; padding: 40px 24px; color: #9ca3af; font-size: 13px; }
    .cd-hint { font-size: 12px; color: #93c5fd; margin: 4px 0 0; }
    .cd-view-btn { font-size: 12px; color: #1d4ed8; background: none; border: none; cursor: pointer; padding: 0; font-weight: 500; }
    .cd-view-btn:hover { text-decoration: underline; }

    .sd-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
    .sd-box { background: #fff; border-radius: 14px; border: 1px solid #e5e7eb; width: 100%; max-width: 600px; overflow: hidden; max-height: 80vh; display: flex; flex-direction: column; }
    .sd-header { padding: 18px 24px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: flex-start; background: #f9fafb; flex-shrink: 0; }
    .sd-header-left { display: flex; flex-direction: column; gap: 2px; }
    .sd-title { font-size: 15px; font-weight: 600; color: #111827; margin: 0; }
    .sd-subtitle { font-size: 12px; color: #9ca3af; font-family: monospace; }
    .sd-close { background: none; border: none; font-size: 20px; color: #9ca3af; cursor: pointer; padding: 0; line-height: 1; }
    .sd-close:hover { color: #374151; }
    .sd-body { overflow-y: auto; flex: 1; }
    .sd-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .sd-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #f3f4f6; text-transform: uppercase; letter-spacing: 0.05em; background: #f9fafb; white-space: nowrap; position: sticky; top: 0; }
    .sd-table td { padding: 12px 16px; border-bottom: 1px solid #f9fafb; color: #111827; vertical-align: middle; }
    .sd-table tr:last-child td { border-bottom: none; }
    .sd-unit { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
    .sd-footer { padding: 12px 24px; border-top: 1px solid #f3f4f6; background: #f9fafb; display: flex; justify-content: flex-end; flex-shrink: 0; }
    .sd-close-btn { padding: 7px 18px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; color: #374151; font-size: 13px; font-weight: 500; cursor: pointer; }
    .sd-close-btn:hover { background: #f9fafb; }

    @media (max-width: 700px) { .cd-layout { grid-template-columns: 1fr; } }
  `

  useEffect(() => {
    async function fetchCustomer() {
      setCustLoading(true)
      try {
        const all = await getCustomers('SUPERADMIN')
        const found = (all || []).find((c) => c.custno === custno)
        if (!found) { setError('Customer not found.'); return }
        setCustomer(found)
      } catch {
        setError('Failed to load customer.')
      } finally {
        setCustLoading(false)
      }
    }
    fetchCustomer()
  }, [custno])

  useEffect(() => {
    async function fetchSales() {
      setSalesLoading(true)
      try {
        const data = await getSalesByCustomer(custno)
        setSales(data || [])
      } catch {
        setSales([])
      } finally {
        setSalesLoading(false)
      }
    }
    fetchSales()
  }, [custno])

  async function handleSelectTransaction(transNo) {
    setSelectedTrans(transNo)
    setDetailLoading(true)
    setDetail(null)
    setShowModal(true)
    try {
      const data = await getSalesDetail(transNo)
      setDetail(data || [])
    } catch {
      setDetail([])
    } finally {
      setDetailLoading(false)
    }
  }

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  }

  if (custLoading) return (
    <>
      <style>{css}</style>
      <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af', fontFamily: 'sans-serif' }}>
        Loading customer…
      </div>
    </>
  )

  if (error) return (
    <>
      <style>{css}</style>
      <div style={{ textAlign: 'center', padding: '80px', color: '#dc2626', fontFamily: 'sans-serif' }}>
        {error}
      </div>
    </>
  )

  return (
    <>
      <style>{css}</style>

      {/* Sales Detail Modal */}
      {showModal && (
        <div className="sd-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="sd-box">
            <div className="sd-header">
              <div className="sd-header-left">
                <h2 className="sd-title">Sales Detail</h2>
                <span className="sd-subtitle">{selectedTrans}</span>
              </div>
              <button className="sd-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="sd-body">
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '13px' }}>
                  Loading line items…
                </div>
              ) : !detail || detail.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '13px' }}>
                  No line items found.
                </div>
              ) : (
                <table className="sd-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Description</th>
                      <th>Unit</th>
                      <th style={{ textAlign: 'right' }}>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.map((d, i) => (
                      <tr key={i}>
                        <td className="cd-mono">{d.product?.prodCode}</td>
                        <td style={{ fontWeight: 500 }}>{d.product?.description}</td>
                        <td><span className="sd-unit">{d.product?.unit}</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{d.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="sd-footer">
              <button className="sd-close-btn" onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="cd-page">
        {/* Back button */}
        <button className="cd-back" onClick={() => navigate('/customers')}>
          ← Back to Customers
        </button>

        {/* Customer Profile Card */}
        {customer && (
          <div className="cd-profile-card">
            <div className="cd-profile-left">
              <div className="cd-avatar">{getInitials(customer.custname)}</div>
              <div>
                <h1 className="cd-name">{customer.custname}</h1>
                <p className="cd-custno">{customer.custno}</p>
                <div className="cd-meta">
                  <span className="cd-pill">{customer.payterm}</span>
                  <span className={customer.record_status === 'ACTIVE' ? 'cd-badge-active' : 'cd-badge-inactive'}>
                    <span className="cd-dot" style={{ background: customer.record_status === 'ACTIVE' ? '#059669' : '#dc2626' }} />
                    {customer.record_status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {customer.address && <p className="cd-address">{customer.address}</p>}
                {showStamp && customer.stamp && (
                  <p className="cd-stamp">Stamp: {customer.stamp}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sales History Panel */}
        <div className="cd-layout">
          <div className="cd-card" style={{ gridColumn: '1 / -1' }}>
            <div className="cd-card-header">
              <span className="cd-card-title">Sales History</span>
              {!salesLoading && (
                <span className="cd-card-sub">
                  {sales.length} transaction{sales.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {salesLoading ? (
              <div className="cd-empty">Loading sales history…</div>
            ) : sales.length === 0 ? (
              <div className="cd-empty">No sales transactions found for this customer.</div>
            ) : (
              <table className="cd-table">
                <thead>
                  <tr>
                    <th>Trans No.</th>
                    <th>Date</th>
                    <th>Emp No.</th>
                    <th>Line Items</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr
                      key={s.transNo}
                      className={selectedTrans === s.transNo ? 'selected' : ''}
                      onClick={() => handleSelectTransaction(s.transNo)}
                    >
                      <td className="cd-mono">{s.transNo}</td>
                      <td>{s.salesDate}</td>
                      <td className="cd-mono">{s.empNo}</td>
                      <td>
                        <button className="cd-view-btn">View items →</button>
                      </td>
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