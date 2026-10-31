import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import api from '../services/api';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [toast, setToast] = useState('');
  const { isStaff, isAdmin } = useAuth();

  const [form, setForm] = useState({
    name: '',
    type: 'Service',
    sales_price: '',
    cost_price: '',
    notes: '',
    is_active: true
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      type: 'Service',
      sales_price: '',
      cost_price: '',
      notes: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      type: p.type,
      sales_price: p.sales_price,
      cost_price: p.cost_price,
      notes: p.notes || '',
      is_active: p.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        type: form.type,
        sales_price: parseFloat(form.sales_price) || 0,
        cost_price: parseFloat(form.cost_price) || 0,
        notes: form.notes,
        is_active: form.is_active
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        setToast('Product updated successfully.');
      } else {
        await api.post('/products', payload);
        setToast('Product created successfully.');
      }
      setIsModalOpen(false);
      fetchProducts();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save product.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setToast('Product deleted.');
      fetchProducts();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete product.');
    }
  };

  return (
    <div>
      <Header
        title="Products"
        subtitle="Manage product catalogue, cost structure and billing models"
        actionButton={
          isStaff && (
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={16} />
              <span>Add Product</span>
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
                <th>Product Name</th>
                <th>Type</th>
                <th>Sales Price</th>
                <th>Cost Price</th>
                <th>Margin</th>
                <th>Active Plans</th>
                <th>Status</th>
                {isStaff && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: 32 }}>Loading products...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: 32, color: 'var(--ink-500)' }}>
                    No products added yet. Click "Add Product" to create one.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const margin = p.sales_price - p.cost_price;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--warm-ivory)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={16} color="var(--midnight-ink)" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            {p.notes && <div style={{ fontSize: '0.78rem', color: 'var(--ink-500)' }}>{p.notes}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="mono-tag" style={{ background: 'var(--ink-100)', padding: '2px 6px', borderRadius: 3 }}>
                          {p.type}
                        </span>
                      </td>
                      <td className="table-currency">${Number(p.sales_price).toFixed(2)}</td>
                      <td className="table-currency" style={{ color: 'var(--ink-500)' }}>${Number(p.cost_price).toFixed(2)}</td>
                      <td className="table-currency" style={{ color: margin >= 0 ? '#2F6B12' : 'var(--alert-red)' }}>
                        ${margin.toFixed(2)}
                      </td>
                      <td>
                        <span className="font-mono">{p.plans_count || 0} plans</span>
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
                              title="Edit Product"
                            >
                              <Edit2 size={14} />
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ color: 'var(--alert-red)' }}
                                onClick={() => handleDelete(p.id)}
                                title="Delete Product"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="product-form" className="btn btn-primary">
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              className="form-input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Cloud Security Suite"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Product Type</label>
              <select
                className="form-select"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="Service">Service</option>
                <option value="Software">Software</option>
                <option value="Digital">Digital</option>
                <option value="Physical">Physical</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sales Price ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                required
                value={form.sales_price}
                onChange={(e) => setForm({ ...form, sales_price: e.target.value })}
                placeholder="149.00"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cost Price ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                placeholder="25.00"
              />
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
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Description / Notes</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Details regarding features, delivery and terms..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;
