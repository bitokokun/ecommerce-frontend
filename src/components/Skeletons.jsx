export function Skeleton({ className = "", style }) {
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

function Loading({ label, className, children }) {
  return (
    <div className={className} role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <Loading label="Loading products" className="pgrid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="pcard pcard-skel" key={i} style={{ "--i": i }}>
          <Skeleton className="pcard-skel-img" />
          <div className="pcard-skel-panel">
            <Skeleton className="line" />
            <Skeleton className="line short" />
            <div className="pcard-skel-foot">
              <Skeleton className="pill" />
              <Skeleton className="pill small" />
            </div>
          </div>
        </div>
      ))}
    </Loading>
  );
}

export function ProductDetailSkeleton() {
  return (
    <Loading label="Loading product" className="product-detail">
      <Skeleton className="detail-skel-image" />
      <div className="detail-skel-info">
        <Skeleton className="line title" />
        <Skeleton className="line short" />
        <Skeleton className="line price" />
        <Skeleton className="line" />
        <Skeleton className="line" />
        <Skeleton className="line medium" />
        <div className="detail-skel-options">
          <Skeleton className="pill" />
          <Skeleton className="pill" />
          <Skeleton className="pill" />
        </div>
        <Skeleton className="line button" />
      </div>
    </Loading>
  );
}

export function CartSkeleton({ rows = 3 }) {
  return (
    <Loading label="Loading your cart" className="cart-skel">
      <Skeleton className="line title" />
      {Array.from({ length: rows }).map((_, i) => (
        <div className="cart-skel-row" key={i}>
          <div className="cart-skel-text">
            <Skeleton className="line" />
            <Skeleton className="line short" />
          </div>
          <Skeleton className="pill" />
          <Skeleton className="line price" />
        </div>
      ))}
      <Skeleton className="line summary" />
      <Skeleton className="line button" />
    </Loading>
  );
}

export function OrdersSkeleton({ count = 2 }) {
  return (
    <Loading label="Loading your orders" className="orders-skel">
      {Array.from({ length: count }).map((_, i) => (
        <div className="order-card orders-skel-card" key={i}>
          <div className="orders-skel-head">
            <Skeleton className="line short" />
            <Skeleton className="pill" />
          </div>
          <Skeleton className="line tracker" />
          <Skeleton className="line" />
          <Skeleton className="line medium" />
          <Skeleton className="line short" />
        </div>
      ))}
    </Loading>
  );
}

export function ListSkeleton({ rows = 4, label = "Loading" }) {
  return (
    <Loading label={label} className="list-skel">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="list-skel-row" key={i}>
          <div className="cart-skel-text">
            <Skeleton className="line" />
            <Skeleton className="line short" />
          </div>
          <Skeleton className="pill" />
        </div>
      ))}
    </Loading>
  );
}
