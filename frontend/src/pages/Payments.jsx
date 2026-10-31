import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import api from '../services/api';
import { CreditCard, Plus, CheckCircle, ArrowDownLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState('');
  const { isStaff, isCustomer } = useAuth();

  const [form, setForm] = useState({
    invoice_id: '',
    amount: '',
    payment_method: 'Credit Card',
    reference: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payRes, invRes] = await Promise.all([
        api.get('/payments'),
        isStaff ? api.get('/invoices') : Promise.resolve({ data: [] })
      ]);
      setPayments(payRes.data);
      // Filter unpaid/partially paid invoices for recording new payment
      const pendingInvs = invRes.data.filter(i => i.balance_due > 0.01);
      setInvoices(pendingInvs);
      if (pendingInvs.length > 0 && !form.invoice_id) {
        setForm(f => ({ ...f, invoice_id: pendingInvs[0].id, amount: pendingInvs[0].balance_due }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openRecordModal = () => {
    const firstInv = invoices.length > 0 ? invoices[0] : null;
    setForm({
      invoice_id: firstInv ? firstInv.id : '',
      amount: firstInv ? firstInv.balance_due : '',
      payment_method: 'Credit Card',
      reference: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleInvoiceSelect = (invId) => {
    const sel = invoices.find(i => i.id === parseInt(invId));
    setForm(f => ({
      ...f,
      invoice_id: invId,
      amount: sel ? sel.balance_due : f.amount
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        invoice_id: parseInt(form.invoice_id),
        amount: parseFloat(form.amount) || 0,
        payment_method: form.payment_method,
        reference: form.reference,
        notes: form.notes
      };

      await api.post('/payments', payload);
      setToast('Payment recorded and ledger updated.');
      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to record payment.');
    }
  };

  return (
    <div>
      <Header
        title={isCustomer ? 'My Payments' : 'Payments'}
        subtitle={isCustomer ? 'Your historical settlement records and payment confirmations' : 'Record receivables, cash clearance and transaction reconciliations'}
        actionButton={
          isStaff && (
            <button type="button" className="btn btn-primary" onClick={openRecordModal}>
              <Plus size={16} />
              <span>Record Payment</span>
            </button>
          )
        }
      />

      <div className="content-body">
        {toast && <div className="toast-banner toast-success">{toast}</div>}

        <div className="table-container">
          <table className="clean-table">
            <thead>
              <tr>
                <th>Payment #</th>
                <th>Target Invoice</th>
                <th>Customer</th>
                <th>Date Settled</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Amount Received</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 32 }}>Loading payments...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--ink-500)' }}>
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ArrowDownLeft size={16} color="#2F6B12" />
                        <span className="font-mono" style={{ fontWeight: 700 }}>{p.payment_number}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono" style={{ color: 'var(--cobalt-blue)', fontWeight: 600 }}>
                        {p.invoice_number}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.customer_name}</td>
                    <td>{p.payment_date}</td>
                    <td>
                      <span className="mono-tag" style={{ background: 'var(--warm-ivory)', padding: '3px 8px', borderRadius: 4 }}>
                        {p.payment_method}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--ink-500)' }}>
                        {p.reference || '—'}
                      </span>
                    </td>
                    <td className="table-currency" style={{ fontSize: '1rem', color: '#2F6B12', fontWeight: 700 }}>
                      +${Number(p.amount).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Customer Payment"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="record-payment-form" className="btn btn-primary">
              Post Payment
            </button>
          </>
        }
      >
        <form id="record-payment-form" onSubmit={handleSubmit}>
          {invoices.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--ink-500)' }}>
              No outstanding unpaid invoices available to apply payments against.
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Select Unsettled Invoice</label>
                <select
                  className="form-select"
                  required
                  value={form.invoice_id}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                >
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} — {inv.customer_name} (Balance Due: ${inv.balance_due.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Payment Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-select"
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer (ACH/Wire)</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Transaction / Gateway Reference</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  placeholder="e.g. stripe_tx_1029384"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Internal Memo</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notes regarding wire or customer remittance advice..."
                />
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default Payments;
