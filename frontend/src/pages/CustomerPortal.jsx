import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import InvoiceReceiptModal from '../components/InvoiceReceiptModal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Repeat, FileText, CreditCard, Eye, ShieldCheck, Calendar, DollarSign } from 'lucide-react';

const CustomerPortal = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const [subsRes, invsRes, paysRes] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/invoices'),
        api.get('/payments')
      ]);
      setSubscriptions(subsRes.data);
      setInvoices(invsRes.data);
      setPayments(paysRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
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

  return (
    <div>
      <Header
        title="Customer Self-Service Portal"
        subtitle={`Welcome back, ${user?.full_name || 'Client'}. Manage your account subscriptions and statements.`}
      />

      <div className="content-body">
        {/* Account Info Banner */}
        <div style={{ background: 'var(--midnight-ink)', color: '#fff', padding: '28px 32px', borderRadius: 8, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="mono-tag" style={{ color: 'var(--electric-lime)' }}>CLIENT ACCOUNT ACTIVE</div>
            <h2 style={{ color: '#fff', fontSize: '1.8rem', marginTop: 4 }}>{user?.full_name}</h2>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', marginTop: 2 }}>{user?.email}</div>
          </div>
          <div style={{ display: 'flex', gap: 24, textAlign: 'right' }}>
            <div>
              <div className="mono-tag" style={{ color: 'rgba(255,255,255,0.5)' }}>ACTIVE PLANS</div>
              <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--electric-lime)' }}>
                {subscriptions.filter(s => s.status === 'active').length}
              </div>
            </div>
            <div>
              <div className="mono-tag" style={{ color: 'rgba(255,255,255,0.5)' }}>TOTAL PAID</div>
              <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
                ${payments.reduce((acc, p) => acc + p.amount, 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Active Subscriptions Grid */}
        <div className="editorial-card">
          <div className="card-header-clean">
            <h3 className="card-title">My Subscriptions</h3>
            <span className="mono-tag">CURRENT CONTRACTS</span>
          </div>

          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-500)' }}>Loading subscriptions...</div>
          ) : subscriptions.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-500)' }}>No subscriptions assigned.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {subscriptions.map((s) => (
                <div key={s.id} style={{ border: 'var(--border-subtle)', borderRadius: 6, padding: 18, background: 'var(--warm-ivory-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 700 }}>{s.subscription_number}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--midnight-ink)' }}>{s.plan_name}</div>
                  <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, margin: '8px 0', color: 'var(--cobalt-blue)' }}>
                    ${Number(s.amount).toFixed(2)}
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-500)', fontWeight: 400 }}>/{s.billing_interval}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-500)' }}>
                    Next Billing: <strong>{s.next_billing_date || 'N/A'}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoices Table */}
        <div className="editorial-card">
          <div className="card-header-clean">
            <h3 className="card-title">Invoices & Statements</h3>
            <span className="mono-tag">BILLING HISTORY</span>
          </div>

          <div className="table-container">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Total</th>
                  <th>Amount Paid</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: 24, color: 'var(--ink-500)' }}>No invoices issued yet.</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-mono" style={{ fontWeight: 700 }}>{inv.invoice_number}</td>
                      <td>{inv.issue_date}</td>
                      <td>{inv.due_date}</td>
                      <td className="table-currency">${Number(inv.total_amount).toFixed(2)}</td>
                      <td className="table-currency" style={{ color: '#2F6B12' }}>${Number(inv.amount_paid).toFixed(2)}</td>
                      <td className="table-currency" style={{ color: inv.balance_due > 0 ? 'var(--alert-red)' : 'var(--ink-500)', fontWeight: 700 }}>
                        ${Number(inv.balance_due).toFixed(2)}
                      </td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openReceipt(inv)}
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments Table */}
        <div className="editorial-card">
          <div className="card-header-clean">
            <h3 className="card-title">Settlement Records</h3>
            <span className="mono-tag">CLEARED PAYMENTS</span>
          </div>

          <div className="table-container">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: 24, color: 'var(--ink-500)' }}>No payment records found.</td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono" style={{ fontWeight: 700 }}>{p.payment_number}</td>
                      <td className="font-mono">{p.invoice_number}</td>
                      <td>{p.payment_date}</td>
                      <td>
                        <span className="mono-tag" style={{ background: 'var(--warm-ivory)', padding: '2px 6px', borderRadius: 4 }}>
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--ink-500)' }}>{p.reference || '—'}</td>
                      <td className="table-currency" style={{ color: '#2F6B12', fontWeight: 700 }}>
                        +${Number(p.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <InvoiceReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
};

export default CustomerPortal;
