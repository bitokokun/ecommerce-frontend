import { isAvailable, optionKeys, optionValues } from "../variants.js";

const label = (k) => k.charAt(0).toUpperCase() + k.slice(1);
const isCssColor = (v) =>
  typeof CSS !== "undefined" && CSS.supports && CSS.supports("color", String(v));

export default function VariantPicker({
  variants, selection, variant, onSelect, variantId, onSelectId,
}) {
  if (variants.length <= 1) return null;
  const keys = optionKeys(variants);

  if (keys.length === 0) {
    return (
      <div className="field" style={{ maxWidth: 300, marginBottom: 16 }}>
        <label>Option</label>
        <select value={variantId ?? ""} onChange={(e) => onSelectId(Number(e.target.value))}>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.sku}
              {v.in_stock ? "" : " (sold out)"}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const note = !variant
    ? "This combination isn't available. Try another color or size."
    : variant.in_stock
    ? `${variant.stock} in stock`
    : "Sold out";

  return (
    <div className="variant-picker">
      {keys.map((key) => (
        <div className="vp-group" key={key}>
          <div className="vp-label">
            {label(key)}: <strong>{selection[key] ?? ""}</strong>
          </div>
          <div className="vp-options" role="radiogroup" aria-label={label(key)}>
            {optionValues(variants, key).map((val) => {
              const selected = selection[key] === val;
              const available = isAvailable(variants, selection, key, val);
              return (
                <button
                  type="button"
                  key={String(val)}
                  role="radio"
                  aria-checked={selected}
                  className={`vp-option ${selected ? "on" : ""} ${available ? "" : "off"}`}
                  onClick={() => onSelect(key, val)}
                >
                  {key.toLowerCase() === "color" && isCssColor(val) && (
                    <span className="swatch" style={{ background: String(val) }} />
                  )}
                  {String(val)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className={`vp-note ${variant && variant.in_stock ? "" : "warn"}`} role="status">
        {note}
      </div>
    </div>
  );
}
