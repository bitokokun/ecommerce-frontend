// Shown when a product has no photo yet: a colored tile with its first letter,
// so the shop never shows a row of "no image" text. Same name -> same color.
const COLORS = ["#0e7c7b", "#e8a33d", "#b44b3c", "#1b2a28", "#4b5b58", "#0a5d5c"];

export default function Placeholder({ name = "" }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const bg = COLORS[h % COLORS.length];
  const letter = (name.trim()[0] || "?").toUpperCase();
  return (
    <div className="ph" style={{ background: bg, color: bg === "#e8a33d" ? "#1b2a28" : "#fff" }} aria-hidden="true">
      {letter}
    </div>
  );
}
