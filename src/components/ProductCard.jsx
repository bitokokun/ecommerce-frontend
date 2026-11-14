import { Link } from "react-router-dom";
import Placeholder from "./Placeholder.jsx";
import WishButton from "./WishButton.jsx";

export default function ProductCard({ product, index = 0, note = "" }) {
  const seller = product.seller_name || "";
  return (
    <article className="pcard" style={{ "--i": index }}>
      <Link to={`/products/${product.id}`} className="pcard-link" aria-label={product.name}>
        <div className="pcard-media">
          {product.primary_image ? (
            <img src={product.primary_image} alt="" loading="lazy" />
          ) : (
            <Placeholder name={product.name} />
          )}
        </div>
        <div className="pcard-panel">
          <div className="pcard-head">
            {seller && (
              <span className="pcard-avatar" aria-hidden="true">
                {product.store_logo ? <img src={product.store_logo} alt="" /> : seller.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="pcard-titles">
              <h3>{product.name}</h3>
              {seller && <span className="pcard-seller">{seller}</span>}
            </div>
          </div>
          <div className="pcard-foot">
            {product.category_name ? <span className="pcard-tag">{product.category_name}</span> : <span />}
            <span className="pcard-price">${product.base_price}</span>
          </div>
          {note && <span className="pcard-note">{note}</span>}
        </div>
      </Link>
      <WishButton productId={product.id} className="pcard-wish" />
    </article>
  );
}
