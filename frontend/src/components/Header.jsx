import React from 'react';
import { useAuth } from '../context/AuthContext';

const Header = ({ title, subtitle, actionButton }) => {
  const { user } = useAuth();
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="top-header">
      <div className="page-title-area">
        <h1>{title}</h1>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>

      <div className="header-actions">
        <div className="mono-tag" style={{ background: '#FAF9F5', padding: '6px 12px', borderRadius: 4, border: 'var(--border-subtle)' }}>
          {todayStr}
        </div>
        {actionButton}
      </div>
    </header>
  );
};

export default Header;
