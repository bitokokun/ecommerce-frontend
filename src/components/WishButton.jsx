import { useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext.jsx";

export default function WishButton({ productId, className = "" }) {
  const { ids, toggle } = useWishlist();
  const navigate = useNavigate();
  const saved = ids.has(productId);

  async function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const ok = await toggle(productId);
    if (ok === false) navigate("/login?next=/account/wishlist");
  }

  return (
    <button
      type="button"
      className={`wish-btn ${saved ? "saved" : ""} ${className}`}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 2.9 5 6.3 5c2 0 3.4 1.1 4.2 2.4h3C14.3 6.1 15.7 5 17.7 5c3.4 0 5.3 3.6 3.9 6.8C19.5 16.4 12 21 12 21z"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
