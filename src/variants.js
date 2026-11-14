
const SIZE_ORDER = ["xxs", "xs", "s", "m", "l", "xl", "xxl", "xxxl"];

const has = (x) => x !== undefined && x !== null && x !== "";
const isNumeric = (v) =>
  typeof v === "number" || (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)));

export function optionKeys(variants) {
  const keys = [];
  for (const v of variants) {
    for (const [k, val] of Object.entries(v.attributes || {})) {
      if (has(val) && !keys.includes(k)) keys.push(k);
    }
  }
  return keys;
}

export function sortValues(key, values) {
  if (values.every(isNumeric)) return [...values].sort((a, b) => Number(a) - Number(b));
  const lower = values.map((v) => String(v).toLowerCase());
  if (key.toLowerCase() === "size" && lower.every((v) => SIZE_ORDER.includes(v))) {
    return [...values].sort(
      (a, b) => SIZE_ORDER.indexOf(String(a).toLowerCase()) - SIZE_ORDER.indexOf(String(b).toLowerCase())
    );
  }
  return values;
}

export function optionValues(variants, key) {
  const seen = [];
  for (const v of variants) {
    const val = v.attributes?.[key];
    if (has(val) && !seen.includes(val)) seen.push(val);
  }
  return sortValues(key, seen);
}

export function initialSelection(variants) {
  const first = variants.find((v) => v.in_stock) || variants[0];
  const selection = {};
  for (const k of optionKeys(variants)) selection[k] = first?.attributes?.[k];
  return selection;
}

export function findVariant(variants, selection) {
  const keys = optionKeys(variants);
  return variants.find((v) => keys.every((k) => v.attributes?.[k] === selection[k]));
}

export function isAvailable(variants, selection, key, value) {
  const keys = optionKeys(variants);
  const next = { ...selection, [key]: value };
  return variants.some((v) => v.in_stock && keys.every((k) => v.attributes?.[k] === next[k]));
}

export function describe(attributes) {
  const parts = Object.values(attributes || {}).filter(has);
  return parts.length ? parts.join(" · ") : "Standard";
}
