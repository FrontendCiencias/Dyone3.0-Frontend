import React from 'react';

const Input = React.forwardRef(function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  className = '',
  name,
  ...rest
}, ref) {
  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        ref={ref}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...rest}
        className="px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm"
      />
    </div>
  );
});

export default Input;
