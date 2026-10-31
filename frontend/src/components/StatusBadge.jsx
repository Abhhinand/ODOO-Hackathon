import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const s = status.toLowerCase();

  let badgeClass = 'badge-draft';
  if (s === 'active' || s === 'paid') badgeClass = 'badge-active';
  else if (s === 'confirmed') badgeClass = 'badge-confirmed';
  else if (s === 'overdue') badgeClass = 'badge-overdue';
  else if (s === 'closed') badgeClass = 'badge-closed';

  return <span className={`badge ${badgeClass}`}>{status}</span>;
};

export default StatusBadge;
