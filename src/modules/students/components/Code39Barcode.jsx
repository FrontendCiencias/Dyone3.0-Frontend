import React, { useMemo } from "react";

const CODE39_MAP = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  ".": "wwnnnnwnn",
  " ": "nwwnnnwnn",
  $: "nwnwnwnnn",
  "/": "nwnwnnnwn",
  "+": "nwnnnwnwn",
  "%": "nnnwnwnwn",
  "*": "nwnnwnwnn",
};

function normalizeValue(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^0-9A-Z\-\. \$\/\+%]/g, "");
}

export default function Code39Barcode({ value, className = "", height = 42 }) {
  const bars = useMemo(() => {
    const normalized = normalizeValue(value);
    const encoded = `*${normalized}*`;
    const modules = [];

    encoded.split("").forEach((char, index) => {
      const pattern = CODE39_MAP[char] || CODE39_MAP["-"];

      pattern.split("").forEach((unit, unitIndex) => {
        modules.push({
          black: unitIndex % 2 === 0,
          width: unit === "w" ? 3 : 1,
        });
      });

      if (index < encoded.length - 1) {
        modules.push({ black: false, width: 1 });
      }
    });

    return modules;
  }, [value]);

  const totalWidth = bars.reduce((sum, bar) => sum + bar.width, 0);

  let x = 0;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${totalWidth} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Barcode ${value}`}
      shapeRendering="crispEdges"
      textRendering="geometricPrecision"
      style={{ imageRendering: "pixelated" }}
    >
      <rect x="0" y="0" width={totalWidth} height={height} fill="white" />
      {bars.map((bar, index) => {
        const currentX = x;
        x += bar.width;

        if (!bar.black) return null;

        return <rect key={`${index}-${currentX}`} x={currentX} y="0" width={bar.width} height={height} fill="black" />;
      })}
    </svg>
  );
}
