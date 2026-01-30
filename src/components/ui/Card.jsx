import React from 'react';

export default function Card({ children, className = '', style = {} }) {
  return (
    <div className={`bg-white shadow-md rounded-lg p-4 ${className}`} style={style}>
      {children}
    </div>
  );
}