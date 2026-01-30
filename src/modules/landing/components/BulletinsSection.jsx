import React from "react";
import Card from "../../../components/ui/Card";

export default function BulletinsSection({ brand, bulletins }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14 fade-on-scroll">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Boletines <span style={{ color: brand.accent }}>Informativos</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Documentos informativos del año 2026 para conocer nuestra propuesta y lineamientos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {bulletins.map((b, i) => (
            <div key={b.title} className="fade-on-scroll" style={{ transitionDelay: `${i * 120}ms` }}>
              <Card className="p-8 rounded-2xl shadow-lg hover:shadow-2xl transition border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{b.title}</h3>
                <p className="text-gray-600 mb-6">Disponible en PDF. Se abrirá en una nueva pestaña.</p>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-full font-semibold transition"
                  style={{ backgroundColor: brand.accent, color: "#fff" }}
                >
                  Abrir PDF
                </a>
              </Card>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Nota: Cimas tendrá su web en otro dominio y no se incluye en esta landing.
        </p>
      </div>
    </section>
  );
}
