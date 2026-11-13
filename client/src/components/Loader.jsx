import React from 'react';

export const Loader = ({ message = 'Loading...' }) => {
  return (
    <div className="loader-wrapper">
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{message}</p>
    </div>
  );
};
