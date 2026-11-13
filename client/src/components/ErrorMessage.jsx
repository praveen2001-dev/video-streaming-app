import React from 'react';

export const ErrorMessage = ({ message, onRetry }) => {
  if (!message) return null;

  return (
    <div className="error-banner">
      <span>⚠️ {message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            color: '#fff',
            textDecoration: 'underline',
            fontSize: '0.85rem',
            marginLeft: '12px',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
};
