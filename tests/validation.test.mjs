import { test } from "node:test";
import assert from "node:assert/strict";
import { validateProduct } from "../src/model.ts";
const image = "data:image/jpeg;base64,YQ==";
test("valid product and supported price boundaries", () => {
  for (const price of ["1", "250000", "1000000000"])
    assert.equal(validateProduct("Áo", "Thời trang", price, image), null);
});
test("reject invalid, fractional, negative and out-of-range prices", () => {
  for (const price of [
    "",
    "0",
    "-1",
    "1.2",
    "1e3",
    "250.000",
    "NaN",
    "1000000001",
  ])
    assert.ok(validateProduct("Áo", "Loại", price, image));
});
test("reject empty names, long categories and invalid images", () => {
  assert.ok(validateProduct("  ", "Loại", "10", image));
  assert.ok(validateProduct("Áo", "x".repeat(61), "10", image));
  assert.ok(validateProduct("Áo", "Loại", "10", "file://local.jpg"));
  assert.ok(validateProduct("Áo", "Loại", "10", image + "a".repeat(350000)));
});

test("accept HTTPS image links including query strings; reject unsafe or malformed links", () => {
  for (const url of [
    "https://example.com/photo.jpg",
    "https://example.com/image?token=abc&width=640",
  ]) {
    assert.equal(validateProduct("Áo", "Loại", "100", url), null);
  }
  for (const url of [
    "http://example.com/a.jpg",
    "https://",
    "https://a b/c",
    "https://user:password@example.com/a",
    "javascript:alert(1)",
    "https://example.com/" + "a".repeat(2048),
  ]) {
    assert.ok(validateProduct("Áo", "Loại", "100", url));
  }
});
