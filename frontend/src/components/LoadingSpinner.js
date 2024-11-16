import React from 'react';

const LoadingSpinner = ({ message }) => (
  <div className="flex justify-center items-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-2">{message}</span>
  </div>
);

export default LoadingSpinner;