import React, { useContext } from 'react';
import { ThemeContext } from '../../config/theme';

export default function Button({
  children,
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  style = {},
}) {
  const { theme } = useContext(ThemeContext);
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={
        'px-4 py-2 rounded font-medium shadow focus:outline-none transition-colors ' +
        (disabled ? 'opacity-50 cursor-not-allowed ' : '') +
        className
      }
      style={{ backgroundColor: theme.primary, color: '#fff', ...style }}
    >
      {children}
    </button>
  );
}