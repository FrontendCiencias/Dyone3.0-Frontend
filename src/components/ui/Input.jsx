import React from 'react';

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  className = '',
  name,
}) {
  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm"
      />
    </div>
  );
}