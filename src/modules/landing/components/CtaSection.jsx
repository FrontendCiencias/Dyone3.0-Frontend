import React from "react";

export default function CtaSection({ brand, content, onCTA }) {
  return (
    <section
      className="py-20"
      style={{ background: `linear-gradient(135deg, ${brand.gradientFrom}, ${brand.gradientVia}, ${brand.gradientTo})` }}
    >
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">{content.title}</h2>
        <p className="text-lg md:text-xl text-white/90 mb-10">{content.subtitle}</p>

        <button
          type="button"
          onClick={onCTA}
          className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 rounded-full text-lg font-semibold shadow-2xl transition transform hover:scale-[1.03]"
          style={{ backgroundColor: "#fff", color: brand.accent }}
        >
          {content.button}
        </button>
      </div>
    </section>
  );
}
