import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import InvoiceReceiptModal from '../components/InvoiceReceiptModal';
import api from '../services/api';
import { Plus, Eye, CreditCard, CheckCircle, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toast, setToast] = useState('');
  const { isStaff, isCustomer } = useAuth();

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'Credit Card',
    reference: '',
    notes: ''
  });

  const [manualForm, setManualForm] = useState({
    customer_id: '',
    subtotal: '',
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    discount_id: '',
    tax_rate: 0.10,
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, custRes, discRes] = await Promise.all([
        api.get('/invoices'),
        isStaff ? api.get('/customers') : Promise.resolve({ data: [] }),
        isStaff ? api.get('/discounts') : Promise.resolve({ data: [] })
      ]);
      setInvoices(invRes.data);
      setCustomers(custRes.data);
      setDiscounts(discRes.data);
      if (custRes.data.length > 0 && !manualForm.customer_id) {
        setManualForm(f => ({ ...f, customer_id: custRes.data[0].id }));
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

  const openReceipt = async (inv) => {
    try {
      const res = await api.get(`/invoices/${inv.id}`);
      setSelectedInvoice(res.data);
      setIsReceiptOpen(true);
    } catch (err) {
      alert('Unable to load invoice receipt.');
    }
  };

  const openPaymentModal = (inv) => {
    setSelectedInvoice(inv);
    setPaymentForm({
      amount: inv.balance_due,
      payment_method: 'Credit Card',
      reference: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: `Settlement for ${inv.invoice_number}`
    });
    setIsPayModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        invoice_id: selectedInvoice.id,
        amount: parseFloat(paymentForm.amount) || 0,
        payment_method: paymentForm.payment_method,
        reference: paymentForm.reference,
        notes: paymentForm.notes
      };

      await api.post('/payments', payload);
      setToast(`Payment of $${payload.amount.toFixed(2)} recorded successfully.`);
      setIsPayModalOpen(false);
      fetchData();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to record payment.');
    }
  };

  const handleCreateManual = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        customer_id: parseInt(manualForm.customer_id),
        subtotal: parseFloat(manualForm.subtotal) || 0,
        due_date: manualForm.due_date,
        discount_id: manualForm.discount_id ? parseInt(manualForm.discount_id) : null,
        tax_rate: parseFloat(manualForm.tax_rate) || 0.10,
        notes: manualForm.notes
      };

      await api.post('/invoices', payload);
      setToast('Invoice created.');
      setIsCreateModalOpen(false);
      fetchData();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create invoice.');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/invoices/${id}/status`, { status: newStatus });
      setToast(`Invoice marked as ${newStatus.toUpperCase()}.`);
      fetchData();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update invoice status.');
    }
  };

  return (
    <div>
      <Header
        title={isCustomer ? 'My Invoices' : 'Invoices'}
        subtitle={isCustomer ? 'Review your billing statements and payment receipts' : 'Manage accounts receivable, tax calculations and invoice ledgers'}
        actionButton={
          isStaff && (
            <button type="button" className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} />
              <span>Create Manual Invoice</span>
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
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Total Invoiced</th>
                <th>Paid</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: 32 }}>Loading invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: 32, color: 'var(--ink-500)' }}>
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isOverdue = inv.status !== 'paid' && new Date(inv.due_date) < new Date();
                  return (
                    <tr key={inv.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileText size={14} color="var(--ink-500)" />
                          <span className="font-mono" style={{ fontWeight: 700 }}>{inv.invoice_number}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{inv.customer_name}</div>
                        {inv.subscription_number && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--ink-500)' }}>
                            {inv.subscription_number}
                          </div>
                        )}
                      </td>
                      <td>{inv.issue_date}</td>
                      <td>
                        <span style={{ color: isOverdue ? 'var(--alert-red)' : 'inherit', fontWeight: isOverdue ? 700 : 400 }}>
                          {inv.due_date} {isOverdue ? '(Overdue)' : ''}
                        </span>
                      </td>
                      <td className="table-currency" style={{ fontWeight: 700 }}>
                        ${Number(inv.total_amount).toFixed(2)}
                      </td>
                      <td className="table-currency" style={{ color: '#2F6B12' }}>
                        ${Number(inv.amount_paid).toFixed(2)}
                      </td>
                      <td className="table-currency" style={{ color: inv.balance_due > 0 ? 'var(--alert-red)' : 'var(--ink-500)', fontWeight: 700 }}>
                        ${Number(inv.balance_due).toFixed(2)}
                      </td>
                      <td>
                        <StatusBadge status={isOverdue ? 'overdue' : inv.status} />
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openReceipt(inv)}
                            title="View Printable Receipt"
                          >
                            <Eye size={14} />
                            <span>Receipt</span>
                          </button>

                          {isStaff && inv.balance_due > 0.01 && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => openPaymentModal(inv)}
                              title="Record Payment"
                            >
                              <CreditCard size={14} />
                              <span>Record Pay</span>
                            </button>
                          )}

                          {isStaff && inv.status === 'draft' && (
                            <button
                              type="button"
                              className="btn btn-dark btn-sm"
                              onClick={() => handleStatusChange(inv.id, 'confirmed')}
                              title="Confirm Invoice"
                            >
                              <CheckCircle size={14} />
                              <span>Confirm</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      <InvoiceReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        invoice={selectedInvoice}
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Record Payment for ${selectedInvoice?.invoice_number}`}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsPayModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="pay-form" className="btn btn-primary">
              Confirm & Post Payment
            </button>
          </>
        }
      >
        <form id="pay-form" onSubmit={handleRecordPayment}>
          <div style={{ background: 'var(--warm-ivory-light)', padding: 16, borderRadius: 6, marginBottom: 20, border: 'var(--border-subtle)' }}>
            <div style={{ fontSize: '0.88rem' }}><strong>Billed To:</strong> {selectedInvoice?.customer_name}</div>
            <div style={{ fontSize: '0.88rem', marginTop: 4 }}><strong>Total Invoiced:</strong> ${Number(selectedInvoice?.total_amount || 0).toFixed(2)}</div>
            <div style={{ fontSize: '0.88rem', marginTop: 4, color: 'var(--alert-red)' }}>
              <strong>Outstanding Balance:</strong> ${Number(selectedInvoice?.balance_due || 0).toFixed(2)}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Amount ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                required
                max={selectedInvoice?.balance_due}
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="form-select"
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer (ACH/Wire)</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Transaction Reference #</label>
            <input
              type="text"
              className="form-input"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
              placeholder="e.g. wire_tx_89324"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Payment Notes</label>
            <input
              type="text"
              className="form-input"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Create Manual Invoice Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Manual Ad-Hoc Invoice"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="manual-inv-form" className="btn btn-primary">
              Create Invoice
            </button>
          </>
        }
      >
        <form id="manual-inv-form" onSubmit={handleCreateManual}>
          <div className="form-group">
            <label className="form-label">Customer</label>
            <select
              className="form-select"
              required
              value={manualForm.customer_id}
              onChange={(e) => setManualForm({ ...manualForm, customer_id: e.target.value })}
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Subtotal Amount ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                required
                value={manualForm.subtotal}
                onChange={(e) => setManualForm({ ...manualForm, subtotal: e.target.value })}
                placeholder="250.00"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                required
                value={manualForm.due_date}
                onChange={(e) => setManualForm({ ...manualForm, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Promotional Discount</label>
              <select
                className="form-select"
                value={manualForm.discount_id}
                onChange={(e) => setManualForm({ ...manualForm, discount_id: e.target.value })}
              >
                <option value="">None</option>
                {discounts.filter(d => d.is_active).map((d) => (
                  <option key={d.id} value={d.id}>{d.code} ({d.discount_type === 'percentage' ? `${d.value}%` : `$${d.value}`})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tax Rate</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={manualForm.tax_rate}
                onChange={(e) => setManualForm({ ...manualForm, tax_rate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Notes</label>
            <input
              type="text"
              className="form-input"
              value={manualForm.notes}
              onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
              placeholder="e.g. Custom consulting services"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Invoices;
