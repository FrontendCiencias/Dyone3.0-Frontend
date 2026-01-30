import React from 'react';

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="text-sm">
      <ol className="list-reset flex text-gray-500">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center">
            {idx !== 0 && <span className="mx-2">/</span>}
            {item.to ? (
              <a href={item.to} className="hover:underline text-blue-600">
                {item.label}
              </a>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}