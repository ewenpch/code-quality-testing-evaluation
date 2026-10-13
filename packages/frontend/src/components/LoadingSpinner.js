import React from 'react';

const LoadingSpinner = ({ label = 'Loading' }) => {
  return (
    <div aria-label={label} className="flex size-full items-center justify-center" role="status">
      <div aria-hidden="true" className="size-12 animate-spin rounded-full border-4 border-border border-t-info" />
    </div>
  );
};

export default LoadingSpinner;
