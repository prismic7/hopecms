import { useState } from 'react'
import { addCustomer } from '../services/customerService'
import { useAuth } from '../context/AuthContext'

export default function AddCustomerModal({ onClose, onSuccess }) {
  const { currentUser } = useAuth()
  const [form, setForm] = useState({ custno: '', custname: '', address: '', payterm: 'COD' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState(null)

  const css = `
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
    .modal-box { background: #fff; border-radius: 14px; border: 1px solid #e5e7eb; width: 100%; max-width: 480px; overflow: hidden; }
    .modal-header { padding: 20px 24px 16px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
    .modal-title { font-size: 16px; font-weight: 600; color: #111827; margin: 0; }
    .modal-close { background: none; border: none; font-size: 20px; color: #9ca3af; cursor: pointer; padding: 0; line-height: 1; }
    .modal-close:hover { color: #374151; }
    .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid #f3f4f6; display: flex; justify-content: flex-end; gap: 10px; background: #f9fafb; }
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 13px; font-weight: 600; color: #374151; }
    .field-input { height: 40px; padding: 0 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; color: #111827; outline: none; width: 100%; box-sizing: border-box; }
    .field-input:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .field-input.has-error { border-color: #f87171; box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }
    .field-select { height: 40px; padding: 0 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; color: #111827; outline: none; width: 100%; box-sizing: border-box; background: #fff; }
    .field-select:focus { border-color: #93c5fd; }
    .field-error { font-size: 12px; color: #dc2626; margin: 0; }
    .server-error { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #9f1239; }
    .btn-cancel { padding: 8px 18px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; color: #374151; font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-cancel:hover { background: #f9fafb; }
    .btn-submit { padding: 8px 18px; border-radius: 8px; border: none; background: #1d4ed8; color: #fff; font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-submit:hover { background: #1e40af; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  `

  function validate(f) {
    const e = {}
    if (!f.custno.trim()) e.custno = 'Customer number is required.'
    else if (!/^C\d{4}$/.test(f.custno.trim())) e.custno = 'Format must be C0001–C9999.'
    if (!f.custname.trim()) e.custname = 'Customer name is required.'
    else if (f.custname.trim().length > 20) e.custname = 'Max 20 characters.'
    if (f.address.length > 50) e.address = 'Max 50 characters.'
    return e
  }

  function handleChange(field, value) {
    const next = { ...form, [field]: value }
    setForm(next)
    if (touched[field]) setErrors(validate(next))
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors(validate(form))
  }

  async function handleSubmit() {
    const allTouched = { custno: true, custname: true, address: true, payterm: true }
    setTouched(allTouched)
    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setLoading(true)
    setServerError(null)
    try {
      await addCustomer(
        { custno: form.custno.trim(), custname: form.custname.trim(), address: form.address.trim(), payterm: form.payterm },
        currentUser?.userid || currentUser?.id
      )
      onSuccess()
      onClose()
    } catch (err) {
      setServerError(err.message || 'Failed to add customer. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-box">
          <div className="modal-header">
            <h2 className="modal-title">Add Customer</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
            {serverError && <div className="server-error">{serverError}</div>}

            <div className="field-group">
              <label className="field-label">Customer No. <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                className={`field-input ${errors.custno && touched.custno ? 'has-error' : ''}`}
                type="text"
                placeholder="C0001"
                value={form.custno}
                onChange={(e) => handleChange('custno', e.target.value)}
                onBlur={() => handleBlur('custno')}
              />
              {errors.custno && touched.custno && <p className="field-error">{errors.custno}</p>}
            </div>

            <div className="field-group">
              <label className="field-label">Customer Name <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                className={`field-input ${errors.custname && touched.custname ? 'has-error' : ''}`}
                type="text"
                placeholder="e.g. Globus Medical, Inc"
                value={form.custname}
                onChange={(e) => handleChange('custname', e.target.value)}
                onBlur={() => handleBlur('custname')}
              />
              {errors.custname && touched.custname && <p className="field-error">{errors.custname}</p>}
            </div>

            <div className="field-group">
              <label className="field-label">Address</label>
              <input
                className={`field-input ${errors.address && touched.address ? 'has-error' : ''}`}
                type="text"
                placeholder="Full address"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                onBlur={() => handleBlur('address')}
              />
              {errors.address && touched.address && <p className="field-error">{errors.address}</p>}
            </div>

            <div className="field-group">
              <label className="field-label">Payment Term <span style={{ color: '#dc2626' }}>*</span></label>
              <select
                className="field-select"
                value={form.payterm}
                onChange={(e) => handleChange('payterm', e.target.value)}
              >
                <option value="COD">COD — Cash on Delivery</option>
                <option value="30D">30D — 30-day terms</option>
                <option value="45D">45D — 45-day terms</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving…' : 'Add Customer'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}