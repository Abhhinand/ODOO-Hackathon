import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'customer') {
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--midnight-ink)', color: '#fff' }}>
      {/* Left Editorial Branding Showcase */}
      <div style={{ flex: 1, padding: '60px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--electric-lime)', color: 'var(--midnight-ink)', padding: '4px 10px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700 }}>
            <Zap size={14} fill="#111A27" />
            <span>BRIGHTLOOP PLATFORM</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: '3.6rem', marginTop: 32, lineHeight: 1.05 }}>
            Revenue<br />in Motion.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.15rem', marginTop: 24, maxWidth: 460 }}>
            Brightloop connects customer management, subscription lifecycles, precision invoicing and payment recording in one unified Swiss-inspired platform.
          </p>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24 }}>
          <div className="mono-tag" style={{ color: 'var(--electric-lime)', marginBottom: 8 }}>
            ENTERPRISE SECURITY
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Role-based authentication powered by encrypted JWT tokens and bcrypt password security.
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div style={{ width: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <h2 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: 8 }}>Sign In</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', marginBottom: 28 }}>
            Enter your credentials to access Brightloop.
          </p>

          {error && (
            <div className="toast-banner toast-error" style={{ marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'rgba(255,255,255,0.15)' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 28 }}>
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'rgba(255,255,255,0.15)' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
              disabled={loading}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Brightloop'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
