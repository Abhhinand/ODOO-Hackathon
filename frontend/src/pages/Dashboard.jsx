import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../services/api';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  DollarSign, 
  Repeat, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle2, 
  Layers,
  ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/summary');
      setData(res.data);
    } catch (err) {
      setError('Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div>
        <Header title="Overview" subtitle="Real-time financial performance" />
        <div className="content-body">
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-500)', fontFamily: 'var(--font-mono)' }}>
            Loading metrics...
          </div>
        </div>
      </div>
    );
  }

  const { summary, revenue_pulse, subscription_distribution, needs_attention } = data || {};

  return (
    <div>
      <Header 
        title="Overview" 
        subtitle="Revenue in Motion — Operational and Financial Pulse" 
      />

      <div className="content-body">
        {/* Prominent Editorial Hero Banner */}
        <div 
          style={{ 
            background: 'var(--midnight-ink)', 
            color: '#fff', 
            borderRadius: 8, 
            padding: '36px 40px', 
            marginBottom: 28,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <div>
            <div className="mono-tag" style={{ color: 'var(--electric-lime)' }}>BRIGHTLOOP REVENUE ENGINE</div>
            <h2 style={{ color: '#fff', fontSize: '2.4rem', marginTop: 8, marginBottom: 8 }}>
              Revenue in Motion.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 540, fontSize: '0.95rem' }}>
              Real-time subscription billing telemetry, invoice settlement and cash flow health.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 32, textAlign: 'right' }}>
            <div>
              <div className="mono-tag" style={{ color: 'rgba(255,255,255,0.5)' }}>ESTIMATED MRR</div>
              <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--electric-lime)' }}>
                ${Number(summary?.mrr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Monthly Recurring Revenue</div>
            </div>
            <div>
              <div className="mono-tag" style={{ color: 'rgba(255,255,255,0.5)' }}>TOTAL COLLECTED</div>
              <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>
                ${Number(summary?.total_revenue_collected || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Lifetime Cash Settled</div>
            </div>
          </div>
        </div>

        {/* C. Financial Summary (4 essential indicators) */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">
              <span>Active Subscriptions</span>
              <Repeat size={16} color="var(--cobalt-blue)" />
            </div>
            <div className="kpi-value">{summary?.active_subscriptions || 0}</div>
            <div className="kpi-subtext">Across {summary?.total_customers || 0} active customers</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">
              <span>Collected This Month</span>
              <DollarSign size={16} color="var(--electric-lime)" />
            </div>
            <div className="kpi-value">
              ${Number(summary?.collected_this_month || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="kpi-subtext">Settled payments in current cycle</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">
              <span>Outstanding Amount</span>
              <Clock size={16} color="var(--amber)" />
            </div>
            <div className="kpi-value" style={{ color: summary?.outstanding_amount > 0 ? 'var(--amber)' : 'inherit' }}>
              ${Number(summary?.outstanding_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="kpi-subtext">Pending receivables balance</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">
              <span>Pending Invoices</span>
              <AlertTriangle size={16} color="var(--alert-red)" />
            </div>
            <div className="kpi-value">{summary?.pending_invoices || 0}</div>
            <div className="kpi-subtext">Awaiting payment settlement</div>
          </div>
        </div>

        {/* Charts & Subscriptions Breakdown Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 28 }}>
          {/* D. Revenue Pulse Chart */}
          <div className="editorial-card" style={{ marginBottom: 0 }}>
            <div className="card-header-clean">
              <div>
                <h3 className="card-title">Revenue Pulse</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-500)' }}>Monthly collected revenue vs. total invoiced</div>
              </div>
              <div className="mono-tag">LAST 6 CYCLES</div>
            </div>

            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue_pulse} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C5F36A" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#C5F36A" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5376E5" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#5376E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="period" stroke="#64748B" fontSize={11} fontFamily="JetBrains Mono" />
                  <YAxis stroke="#64748B" fontSize={11} fontFamily="JetBrains Mono" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#111A27', 
                      borderColor: '#111A27', 
                      color: '#fff', 
                      borderRadius: 6,
                      fontFamily: 'JetBrains Mono',
                      fontSize: 12
                    }}
                  />
                  <Area type="monotone" dataKey="invoiced" stroke="#5376E5" fillOpacity={1} fill="url(#colorInv)" name="Invoiced ($)" />
                  <Area type="monotone" dataKey="revenue" stroke="#89BD28" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Collected ($)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* E. Subscription Overview Breakdown */}
          <div className="editorial-card" style={{ marginBottom: 0 }}>
            <div className="card-header-clean">
              <div>
                <h3 className="card-title">Subscriptions</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-500)' }}>Status distribution</div>
              </div>
              <Layers size={18} color="var(--ink-500)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {subscription_distribution?.map((item, idx) => {
                const total = subscription_distribution.reduce((acc, curr) => acc + curr.count, 0) || 1;
                const pct = Math.round((item.count / total) * 100);

                let barColor = 'var(--ink-300)';
                if (item.status === 'Active') barColor = 'var(--electric-lime)';
                else if (item.status === 'Confirmed') barColor = 'var(--cobalt-blue)';
                else if (item.status === 'Closed') barColor = 'var(--alert-red)';

                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{item.status}</span>
                      <span className="font-mono">{item.count} ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--ink-100)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: 'var(--border-subtle)' }}>
              <button 
                type="button" 
                className="btn btn-outline btn-sm" 
                style={{ width: '100%' }}
                onClick={() => navigate('/subscriptions')}
              >
                <span>Manage All Subscriptions</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* F. Needs Attention Section */}
        <div className="editorial-card">
          <div className="card-header-clean">
            <div>
              <h3 className="card-title">Needs Attention</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-500)' }}>Critical financial exceptions and upcoming renewals</div>
            </div>
            <div className="mono-tag" style={{ color: 'var(--alert-red)' }}>HIGH PRIORITY</div>
          </div>

          {(!needs_attention || needs_attention.length === 0) ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ink-500)' }}>
              <CheckCircle2 size={32} color="var(--electric-lime)" style={{ margin: '0 auto 8px' }} />
              <div>All invoices are settled and accounts in good standing.</div>
            </div>
          ) : (
            <div>
              {needs_attention.map((item, index) => {
                let cardClass = 'attention-card pending';
                if (item.type === 'overdue_invoice') cardClass = 'attention-card overdue';
                else if (item.type === 'upcoming_renewal') cardClass = 'attention-card renewal';

                return (
                  <div key={index} className={cardClass}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.title}</div>
                      <div style={{ color: 'var(--ink-500)', fontSize: '0.82rem', marginTop: 2 }}>{item.description}</div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 16 }}>
                      {item.amount !== null && (
                        <div>
                          <div className="mono-tag" style={{ fontSize: '0.65rem' }}>BALANCE</div>
                          <div className="font-mono" style={{ fontWeight: 700, fontSize: '1rem', color: item.type === 'overdue_invoice' ? 'var(--alert-red)' : 'var(--midnight-ink)' }}>
                            ${Number(item.amount).toFixed(2)}
                          </div>
                        </div>
                      )}
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          if (item.type.includes('invoice')) navigate('/invoices');
                          else navigate('/subscriptions');
                        }}
                      >
                        <span>Resolve</span>
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
