import React from "react";
import Card from "../../../components/ui/Card";

export default function SedesSection({ brand, sedes, brands }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14 fade-on-scroll">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Nuestras <span style={{ color: brand.accent }}>Sedes</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Contamos con dos sedes en El Pedregal (Majes), ofreciendo Inicial, Primaria y Secundaria.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {sedes.map((s, i) => {
            const sedeBrand = brands[s.brandKey];
            return (
              <div key={s.name} className="fade-on-scroll" style={{ transitionDelay: `${i * 120}ms` }}>
                <Card className="p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold"
                        style={{ background: sedeBrand.accentSoft, color: sedeBrand.accent }}
                      >
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: sedeBrand.accent }} />
                        {s.tag}
                      </div>

                      <h3 className="text-2xl font-bold text-gray-900 mt-4">{s.name}</h3>
                      <p className="text-gray-600 mt-2 leading-relaxed">{s.address}</p>
                    </div>

                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${sedeBrand.gradientFrom}, ${sedeBrand.gradientTo})` }}
                      aria-hidden="true"
                    >
                      <span className="text-white text-xl font-bold">{s.brandKey === "CIENCIAS" ? "C" : "CA"}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700">Inicial</span>
                    <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700">Primaria</span>
                    <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700">Secundaria</span>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
