import React from "react";

export default function LevelsSection({ brand, levels }) {
  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14 fade-on-scroll">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Niveles <span style={{ color: brand.accent }}>Educativos</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Una propuesta formativa integral para acompañar el crecimiento académico y personal.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {levels.map((n, i) => (
            <div key={n.title} className="fade-on-scroll" style={{ transitionDelay: `${i * 120}ms` }}>
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition border border-gray-100">
                <div
                  className="w-12 h-12 rounded-xl mb-4"
                  style={{ background: `linear-gradient(135deg, ${brand.gradientFrom}, ${brand.gradientTo})` }}
                />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{n.title}</h3>
                <p className="text-gray-600 leading-relaxed">{n.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
