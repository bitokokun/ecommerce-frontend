import { useMemo } from "react";

const COLORS = ["#0e7c7b", "#e8a33d", "#b44b3c", "#1b2a28", "#ffffff"];

export default function Confetti({ count = 70 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        style: {
          "--x": `${Math.random() * 100}%`,
          "--c": COLORS[i % COLORS.length],
          "--t": `${2.2 + Math.random() * 1.8}s`,
          "--d": `${Math.random() * 0.6}s`,
          "--r": `${Math.random() * 360}deg`,
          "--dx": `${(Math.random() - 0.5) * 220}px`,
        },
      })),
    [count]
  );

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <i key={p.id} style={p.style} />
      ))}
    </div>
  );
}
