import test from "node:test";
import assert from "node:assert/strict";
import {
  optionKeys, optionValues, sortValues, initialSelection,
  findVariant, isAvailable, describe,
} from "./variants.js";

const v = (id, color, size, in_stock = true) => ({
  id, sku: `S-${id}`, attributes: { color, size }, in_stock,
});

const SHOES = [
  v(1, "Black", "42"), v(2, "Black", "41"), v(3, "Black", "43"),
  v(4, "Red", "42"), v(5, "Red", "43", false),
  v(6, "White", "42"),
];

test("finds the kinds of option, and none when there are none", () => {
  assert.deepEqual(optionKeys(SHOES), ["color", "size"]);
  assert.deepEqual(optionKeys([{ id: 1, attributes: {} }, { id: 2, attributes: { color: "" } }]), []);
  assert.deepEqual(optionKeys([{ id: 1 }]), []);
});

test("shoe sizes sort by number, clothing sizes by S < M < L, colors as seen", () => {
  assert.deepEqual(optionValues(SHOES, "size"), ["41", "42", "43"]);
  assert.deepEqual(sortValues("size", ["L", "S", "XL", "M"]), ["S", "M", "L", "XL"]);
  assert.deepEqual(optionValues(SHOES, "color"), ["Black", "Red", "White"]);
});

test("starts on the first variant that is in stock", () => {
  const sold = [v(1, "Red", "42", false), v(2, "Blue", "43")];
  assert.deepEqual(initialSelection(sold), { color: "Blue", size: "43" });
});

test("finds the exact variant, or nothing", () => {
  assert.equal(findVariant(SHOES, { color: "Red", size: "42" }).id, 4);
  assert.equal(findVariant(SHOES, { color: "Red", size: "41" }), undefined);
});

test("changing the color never changes the size (the bug that was reported)", () => {
  let sel = { color: "Black", size: "43" };
  sel = { ...sel, color: "White" };
  assert.equal(sel.size, "43");
  assert.equal(findVariant(SHOES, sel), undefined);
});

test("any two options can be selected together, even if that combination is missing", () => {
  const sel = { color: "Red", size: "41" };
  assert.equal(findVariant(SHOES, sel), undefined);
  assert.equal(isAvailable(SHOES, { color: "Black", size: "41" }, "color", "Red"), false);
});

test("buttons are dimmed only when that choice would land on nothing in stock", () => {
  const black42 = { color: "Black", size: "42" };
  assert.equal(isAvailable(SHOES, black42, "color", "Red"), true);
  assert.equal(isAvailable(SHOES, black42, "color", "White"), true);
  const black43 = { color: "Black", size: "43" };
  assert.equal(isAvailable(SHOES, black43, "color", "Red"), false);
  assert.equal(isAvailable(SHOES, black43, "color", "White"), false);
  assert.equal(isAvailable(SHOES, black43, "size", "41"), true);
});

test("describes a variant for humans", () => {
  assert.equal(describe({ color: "Red", size: "42" }), "Red · 42");
  assert.equal(describe({}), "Standard");
  assert.equal(describe(undefined), "Standard");
});
