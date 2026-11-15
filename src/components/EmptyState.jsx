import { Link } from "react-router-dom";

const ICONS = {
  cart: (
    <>
      <path d="M6 9h6l4 19h20l4-14H14" />
      <circle cx="20" cy="37" r="2.6" />
      <circle cx="34" cy="37" r="2.6" />
    </>
  ),
  orders: (
    <>
      <path d="M24 6l16 8v18L24 42 8 32V14z" />
      <path d="M8 14l16 8 16-8M24 22v20" />
    </>
  ),
  search: (
    <>
      <circle cx="21" cy="21" r="12" />
      <path d="M30 30l11 11" />
    </>
  ),
  grid: (
    <>
      <rect x="8" y="8" width="13" height="13" rx="3" />
      <rect x="27" y="8" width="13" height="13" rx="3" />
      <rect x="8" y="27" width="13" height="13" rx="3" />
      <rect x="27" y="27" width="13" height="13" rx="3" />
    </>
  ),
  heart: <path d="M24 40S7 30 7 18.5C7 13.8 10.6 10 15.2 10c3.7 0 6.6 2.1 8.8 5.4C26.2 12.1 29.1 10 32.8 10 37.4 10 41 13.8 41 18.5 41 30 24 40 24 40z" />,
  store: (
    <>
      <path d="M7 19l3-10h28l3 10" />
      <path d="M9 19v21h30V19" />
      <path d="M7 19c0 3 2.5 4.5 5 4.5S17 22 17 19c0 3 2.5 4.5 5 4.5S27 22 27 19c0 3 2.5 4.5 5 4.5s5-1.5 5-4.5" />
      <path d="M20 40V30h8v10" />
    </>
  ),
  alert: (
    <>
      <path d="M24 7l18 32H6z" />
      <path d="M24 20v9M24 34v1" />
    </>
  ),
};

function Action({ label, to, onClick, primary }) {
  const className = primary ? "btn btn-primary" : "btn btn-outline";
  if (to) {
    return (
      <Link className={className} to={to}>
        {label}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick}>
      {label}
    </button>
  );
}

export default function EmptyState({ icon = "orders", title, text, action, secondary, compact = false }) {
  return (
    <div className={`empty ${compact ? "empty-compact" : ""}`} role="status">
      <div className="empty-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {ICONS[icon] || ICONS.orders}
        </svg>
      </div>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {(action || secondary) && (
        <div className="empty-actions">
          {action && <Action {...action} primary />}
          {secondary && <Action {...secondary} />}
        </div>
      )}
    </div>
  );
}
