import { useState, useEffect } from 'react'
import { getProducts, getPriceHistory } from '../services/salesProductService'
import { useToast } from '../components/Toast'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedProd, setSelectedProd] = useState(null)
  const [priceHist, setPriceHist] = useState([])
  const [priceLoading, setPriceLoading] = useState(false)
  const { showToast, ToastComponent } = useToast()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

    .pp-root {
      font-family: 'DM Sans', system-ui, sans-serif;
      padding: 28px 32px;
      max-width: 1200px;
      margin: 0 auto;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.45s cubic-bezier(0.22,1,0.36,1),
                  transform 0.45s cubic-bezier(0.22,1,0.36,1);
    }
    .pp-root.mounted { opacity: 1; transform: translateY(0); }

    /* ── Header ──────────────────────────────────────────── */
    .pp-header {
      display: flex;
      flex-direction: column;
      margin-bottom: 20px;
    }
    .pp-title {
      font-family: 'Syne', sans-serif;
      font-size: 26px; font-weight: 700;
      color: #09090b; letter-spacing: -0.5px;
      line-height: 1.1; margin: 0 0 6px;
    }
    .pp-subtitle { font-size: 13px; color: #71717a; font-weight: 400; margin: 0; }

    .pp-notice {
      background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px;
      padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #71717a;
      display: flex; align-items: center; gap: 8px;
    }

    /* ── Toolbar ─────────────────────────────────────────── */
    .pp-toolbar {
      display: flex; gap: 10px;
      margin-bottom: 24px;
      align-items: center;
    }
    .pp-search-wrap {
      position: relative; flex: 1; max-width: 400px;
    }
    .pp-search-icon {
      position: absolute; left: 12px; top: 50%;
      transform: translateY(-50%);
      color: #a1a1aa; pointer-events: none;
      display: flex; align-items: center;
    }
    .pp-search {
      width: 100%; height: 38px;
      padding: 0 12px 0 36px;
      background: white;
      border: 1px solid #e4e4e7;
      border-radius: 9px;
      font-size: 13.5px; color: #09090b;
      outline: none;
      font-family: 'DM Sans', sans-serif;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      box-sizing: border-box;
    }
    .pp-search::placeholder { color: #a1a1aa; }
    .pp-search:focus {
      border-color: #09090b;
      box-shadow: 0 0 0 3px rgba(9,9,11,0.06);
    }

    /* ── Layout ──────────────────────────────────────────── */
    .pp-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; align-items: start; }

    .pp-card {
      background: white;
      border: 1px solid #e4e4e7;
      border-radius: 14px;
      overflow: hidden;
    }
    .pp-card-header {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-bottom: 1px solid #f4f4f5;
      background: #fafafa;
    }
    .pp-card-title { font-size: 13px; font-weight: 600; color: #09090b; margin: 0; }
    .pp-card-sub { font-size: 12px; color: #a1a1aa; margin: 0; }

    /* ── Table ───────────────────────────────────────────── */
    .pp-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .pp-table thead { background: #fafafa; }
    .pp-table th {
      padding: 10px 16px;
      text-align: left;
      font-size: 11px; font-weight: 600;
      color: #a1a1aa;
      text-transform: uppercase; letter-spacing: 0.6px;
      border-bottom: 1px solid #f4f4f5;
      white-space: nowrap;
    }
    .pp-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f4f4f5;
      color: #09090b; vertical-align: middle;
    }
    .pp-table tr:last-child td { border-bottom: none; }
    .pp-table tbody tr { transition: background 0.1s ease; cursor: pointer; }
    .pp-table tbody tr:hover td { background: #fafafa; }
    .pp-table tbody tr.selected td { background: #f4f4f5; }

    .pp-mono { font-family: 'Courier New', monospace; font-size: 12px; color: #71717a; letter-spacing: 0.3px; }
    .pp-unit {
      display: inline-block; padding: 3px 9px; border-radius: 6px;
      font-size: 11px; font-weight: 600; background: #f4f4f5; color: #3f3f46; border: 1px solid #e4e4e7;
    }
    
    /* ── History List ────────────────────────────────────── */
    .pp-hist-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 20px; border-bottom: 1px solid #f4f4f5; font-size: 13.5px;
    }
    .pp-hist-row:last-child { border-bottom: none; }
    .pp-hist-latest { background: #fafafa; }
    .pp-hist-date { color: #71717a; font-family: 'Courier New', monospace; font-size: 12px; display: flex; align-items: center; gap: 8px; }
    .pp-hist-price { font-weight: 600; color: #09090b; }
    .pp-hist-tag {
      font-size: 10px; font-weight: 700; background: #dcfce7; color: #166534;
      padding: 2px 8px; border-radius: 100px; text-transform: uppercase;
    }

    .pp-empty { text-align: center; padding: 64px 24px; color: #a1a1aa; font-size: 13.5px; }

    @keyframes pp-shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
    .pp-skel { height: 13px; border-radius: 6px; background: linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%); background-size: 600px 100%; animation: pp-shimmer 1.4s infinite; }

    @media (max-width: 850px) { .pp-layout { grid-template-columns: 1fr; } }
  `

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await getProducts()
        setProducts(data || [])
      } catch {
        showToast('Failed to load products.', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  async function handleSelectProduct(prod) {
    setSelectedProd(prod)
    setPriceLoading(true)
    setPriceHist([])
    try {
      const data = await getPriceHistory(prod.prodcode)
      setPriceHist(data || [])
    } catch {
      setPriceHist([])
    } finally {
      setPriceLoading(false)
    }
  }

  const filtered = products.filter((p) =>
    p.prodcode?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {ToastComponent}
      <style>{css}</style>
      <div className={`pp-root ${mounted ? 'mounted' : ''}`}>

        <div className="pp-header">
          <h1 className="pp-title">Products</h1>
          <p className="pp-subtitle">Manage product inventory and pricing history</p>
        </div>

        <div className="pp-notice">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
             <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          View-only — Product details and price history cannot be modified.
        </div>

        <div className="pp-toolbar">
          <div className="pp-search-wrap">
            <span className="pp-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              className="pp-search"
              type="text"
              placeholder="Search by product code or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="pp-layout">
          <div className="pp-card">
            <div className="pp-card-header">
              <p className="pp-card-title">Product Catalogue</p>
              {!loading && (
                <p className="pp-card-sub">{filtered.length} of {products.length} products</p>
              )}
            </div>
            {loading ? (
              <div style={{ padding: '24px' }}>
                <div className="pp-skel" style={{ width: '100%', marginBottom: '16px', height: '24px' }}></div>
                <div className="pp-skel" style={{ width: '100%', marginBottom: '16px', height: '24px' }}></div>
                <div className="pp-skel" style={{ width: '100%', height: '24px' }}></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="pp-empty">No products found.</div>
            ) : (
              <table className="pp-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.prodcode}
                      className={selectedProd?.prodcode === p.prodcode ? 'selected' : ''}
                      onClick={() => handleSelectProduct(p)}
                    >
                      <td className="pp-mono">{p.prodcode}</td>
                      <td style={{ fontWeight: 500 }}>{p.description}</td>
                      <td><span className="pp-unit">{p.unit}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="pp-card">
            <div className="pp-card-header">
              <p className="pp-card-title">
                Price History {selectedProd ? <span style={{color: '#a1a1aa', fontWeight: 400}}>— {selectedProd.prodcode}</span> : ''}
              </p>
            </div>
            {!selectedProd ? (
              <div className="pp-empty">Select a product to view its price history.</div>
            ) : priceLoading ? (
               <div style={{ padding: '24px' }}>
                <div className="pp-skel" style={{ width: '100%', marginBottom: '16px', height: '20px' }}></div>
                <div className="pp-skel" style={{ width: '100%', height: '20px' }}></div>
              </div>
            ) : priceHist.length === 0 ? (
              <div className="pp-empty">No price history found.</div>
            ) : (
              priceHist.map((ph, i) => (
                <div key={ph.effdate} className={`pp-hist-row ${i === 0 ? 'pp-hist-latest' : ''}`}>
                  <span className="pp-hist-date">
                    {ph.effdate}
                    {i === 0 && <span className="pp-hist-tag">current</span>}
                  </span>
                  <span className="pp-hist-price">
                    ₱{Number(ph.unitprice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </>
  )
}