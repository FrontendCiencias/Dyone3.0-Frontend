import React, { useContext } from 'react';
import { ThemeContext } from '../../config/theme';

export default function Badge({ children, className = '', style = {} }) {
  const { theme } = useContext(ThemeContext);
  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-semibold rounded ${className}`}
      style={{ backgroundColor: theme.primary, color: '#fff', ...style }}
    >
      {children}
    </span>
  );
}