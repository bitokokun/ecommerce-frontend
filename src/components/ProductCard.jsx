import { useRef } from "react";
import { Link } from "react-router-dom";

export default function ProductCard({ product, index = 0 }) {
  const ref = useRef(null);

  // gentle 3D tilt that follows the mouse (mouse only — skipped on touch screens)
  function onMove(e) {
    if (e.pointerType && e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${px * 7}deg`);
    el.style.setProperty("--rx", `${-py * 7}deg`);
  }
  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  }

  return (
    <Link
      ref={ref}
      to={`/products/${product.id}`}
      className="card"
      style={{ "--i": index }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="card-image">
        {product.primary_image ? (
          <img src={product.primary_image} alt={product.name} loading="lazy" />
        ) : (
          "no image"
        )}
      </div>
      <span className="stamp in-stock">In stock</span>
      <h3>{product.name}</h3>
      <div className="card-price">${product.base_price}</div>
    </Link>
  );
}
