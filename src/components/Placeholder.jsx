const TONES = [
  ["#9caf88", "#222820"],
  ["#e9d8c4", "#222820"],
  ["#d9dfcc", "#222820"],
  ["#222820", "#f7f5ef"],
  ["#e8412c", "#ffffff"],
  ["#c9d3bd", "#222820"],
];

export default function Placeholder({ name = "" }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [bg, fg] = TONES[h % TONES.length];
  const letter = (name.trim()[0] || "?").toUpperCase();
  return (
    <div className="ph" style={{ background: bg, color: fg }} aria-hidden="true">
      {letter}
    </div>
  );
}
