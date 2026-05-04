import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCustomers } from '../services/customerService'
import { getSalesByCustomer, getSalesDetail } from '../services/salesProductService'
import { useAuth } from '../context/AuthContext'

const PAYTERM_COLOR = {
  COD:  { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  '30D':{ bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
  '45D':{ bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff' },
}

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
  
  const [mounted, setMounted] = useState(false)

  const showStamp = userType === 'ADMIN' || userType === 'SUPERADMIN'

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

    .cdp-root {
      font-family: 'DM Sans', system-ui, sans-serif;
      padding: 28px 32px;
      max-width: 1200px;
      margin: 0 auto;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.45s cubic-bezier(0.22,1,0.36,1),
                  transform 0.45s cubic-bezier(0.22,1,0.36,1);
    }
    .cdp-root.mounted { opacity: 1; transform: translateY(0); }

    .cdp-back {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 13.5px; color: #71717a; background: none; border: none;
      cursor: pointer; padding: 0; margin-bottom: 24px;
      font-family: 'DM Sans', sans-serif; transition: color 0.15s ease;
    }
    .cdp-back:hover { color: #09090b; }

    .cdp-profile-card {
      background: white; border: 1px solid #e4e4e7; border-radius: 14px;
      padding: 24px 28px; margin-bottom: 24px;
      display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;
    }
    .cdp-profile-left { display: flex; align-items: flex-start; gap: 20px; }
    
    .cdp-avatar {
      width: 56px; height: 56px; border-radius: 50%;
      background: #f4f4f5; display: flex; align-items: center; justify-content: center;
      font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #09090b; flex-shrink: 0;
    }
    
    .cdp-name { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 700; color: #09090b; margin: 0 0 4px; letter-spacing: -0.5px; line-height: 1.1; }
    .cdp-custno { font-family: 'Courier New', monospace; font-size: 12px; color: #a1a1aa; margin: 0 0 12px; letter-spacing: 0.3px; }
    
    .cdp-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    
    .cdp-payterm {
      display: inline-block; padding: 3px 9px; border-radius: 6px;
      font-size: 11px; font-weight: 600; border: 1px solid; white-space: nowrap;
    }
    
    .cdp-status {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600;
    }
    .cdp-status-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
    .cdp-status.active { background: #dcfce7; color: #166534; }
    .cdp-status.active .cdp-status-dot { background: #16a34a; }
    .cdp-status.inactive { background: #fee2e2; color: #991b1b; }
    .cdp-status.inactive .cdp-status-dot { background: #dc2626; }

    .cdp-address { font-size: 13.5px; color: #71717a; margin: 0; max-width: 500px; line-height: 1.5; }
    .cdp-stamp { font-size: 11px; color: #a1a1aa; font-family: 'Courier New', monospace; margin: 8px 0 0; }

    .cdp-card { background: white; border: 1px solid #e4e4e7; border-radius: 14px; overflow: hidden; }
    .cdp-card-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #f4f4f5; background: #fafafa; }
    .cdp-card-title { font-size: 13px; font-weight: 600; color: #09090b; }
    .cdp-card-sub { font-size: 12px; color: #a1a1aa; }

    .cdp-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .cdp-table thead { background: #fafafa; }
    .cdp-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 1px solid #f4f4f5; white-space: nowrap; }
    .cdp-table td { padding: 12px 16px; border-bottom: 1px solid #f4f4f5; color: #09090b; vertical-align: middle; }
    .cdp-table tr:last-child td { border-bottom: none; }
    .cdp-table tbody tr { transition: background 0.1s ease; cursor: pointer; }
    .cdp-table tbody tr:hover td { background: #fafafa; }
    .cdp-table tbody tr.selected td { background: #f4f4f5; }

    .cdp-mono { font-family: 'Courier New', monospace; font-size: 12px; color: #71717a; letter-spacing: 0.3px; }
    .cdp-empty { text-align: center; padding: 64px 24px; color: #a1a1aa; font-size: 13.5px; }
    
    .cdp-view-btn { font-size: 12px; color: #09090b; background: none; border: none; cursor: pointer; padding: 0; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; transition: opacity 0.15s ease; font-family: 'DM Sans', sans-serif;}
    .cdp-view-btn:hover { opacity: 0.7; }

    /* Modal Styles */
    .sd-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; backdrop-filter: blur(2px); }
    .sd-box { background: white; border-radius: 14px; border: 1px solid #e4e4e7; width: 100%; max-width: 600px; overflow: hidden; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); font-family: 'DM Sans', sans-serif; }
    .sd-header { padding: 18px 24px; border-bottom: 1px solid #f4f4f5; display: flex; justify-content: space-between; align-items: flex-start; background: #fafafa; flex-shrink: 0; }
    .sd-header-left { display: flex; flex-direction: column; gap: 4px; }
    .sd-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: #09090b; margin: 0; }
    .sd-subtitle { font-size: 12px; color: #a1a1aa; font-family: 'Courier New', monospace; }
    .sd-close { background: none; border: none; font-size: 20px; color: #a1a1aa; cursor: pointer; padding: 0; line-height: 1; transition: color 0.15s ease; }
    .sd-close:hover { color: #09090b; }
    .sd-body { overflow-y: auto; flex: 1; }
    .sd-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .sd-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #a1a1aa; border-bottom: 1px solid #f4f4f5; text-transform: uppercase; letter-spacing: 0.6px; background: #fafafa; position: sticky; top: 0; }
    .sd-table td { padding: 12px 16px; border-bottom: 1px solid #f4f4f5; color: #09090b; vertical-align: middle; }
    .sd-table tr:last-child td { border-bottom: none; }
    .sd-unit { display: inline-block; padding: 3px 9px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #f4f4f5; color: #3f3f46; border: 1px solid #e4e4e7; }
    .sd-footer { padding: 14px 24px; border-top: 1px solid #f4f4f5; background: #fafafa; display: flex; justify-content: flex-end; flex-shrink: 0; }
    .sd-close-btn { height: 38px; padding: 0 16px; border-radius: 9px; border: 1px solid #e4e4e7; background: white; color: #09090b; font-size: 13.5px; font-weight: 500; cursor: pointer; transition: background 0.15s ease; font-family: 'DM Sans', sans-serif; }
    .sd-close-btn:hover { background: #f4f4f5; }

    /* Skeleton Loading Overlay */
    @keyframes cdp-shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
    .cdp-skel { height: 13px; border-radius: 6px; background: linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%); background-size: 600px 100%; animation: cdp-shimmer 1.4s infinite; }

    @media (max-width: 700px) { .cdp-profile-left { flex-direction: column; align-items: flex-start; width: 100%; gap: 16px; } }
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
      <div className={`cdp-root ${mounted ? 'mounted' : ''}`}>
        <div style={{ textAlign: 'center', padding: '80px', color: '#a1a1aa', fontFamily: "'DM Sans', sans-serif" }}>
          Loading customer details…
        </div>
      </div>
    </>
  )

  if (error) return (
    <>
      <style>{css}</style>
      <div className={`cdp-root ${mounted ? 'mounted' : ''}`}>
        <div style={{ textAlign: 'center', padding: '80px', color: '#dc2626', fontFamily: "'DM Sans', sans-serif" }}>
          {error}
        </div>
      </div>
    </>
  )

  const pt = customer?.payterm ? PAYTERM_COLOR[customer.payterm] || { bg: '#f4f4f5', color: '#3f3f46', border: '#e4e4e7' } : {};
  const isActive = customer?.record_status === 'ACTIVE';

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
                <div style={{ padding: '40px 24px' }}>
                  <div className="cdp-skel" style={{ width: '100%', marginBottom: '16px', height: '24px' }}></div>
                  <div className="cdp-skel" style={{ width: '80%', marginBottom: '16px', height: '24px' }}></div>
                  <div className="cdp-skel" style={{ width: '90%', height: '24px' }}></div>
                </div>
              ) : !detail || detail.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa', fontSize: '13.5px' }}>
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
                        <td className="cdp-mono">{d.product?.prodcode}</td>
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

      <div className={`cdp-root ${mounted ? 'mounted' : ''}`}>
        {/* Back button */}
        <button className="cdp-back" onClick={() => navigate('/customers')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
             <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back to Customers
        </button>

        {/* Customer Profile Card */}
        {customer && (
          <div className="cdp-profile-card">
            <div className="cdp-profile-left">
              <div className="cdp-avatar">{getInitials(customer.custname)}</div>
              <div>
                <h1 className="cdp-name">{customer.custname}</h1>
                <p className="cdp-custno">{customer.custno}</p>
                <div className="cdp-meta">
                  <span 
                    className="cdp-payterm"
                    style={{ background: pt.bg, color: pt.color, borderColor: pt.border }}
                  >
                    {customer.payterm}
                  </span>
                  <span className={`cdp-status ${isActive ? 'active' : 'inactive'}`}>
                    <span className="cdp-status-dot" />
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {customer.address && <p className="cdp-address">{customer.address}</p>}
                {showStamp && customer.stamp && (
                  <p className="cdp-stamp">Stamp: {customer.stamp}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sales History Panel */}
        <div className="cdp-card" style={{ gridColumn: '1 / -1' }}>
          <div className="cdp-card-header">
            <span className="cdp-card-title">Sales History</span>
            {!salesLoading && (
              <span className="cdp-card-sub">
                {sales.length} transaction{sales.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {salesLoading ? (
            <div style={{ padding: '20px' }}>
              <div className="cdp-skel" style={{ width: '100%', marginBottom: '16px', height: '32px' }}></div>
              <div className="cdp-skel" style={{ width: '100%', marginBottom: '16px', height: '32px' }}></div>
              <div className="cdp-skel" style={{ width: '100%', height: '32px' }}></div>
            </div>
          ) : sales.length === 0 ? (
            <div className="cdp-empty">
              <p>No sales transactions found for this customer.</p>
            </div>
          ) : (
            <table className="cdp-table">
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
                    key={s.transno}
                    className={selectedTrans === s.transno ? 'selected' : ''}
                    onClick={() => handleSelectTransaction(s.transno)}
                  >
                    <td className="cdp-mono">{s.transno}</td>
                    <td>{s.salesdate}</td>
                    <td className="cdp-mono">{s.empno}</td>
                    <td>
                      <button className="cdp-view-btn">
                        View items
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </>
  )
}