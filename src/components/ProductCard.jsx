import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.id}`} className="card">
      <div className="card-image">
        {product.primary_image ? (
          <img src={product.primary_image} alt={product.name} />
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
