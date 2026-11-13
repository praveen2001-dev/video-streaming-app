import React from 'react';

export const StatusBadge = ({ status }) => {
  return (
    <span className={`status-badge ${status || 'pending'}`}>
      ● {status || 'pending'}
    </span>
  );
};
