import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import api from '../services/api';
import { Tag, Plus, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Discounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDisc, setEditingDisc] = useState(null);
  const [toast, setToast] = useState('');
  const { isStaff, isAdmin } = useAuth();

  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage',
    value: '',
    description: '',
    is_active: true
  });

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/discounts');
      setDiscounts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const openCreateModal = () => {
    setEditingDisc(null);
    setForm({
      code: '',
      discount_type: 'percentage',
      value: '',
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (d) => {
    setEditingDisc(d);
    setForm({
      code: d.code,
      discount_type: d.discount_type,
      value: d.value,
      description: d.description || '',
      is_active: d.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        discount_type: form.discount_type,
        value: parseFloat(form.value) || 0,
        description: form.description,
        is_active: form.is_active
      };

      if (editingDisc) {
        await api.put(`/discounts/${editingDisc.id}`, payload);
        setToast('Discount updated.');
      } else {
        await api.post('/discounts', payload);
        setToast('Discount coupon created.');
      }
      setIsModalOpen(false);
      fetchDiscounts();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save discount.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promotional discount?')) return;
    try {
      await api.delete(`/discounts/${id}`);
      setToast('Discount removed.');
      fetchDiscounts();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete discount.');
    }
  };

  return (
    <div>
      <Header
        title="Discounts & Promotions"
        subtitle="Configure fixed-value credits and percentage promotional codes"
        actionButton={
          isStaff && (
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={16} />
              <span>Create Discount</span>
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
                <th>Discount Code</th>
                <th>Type</th>
                <th>Value / Rate</th>
                <th>Description</th>
                <th>Redemptions</th>
                <th>Status</th>
                {isStaff && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 32 }}>Loading discounts...</td>
                </tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--ink-500)' }}>
                    No discount codes created yet.
                  </td>
                </tr>
              ) : (
                discounts.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag size={16} color="var(--midnight-ink)" />
                        <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
                          {d.code}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="mono-tag" style={{ background: 'var(--warm-ivory)', padding: '2px 8px', borderRadius: 4 }}>
                        {d.discount_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                      </span>
                    </td>
                    <td className="table-currency" style={{ fontSize: '1rem', color: '#2F6B12', fontWeight: 700 }}>
                      {d.discount_type === 'percentage' ? `${d.value}% Off` : `$${Number(d.value).toFixed(2)} Credit`}
                    </td>
                    <td>{d.description || '—'}</td>
                    <td>
                      <span className="font-mono">{d.times_used || 0} times</span>
                    </td>
                    <td>
                      <span className={`badge ${d.is_active ? 'badge-active' : 'badge-closed'}`}>
                        {d.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    {isStaff && (
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditModal(d)}
                            title="Edit Discount"
                          >
                            <Edit2 size={14} />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--alert-red)' }}
                              onClick={() => handleDelete(d.id)}
                              title="Delete Discount"
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

      {/* Add / Edit Discount Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDisc ? 'Edit Discount Code' : 'Create Promotional Discount'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="disc-form" className="btn btn-primary">
              {editingDisc ? 'Save Changes' : 'Create Coupon'}
            </button>
          </>
        }
      >
        <form id="disc-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Coupon Code (Uppercase)</label>
            <input
              type="text"
              className="form-input"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. FLASH25"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Discount Type</label>
              <select
                className="form-select"
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Dollar ($)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Discount Value</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                required
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.discount_type === 'percentage' ? '20' : '50.00'}
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
              <option value="false">Disabled</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Description / Promotion Terms</label>
            <input
              type="text"
              className="form-input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. 20% off first month invoice"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Discounts;
