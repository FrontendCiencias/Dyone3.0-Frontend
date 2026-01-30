import React from "react";

export default function FooterSection({ content }) {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h3 className="text-2xl font-bold mb-2">{content.title}</h3>
        <p className="text-gray-400">{content.subtitle}</p>
        <p className="text-gray-500 text-sm mt-6">{content.copyright}</p>
        <p className="text-gray-500 text-sm mt-3">{content.note}</p>
      </div>
    </footer>
  );
}
