import { useEffect } from "react";

export function useFadeOnScroll() {
  useEffect(() => {
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -80px 0px" };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("animate-fade-in");
      });
    }, observerOptions);

    document.querySelectorAll(".fade-on-scroll").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
