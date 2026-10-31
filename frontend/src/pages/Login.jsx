import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, ShieldCheck, User, Users } from 'lucide-react';
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

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);
    login(demoEmail, demoPassword)
      .then((loggedUser) => {
        if (loggedUser.role === 'customer') {
          navigate('/portal');
        } else {
          navigate('/dashboard');
        }
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Login failed.');
        setLoading(false);
      });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--midnight-ink)', color: '#fff' }}>
      {/* Left Editorial Branding Showcase */}
      <div style={{ flex: 1, padding: '60px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--electric-lime)', color: 'var(--midnight-ink)', padding: '4px 10px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700 }}>
            <Zap size={14} fill="#111A27" />
            <span>HACKATHON MVP EDITION</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: '3.6rem', marginTop: 32, lineHeight: 1.05 }}>
            Revenue<br />in Motion.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.15rem', marginTop: 24, maxWidth: 460 }}>
            Brightloop connects customer management, subscription lifecycles, precision invoicing and payment recording in one unified Swiss-inspired platform.
          </p>
        </div>

        <div>
          <div className="mono-tag" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
            INSTANT EVALUATION LOGINS
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
              onClick={() => handleQuickLogin('admin@brightloop.com', 'admin123')}
            >
              <ShieldCheck size={14} color="#C5F36A" />
              <span>Admin Demo</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
              onClick={() => handleQuickLogin('staff@brightloop.com', 'staff123')}
            >
              <Users size={14} color="#5376E5" />
              <span>Staff Demo</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
              onClick={() => handleQuickLogin('acme@brightloop.com', 'customer123')}
            >
              <User size={14} color="#E8A45D" />
              <span>Customer Demo</span>
            </button>
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
              <input
                type="email"
                className="form-input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@brightloop.com"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'rgba(255,255,255,0.15)' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 28 }}>
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Password</label>
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
