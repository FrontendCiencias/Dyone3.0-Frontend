import React from "react";
import { useNavigate } from "react-router-dom";

import landingContent from "../data/landing.content";
import { BRANDS } from "../data/brands";
import { SEDES } from "../data/sedes";

import { useBrand } from "../hooks/useBrand";
import { useScrollY } from "../hooks/useScrollY";
import { useFadeOnScroll } from "../hooks/useFadeOnScroll";

import HeroSection from "../components/HeroSection";
import SedesSection from "../components/SedesSection";
import LevelsSection from "../components/LevelsSection";
import BulletinsSection from "../components/BulletinsSection";
import CtaSection from "../components/CtaSection";
import FooterSection from "../components/FooterSection";

export default function LandingPage() {
  const navigate = useNavigate();
  const scrollY = useScrollY();
  useFadeOnScroll();

  const { brandKey, setBrandKey, brand } = useBrand(BRANDS);

  const onPrimaryCta = () => navigate("/login");

  return (
    <div className="min-h-screen bg-white">
      <HeroSection
        brand={brand}
        brandKey={brandKey}
        setBrandKey={setBrandKey}
        scrollY={scrollY}
        content={landingContent.hero}
        onPrimaryCta={onPrimaryCta}
        secondaryCtaUrl={landingContent.bulletins[0].url}
      />

      <SedesSection brand={brand} sedes={SEDES} brands={BRANDS} />
      <LevelsSection brand={brand} levels={landingContent.levels} />
      <BulletinsSection brand={brand} bulletins={landingContent.bulletins} />
      <CtaSection brand={brand} content={landingContent.cta} onCTA={onPrimaryCta} />
      <FooterSection content={landingContent.footer} />
    </div>
  );
}
