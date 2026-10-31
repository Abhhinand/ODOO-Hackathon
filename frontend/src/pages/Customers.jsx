import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';
import { Plus, Eye, User, Mail, Phone, Building, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [toast, setToast] = useState('');
  const { isStaff } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    create_portal_account: true,
    password: 'Customer123!'
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCreateModal = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      create_portal_account: true,
      password: 'Customer123!'
    });
    setIsCreateModalOpen(true);
  };

  const handleViewDetail = async (c) => {
    try {
      const res = await api.get(`/customers/${c.id}`);
      setSelectedCustomer(res.data);
      setDetailModalOpen(true);
    } catch (err) {
      alert('Unable to load customer details.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', form);
      setToast('Customer registered successfully with portal access.');
      setIsCreateModalOpen(false);
      fetchCustomers();
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to register customer.');
    }
  };

  return (
    <div>
      <Header
        title="Customers"
        subtitle="Manage client accounts, contract associations and billing ledgers"
        actionButton={
          isStaff && (
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={16} />
              <span>Register Customer</span>
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
                <th>Customer / Company</th>
                <th>Contact Details</th>
                <th>Active Subscriptions</th>
                <th>Total Invoiced</th>
                <th>Outstanding Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 32 }}>Loading customer records...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 32, color: 'var(--ink-500)' }}>
                    No customers registered. Click "Register Customer" to add one.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 17, background: 'var(--cobalt-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          {c.company && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Building size={12} />
                              <span>{c.company}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{c.email}</div>
                      {c.phone && <div style={{ fontSize: '0.78rem', color: 'var(--ink-500)' }}>{c.phone}</div>}
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 600 }}>
                        {c.active_subscriptions_count || 0} active
                      </span>
                    </td>
                    <td className="table-currency">
                      ${Number(c.total_invoiced || 0).toFixed(2)}
                    </td>
                    <td className="table-currency" style={{ color: c.outstanding_balance > 0 ? 'var(--alert-red)' : 'var(--ink-500)', fontWeight: 700 }}>
                      ${Number(c.outstanding_balance || 0).toFixed(2)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleViewDetail(c)}
                        title="View Customer Profile"
                      >
                        <Eye size={14} />
                        <span>Profile & History</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Customer Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register New Customer"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="customer-form" className="btn btn-primary">
              Register Customer
            </button>
          </>
        }
      >
        <form id="customer-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name / Primary Contact</label>
            <input
              type="text"
              className="form-input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Eleanor Vance"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input
                type="email"
                className="form-input"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="eleanor@vance-corp.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 019-2834"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Company / Entity Name</label>
            <input
              type="text"
              className="form-input"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Vance Corporation LLC"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Billing Address</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="100 Financial Plaza, Floor 14, Chicago, IL"
            />
          </div>

          <div style={{ background: 'var(--warm-ivory-light)', padding: 14, borderRadius: 6, border: 'var(--border-subtle)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.create_portal_account}
                onChange={(e) => setForm({ ...form, create_portal_account: e.target.checked })}
              />
              <span>Generate Customer Self-Service Portal Login</span>
            </label>
            {form.create_portal_account && (
              <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--ink-500)' }}>
                Initial portal password: <code>{form.password}</code>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Customer 360 Detail View Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Customer Profile — ${selectedCustomer?.name}`}
        maxWidth="740px"
      >
        {selectedCustomer && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              <div style={{ background: 'var(--warm-ivory-light)', padding: 16, borderRadius: 6, border: 'var(--border-subtle)' }}>
                <div className="mono-tag">TOTAL INVOICED</div>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 4 }}>
                  ${Number(selectedCustomer.total_invoiced || 0).toFixed(2)}
                </div>
              </div>
              <div style={{ background: 'var(--warm-ivory-light)', padding: 16, borderRadius: 6, border: 'var(--border-subtle)' }}>
                <div className="mono-tag">OUTSTANDING BALANCE</div>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 4, color: selectedCustomer.outstanding_balance > 0 ? 'var(--alert-red)' : '#2F6B12' }}>
                  ${Number(selectedCustomer.outstanding_balance || 0).toFixed(2)}
                </div>
              </div>
              <div style={{ background: 'var(--warm-ivory-light)', padding: 16, borderRadius: 6, border: 'var(--border-subtle)' }}>
                <div className="mono-tag">ACTIVE CONTRACTS</div>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 4 }}>
                  {selectedCustomer.active_subscriptions_count || 0}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: '1rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Associated Subscriptions</span>
              </h4>
              {selectedCustomer.subscriptions?.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--ink-500)', fontStyle: 'italic' }}>No subscriptions found.</div>
              ) : (
                <div className="table-container" style={{ marginBottom: 16 }}>
                  <table className="clean-table">
                    <thead>
                      <tr>
                        <th>Subscription #</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Amount</th>
                        <th>Start Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.subscriptions.map((s) => (
                        <tr key={s.id}>
                          <td className="font-mono" style={{ fontWeight: 600 }}>{s.subscription_number}</td>
                          <td>{s.plan_name}</td>
                          <td><StatusBadge status={s.status} /></td>
                          <td className="table-currency">${Number(s.amount).toFixed(2)}</td>
                          <td>{s.start_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: 10 }}>Associated Invoices</h4>
              {selectedCustomer.invoices?.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--ink-500)', fontStyle: 'italic' }}>No invoices found.</div>
              ) : (
                <div className="table-container">
                  <table className="clean-table">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Due Date</th>
                        <th>Total</th>
                        <th>Balance Due</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="font-mono" style={{ fontWeight: 600 }}>{inv.invoice_number}</td>
                          <td>{inv.due_date}</td>
                          <td className="table-currency">${Number(inv.total_amount).toFixed(2)}</td>
                          <td className="table-currency" style={{ color: inv.balance_due > 0 ? 'var(--alert-red)' : 'inherit' }}>
                            ${Number(inv.balance_due).toFixed(2)}
                          </td>
                          <td><StatusBadge status={inv.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Customers;
