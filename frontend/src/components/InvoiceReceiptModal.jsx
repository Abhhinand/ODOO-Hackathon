import React from 'react';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import { Printer, Zap } from 'lucide-react';

const InvoiceReceiptModal = ({ isOpen, onClose, invoice }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice Summary & Receipt" maxWidth="640px">
      <div className="invoice-receipt">
        <div className="invoice-receipt-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '1.2rem' }}>
              <Zap size={20} color="#111A27" fill="#111A27" />
              <span>BRIGHTLOOP</span>
            </div>
            <div className="brand-tagline" style={{ color: 'var(--ink-500)', marginTop: 2 }}>
              Revenue in Motion
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {invoice.invoice_number}
            </div>
            <div style={{ marginTop: 4 }}>
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div>
            <div className="mono-tag" style={{ marginBottom: 4 }}>BILLED TO:</div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{invoice.customer_name || invoice.customer?.name}</div>
            <div style={{ color: 'var(--ink-500)', fontSize: '0.85rem' }}>{invoice.customer_email || invoice.customer?.email}</div>
            {invoice.customer?.company && (
              <div style={{ color: 'var(--ink-500)', fontSize: '0.85rem' }}>{invoice.customer.company}</div>
            )}
            {invoice.customer?.address && (
              <div style={{ color: 'var(--ink-500)', fontSize: '0.82rem', marginTop: 4 }}>{invoice.customer.address}</div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono-tag" style={{ marginBottom: 4 }}>BILLING DETAILS:</div>
            <div style={{ fontSize: '0.85rem' }}><strong>Issue Date:</strong> {invoice.issue_date}</div>
            <div style={{ fontSize: '0.85rem' }}><strong>Due Date:</strong> {invoice.due_date}</div>
            {invoice.subscription_number && (
              <div style={{ fontSize: '0.85rem', marginTop: 4 }}>
                <strong>Subscription:</strong> {invoice.subscription_number}
              </div>
            )}
            {invoice.billing_period_start && invoice.billing_period_end && (
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-500)', marginTop: 4 }}>
                Period: {invoice.billing_period_start} – {invoice.billing_period_end}
              </div>
            )}
          </div>
        </div>

        <div className="invoice-summary-box">
          <div className="invoice-summary-row">
            <span>Subtotal</span>
            <span className="font-mono">${Number(invoice.subtotal).toFixed(2)}</span>
          </div>
          {invoice.discount_amount > 0 && (
            <div className="invoice-summary-row" style={{ color: '#2F6B12' }}>
              <span>Discount {invoice.discount_code ? `(${invoice.discount_code})` : ''}</span>
              <span className="font-mono">-${Number(invoice.discount_amount).toFixed(2)}</span>
            </div>
          )}
          <div className="invoice-summary-row">
            <span>Tax ({Number(invoice.tax_rate * 100).toFixed(0)}%)</span>
            <span className="font-mono">${Number(invoice.tax_amount).toFixed(2)}</span>
          </div>
          <div className="invoice-summary-row invoice-summary-total">
            <span>Total Invoiced</span>
            <span className="font-mono" style={{ color: 'var(--midnight-ink)' }}>
              ${Number(invoice.total_amount).toFixed(2)}
            </span>
          </div>
          <div className="invoice-summary-row" style={{ paddingTop: 6 }}>
            <span>Amount Paid</span>
            <span className="font-mono" style={{ color: '#2F6B12', fontWeight: 600 }}>
              ${Number(invoice.amount_paid).toFixed(2)}
            </span>
          </div>
          <div className="invoice-summary-row" style={{ paddingTop: 4 }}>
            <span style={{ fontWeight: 600 }}>Balance Due</span>
            <span className="font-mono" style={{ color: invoice.balance_due > 0 ? 'var(--alert-red)' : 'var(--ink-500)', fontWeight: 700 }}>
              ${Number(invoice.balance_due).toFixed(2)}
            </span>
          </div>
        </div>

        {invoice.notes && (
          <div style={{ marginTop: 20, padding: 12, background: 'var(--warm-ivory-light)', borderRadius: 6, fontSize: '0.82rem', color: 'var(--ink-500)' }}>
            <strong>Notes:</strong> {invoice.notes}
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-dark" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceReceiptModal;
