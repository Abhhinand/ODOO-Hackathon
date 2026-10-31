import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import api from '../services/api';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [toast, setToast] = useState('');
  const { isStaff, isAdmin } = useAuth();

  const [form, setForm] = useState({
    product_id: '',
    name: '',
    billing_interval: 'monthly',
    price: '',
    description: '',
    is_active: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, prodsRes] = await Promise.all([
        api.get('/plans'),
        api.get('/products')
      ]);
      setPlans(plansRes.data);
      setProducts(prodsRes.data);
      if (prodsRes.data.length > 0 && !form.product_id) {
        setForm(f => ({ ...f, product_id: prodsRes.data[0].id }));
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

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm({
      product_id: products.length > 0 ? products[0].id : '',
      name: '',
      billing_interval: 'monthly',
      price: '',
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingPlan(p);
    setForm({
      product_id: p.product_id,
      name: p.name,
      billing_interval: p.billing_interval,
      price: p.price,
      description: p.description || '',
      is_active: p.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        product_id: parseInt(form.product_id),
        name: form.name,
        billing_interval: form.billing_interval,
        price: parseFloat(form.price) || 0,
        description: form.description,
        is_active: form.is_active
      };

      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, payload);
        setToast('Plan updated successfully.');
      } else {
        await api.post('/plans', payload);
        setToast('Plan created successfully.');
      }
      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save plan.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      await api.delete(`/plans/${id}`);
      setToast('Plan deleted.');
      fetchData();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete plan.');
    }
  };

  return (
    <div>
      <Header
        title="Subscription Plans"
        subtitle="Configure recurring tiers, billing cadences and rate schedules"
        actionButton={
          isStaff && (
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={16} />
              <span>Create Plan</span>
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
                <th>Plan Name</th>
                <th>Base Product</th>
                <th>Interval</th>
                <th>Recurring Price</th>
                <th>Active Subscribers</th>
                <th>Status</th>
                {isStaff && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 32 }}>Loading plans...</td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--ink-500)' }}>
                    No subscription plans configured yet.
                  </td>
                </tr>
              ) : (
                plans.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--cobalt-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Calendar size={16} color="var(--cobalt-blue)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          {p.description && <div style={{ fontSize: '0.78rem', color: 'var(--ink-500)' }}>{p.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="mono-tag" style={{ background: 'var(--warm-ivory)', padding: '2px 8px', borderRadius: 4 }}>
                        {p.product_name}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-draft" style={{ textTransform: 'capitalize' }}>
                        {p.billing_interval}
                      </span>
                    </td>
                    <td className="table-currency" style={{ fontSize: '1rem', color: 'var(--midnight-ink)' }}>
                      ${Number(p.price).toFixed(2)}
                      <span style={{ fontSize: '0.75rem', color: 'var(--ink-500)', fontWeight: 400 }}>
                        /{p.billing_interval === 'yearly' ? 'yr' : 'mo'}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono">{p.active_subscriptions_count || 0} active</span>
                    </td>
                    <td>
                      <span className={`badge ${p.is_active ? 'badge-active' : 'badge-closed'}`}>
                        {p.is_active ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    {isStaff && (
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditModal(p)}
                            title="Edit Plan"
                          >
                            <Edit2 size={14} />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--alert-red)' }}
                              onClick={() => handleDelete(p.id)}
                              title="Delete Plan"
                            >
                              <Trash2 size={14} />
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

      {/* Add / Edit Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="plan-form" className="btn btn-primary">
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </button>
          </>
        }
      >
        <form id="plan-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Base Product</label>
            <select
              className="form-select"
              required
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
            >
              <option value="">Select a product...</option>
              {products.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name} (${prod.sales_price})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Plan Display Name</label>
            <input
              type="text"
              className="form-input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Enterprise Tier - Annual"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Billing Interval</label>
              <select
                className="form-select"
                value={form.billing_interval}
                onChange={(e) => setForm({ ...form, billing_interval: e.target.value })}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Plan Recurring Price ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="99.00"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={form.is_active ? 'true' : 'false'}
              onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
            >
              <option value="true">Active</option>
              <option value="false">Archived</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Plan Highlights / Terms</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Billed annually with 15% discount. Includes unlimited seats."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Plans;
