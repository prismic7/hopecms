import { useState, useEffect } from 'react'
import { getProducts, getPriceHistory } from '../services/salesProductService'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedProd, setSelectedProd] = useState(null)
  const [priceHist, setPriceHist] = useState([])
  const [priceLoading, setPriceLoading] = useState(false)

  const css = `
    .pp-page { padding: 28px 32px; max-width: 1100px; margin: 0 auto; font-family: sans-serif; }
    .pp-topbar { margin-bottom: 24px; }
    .pp-title { font-size: 22px; font-weight: 600; margin: 0 0 4px; color: #111827; }
    .pp-sub { font-size: 13px; color: #6b7280; margin: 0; }
    .pp-notice { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; font-size: 13px; color: #166534; }
    .pp-controls { margin-bottom: 20px; }
    .pp-search { width: 100%; box-sizing: border-box; padding: 9px 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #111827; outline: none; }
    .pp-search:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .pp-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
    .pp-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .pp-card-header { padding: 14px 18px; border-bottom: 1px solid #f3f4f6; background: #f9fafb; }
    .pp-card-title { font-size: 13px; font-weight: 600; color: #374151; margin: 0; }
    .pp-card-sub { font-size: 12px; color: #9ca3af; margin: 2px 0 0; }
    .pp-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .pp-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #f3f4f6; text-transform: uppercase; letter-spacing: 0.05em; background: #f9fafb; white-space: nowrap; }
    .pp-table td { padding: 11px 14px; border-bottom: 1px solid #f9fafb; color: #111827; vertical-align: middle; }
    .pp-table tr:last-child td { border-bottom: none; }
    .pp-table tbody tr { cursor: pointer; }
    .pp-table tbody tr:hover td { background: #eff6ff; }
    .pp-table tbody tr.selected td { background: #dbeafe; }
    .pp-mono { font-family: monospace; font-size: 12px; color: #6b7280; }
    .pp-unit { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
    .pp-price { font-weight: 600; color: #111827; }
    .pp-empty { text-align: center; padding: 48px 24px; color: #9ca3af; font-size: 13px; }
    .pp-hist-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 18px; border-bottom: 1px solid #f9fafb; font-size: 13px; }
    .pp-hist-row:last-child { border-bottom: none; }
    .pp-hist-latest { background: #f0fdf4; }
    .pp-hist-date { color: #6b7280; font-family: monospace; font-size: 12px; }
    .pp-hist-price { font-weight: 600; color: #111827; }
    .pp-hist-tag { font-size: 10px; font-weight: 600; background: #d1fae5; color: #065f46; padding: 1px 6px; border-radius: 9999px; margin-left: 6px; }
    @media (max-width: 700px) { .pp-layout { grid-template-columns: 1fr; } }
  `

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await getProducts()
        setProducts(data || [])
      } catch {
        setError('Failed to load products.')
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
      <style>{css}</style>
      <div className="pp-page">

        <div className="pp-topbar">
          <h1 className="pp-title">Products</h1>
          <p className="pp-sub">52 products — read only, no add, edit, or delete</p>
        </div>

        <div className="pp-notice">
          View-only — sales, products, and price history cannot be modified by any user type.
        </div>

        <div className="pp-controls">
          <input
            className="pp-search"
            type="text"
            placeholder="Search by product code or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="pp-layout">
          {/* Left — product list */}
          <div className="pp-card">
            <div className="pp-card-header">
              <p className="pp-card-title">Product Catalogue</p>
              {!loading && (
                <p className="pp-card-sub">{filtered.length} of {products.length} products</p>
              )}
            </div>
            {loading ? (
              <div className="pp-empty">Loading products…</div>
            ) : error ? (
              <div className="pp-empty" style={{ color: '#dc2626' }}>{error}</div>
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

          {/* Right — price history */}
          <div className="pp-card">
            <div className="pp-card-header">
              <p className="pp-card-title">
                Price History {selectedProd ? `— ${selectedProd.prodcode}` : ''}
              </p>
              {selectedProd && (
                <p className="pp-card-sub">{selectedProd.description}</p>
              )}
            </div>
            {!selectedProd ? (
              <div className="pp-empty">Select a product to view its price history.</div>
            ) : priceLoading ? (
              <div className="pp-empty">Loading…</div>
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