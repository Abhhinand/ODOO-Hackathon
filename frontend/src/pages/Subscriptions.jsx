import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';
import { Plus, Check, Play, XCircle, FileText, Repeat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [selectedSubForInvoice, setSelectedSubForInvoice] = useState(null);
  const [toast, setToast] = useState('');
  const { isStaff } = useAuth();

  const [form, setForm] = useState({
    customer_id: '',
    plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
    amount: '',
    notes: ''
  });

  const [genForm, setGenForm] = useState({
    due_days: 14,
    discount_id: '',
    tax_rate: 0.10,
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subsRes, custRes, plansRes, discRes] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/customers'),
        api.get('/plans'),
        api.get('/discounts')
      ]);
      setSubscriptions(subsRes.data);
      setCustomers(custRes.data);
      setPlans(plansRes.data);
      setDiscounts(discRes.data);

      if (custRes.data.length > 0 && !form.customer_id) {
        setForm(f => ({ ...f, customer_id: custRes.data[0].id }));
      }
      if (plansRes.data.length > 0 && !form.plan_id) {
        setForm(f => ({ ...f, plan_id: plansRes.data[0].id, amount: plansRes.data[0].price }));
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

  const handlePlanChange = (planId) => {
    const selectedPlan = plans.find(p => p.id === parseInt(planId));
    setForm(f => ({
      ...f,
      plan_id: planId,
      amount: selectedPlan ? selectedPlan.price : f.amount
    }));
  };

  const openCreateModal = () => {
    const firstCust = customers.length > 0 ? customers[0].id : '';
    const firstPlan = plans.length > 0 ? plans[0] : null;
    setForm({
      customer_id: firstCust,
      plan_id: firstPlan ? firstPlan.id : '',
      start_date: new Date().toISOString().split('T')[0],
      amount: firstPlan ? firstPlan.price : '',
      notes: ''
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        customer_id: parseInt(form.customer_id),
        plan_id: parseInt(form.plan_id),
        start_date: form.start_date,
        amount: parseFloat(form.amount) || 0,
        notes: form.notes
      };
      await api.post('/subscriptions', payload);
      setToast('Subscription created in Draft status.');
      setIsCreateModalOpen(false);
      fetchData();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create subscription.');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/subscriptions/${id}/status`, { status: newStatus });
      setToast(`Subscription status updated to ${newStatus.toUpperCase()}.`);
      fetchData();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status.');
    }
  };

  const openGenerateInvoiceModal = (sub) => {
    setSelectedSubForInvoice(sub);
    setGenForm({
      due_days: 14,
      discount_id: '',
      tax_rate: 0.10,
      notes: `Subscription billing for ${sub.subscription_number}`
    });
    setIsGenModalOpen(true);
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        subscription_id: selectedSubForInvoice.id,
        due_days: parseInt(genForm.due_days) || 14,
        discount_id: genForm.discount_id ? parseInt(genForm.discount_id) : null,
        tax_rate: parseFloat(genForm.tax_rate) || 0.10,
        notes: genForm.notes
      };

      const res = await api.post('/invoices/generate', payload);
      setToast(`Invoice ${res.data.invoice_number} generated successfully!`);
      setIsGenModalOpen(false);
      fetchData();
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to generate invoice.');
    }
  };

  return (
    <div>
      <Header
        title="Subscriptions"
        subtitle="Manage recurring contract agreements, activation cycles and invoice triggers"
        actionButton={
          isStaff && (
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={16} />
              <span>New Subscription</span>
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
                <th>Subscription #</th>
                <th>Customer</th>
                <th>Plan & Cadence</th>
                <th>Contract Amount</th>
                <th>Start Date</th>
                <th>Next Billing Date</th>
                <th>Status</th>
                {isStaff && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: 32 }}>Loading subscriptions...</td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: 32, color: 'var(--ink-500)' }}>
                    No subscriptions found. Click "New Subscription" to create one.
                  </td>
                </tr>
              ) : (
                subscriptions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Repeat size={14} color="var(--ink-500)" />
                        <span className="font-mono" style={{ fontWeight: 700 }}>{s.subscription_number}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.customer_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--ink-500)' }}>{s.customer_email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.plan_name}</div>
                      <span className="mono-tag" style={{ textTransform: 'capitalize' }}>
                        {s.billing_interval}
                      </span>
                    </td>
                    <td className="table-currency" style={{ fontSize: '0.95rem' }}>
                      ${Number(s.amount).toFixed(2)}
                    </td>
                    <td>{s.start_date}</td>
                    <td>
                      <span className="font-mono" style={{ color: 'var(--ink-700)' }}>
                        {s.next_billing_date || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    {isStaff && (
                      <td>
                        <div className="table-actions">
                          {/* Lifecycle Workflow: Draft -> Confirmed -> Active -> Closed */}
                          {s.status === 'draft' && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--cobalt-blue)' }}
                              onClick={() => handleStatusChange(s.id, 'confirmed')}
                              title="Confirm Subscription"
                            >
                              <Check size={14} />
                              <span>Confirm</span>
                            </button>
                          )}

                          {s.status === 'confirmed' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleStatusChange(s.id, 'active')}
                              title="Activate Subscription"
                            >
                              <Play size={14} fill="currentColor" />
                              <span>Activate</span>
                            </button>
                          )}

                          {s.status === 'active' && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--alert-red)' }}
                              onClick={() => handleStatusChange(s.id, 'closed')}
                              title="Close Subscription"
                            >
                              <XCircle size={14} />
                              <span>Close</span>
                            </button>
                          )}

                          {/* Quick Invoice Trigger */}
                          {s.status !== 'closed' && (
                            <button
                              type="button"
                              className="btn btn-dark btn-sm"
                              onClick={() => openGenerateInvoiceModal(s)}
                              title="Generate Invoice for Period"
                            >
                              <FileText size={14} />
                              <span>Invoice</span>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Subscription Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Subscription Agreement"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="sub-form" className="btn btn-primary">
              Create Subscription
            </button>
          </>
        }
      >
        <form id="sub-form" onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Customer</label>
            <select
              className="form-select"
              required
              value={form.customer_id}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Subscription Plan</label>
            <select
              className="form-select"
              required
              value={form.plan_id}
              onChange={(e) => handlePlanChange(e.target.value)}
            >
              <option value="">Select plan...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.price}/{p.billing_interval} ({p.product_name})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                required
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Subscription Amount ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="149.00"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Contract Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Custom terms, SLA tier, onboarding notes..."
            />
          </div>
        </form>
      </Modal>

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={isGenModalOpen}
        onClose={() => setIsGenModalOpen(false)}
        title={`Generate Invoice for ${selectedSubForInvoice?.subscription_number}`}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsGenModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="gen-inv-form" className="btn btn-primary">
              Generate & Confirm Invoice
            </button>
          </>
        }
      >
        <form id="gen-inv-form" onSubmit={handleGenerateInvoice}>
          <div style={{ background: 'var(--warm-ivory-light)', padding: 16, borderRadius: 6, marginBottom: 20, border: 'var(--border-subtle)' }}>
            <div style={{ fontSize: '0.88rem' }}><strong>Customer:</strong> {selectedSubForInvoice?.customer_name}</div>
            <div style={{ fontSize: '0.88rem', marginTop: 4 }}><strong>Plan:</strong> {selectedSubForInvoice?.plan_name}</div>
            <div style={{ fontSize: '0.88rem', marginTop: 4 }}><strong>Amount:</strong> ${Number(selectedSubForInvoice?.amount || 0).toFixed(2)}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--ink-500)', marginTop: 4 }}>
              *Duplicate prevention will ensure this billing period cannot be invoiced twice.
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Due In (Days)</label>
              <input
                type="number"
                className="form-input"
                required
                value={genForm.due_days}
                onChange={(e) => setGenForm({ ...genForm, due_days: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tax Rate (e.g. 0.10 for 10%)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={genForm.tax_rate}
                onChange={(e) => setGenForm({ ...genForm, tax_rate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Apply Promotional Discount (Optional)</label>
            <select
              className="form-select"
              value={genForm.discount_id}
              onChange={(e) => setGenForm({ ...genForm, discount_id: e.target.value })}
            >
              <option value="">No discount applied</option>
              {discounts.filter(d => d.is_active).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} — {d.discount_type === 'percentage' ? `${d.value}% Off` : `$${d.value} Flat Off`}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Invoice Notes</label>
            <input
              type="text"
              className="form-input"
              value={genForm.notes}
              onChange={(e) => setGenForm({ ...genForm, notes: e.target.value })}
              placeholder="e.g. Standard recurring cycle"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Subscriptions;
