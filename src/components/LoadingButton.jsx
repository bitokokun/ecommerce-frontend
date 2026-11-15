export default function LoadingButton({
  loading = false,
  loadingText,
  children,
  className = "btn btn-primary",
  disabled = false,
  type = "button",
  ...rest
}) {
  return (
    <button
      type={type}
      className={`${className}${loading ? " is-loading" : ""}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      <span className="btn-label">{loading && loadingText ? loadingText : children}</span>
    </button>
  );
}
