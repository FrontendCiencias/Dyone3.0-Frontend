import React from "react";

function BrandPill({ label }) {
  return (
    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium">
      <span className="inline-block w-2.5 h-2.5 rounded-full bg-white/90" />
      <span>{label}</span>
    </div>
  );
}

function BrandSwitch({ brandKey, onSelectBrand }) {
  const handleCimas = () => {
    window.location.href = "https://www.cimasperu.edu.pe";
  };

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-full p-1 flex">
      <button
        type="button"
        onClick={() => onSelectBrand("CIENCIAS")}
        className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
          brandKey === "CIENCIAS" ? "bg-white text-gray-900" : "text-white hover:bg-white/10"
        }`}
      >
        Ciencias
      </button>

      <button
        type="button"
        onClick={() => onSelectBrand("APLICADAS")}
        className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
          brandKey === "APLICADAS" ? "bg-white text-gray-900" : "text-white hover:bg-white/10"
        }`}
      >
        Ciencias Aplicadas
      </button>

      <button
        type="button"
        onClick={handleCimas}
        className="px-4 py-2 rounded-full text-sm font-semibold transition text-white hover:bg-white/10"
        title="Ir a la web de Cimas"
      >
        Cimas
      </button>
    </div>
  );
}


export default function HeroSection({
  brand,
  brandKey,
  setBrandKey,
  scrollY,
  content,
  onPrimaryCta,
  secondaryCtaUrl,
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${brand.gradientFrom}, ${brand.gradientVia}, ${brand.gradientTo})`,
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-16 left-10 w-72 h-72 rounded-full blur-3xl"
          style={{ background: "rgba(255,255,255,0.14)", transform: `translateY(${scrollY * 0.45}px)` }}
        />
        <div
          className="absolute -bottom-20 right-10 w-96 h-96 rounded-full blur-3xl"
          style={{ background: "rgba(255,255,255,0.12)", transform: `translateY(${scrollY * -0.25}px)` }}
        />
        <div
          className="absolute top-40 right-1/3 w-56 h-56 rounded-full blur-3xl"
          style={{ background: "rgba(255,255,255,0.10)", transform: `translateY(${scrollY * 0.15}px)` }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <BrandPill label={brand.badge} />
            <BrandSwitch brandKey={brandKey} onSelectBrand={setBrandKey} />
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            {content.titleTop}
            <br />
            en{" "}
            <span className="bg-white/30 bg-clip-text text-transparent">{content.titleEmphasisA}</span> y{" "}
            <span className="bg-white/30 bg-clip-text text-transparent">{content.titleEmphasisB}</span>
          </h1>

          <p className="text-lg md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto">{content.subtitle}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Botón principal: click en TODO el recuadro */}
            <button
              type="button"
              onClick={onPrimaryCta}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-full text-lg font-semibold shadow-2xl transition transform hover:scale-[1.03]"
              style={{ backgroundColor: "#FFFFFF", color: brand.accent }}
            >
              {content.primaryCta}
            </button>

            {/* Botón secundario: link clickeable completo */}
            <a
              href={secondaryCtaUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-full text-lg font-semibold border border-white/40 text-white hover:bg-white/10 transition"
            >
              {content.secondaryCta}
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 80C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </div>
  );
}
