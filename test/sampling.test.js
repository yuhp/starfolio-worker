import assert from "node:assert/strict";
import test from "node:test";

import {
  samplePageNumbers,
  sampleStarNumbers,
  starsAtPageStart,
  starsAtStargazer,
} from "../src/sampling.js";

test("splits every repository into at most 15 equal star-count segments", () => {
  assert.deepEqual(sampleStarNumbers(98), [7, 13, 20, 26, 33, 39, 46, 52, 59, 65, 72, 78, 85, 91]);
  assert.equal(sampleStarNumbers(300_000).length, 14);
});

test("requests only the pages that contain segment boundaries", () => {
  const pages = samplePageNumbers(sampleStarNumbers(300_000));

  assert.equal(pages.length, 14);
  assert.equal(pages[0], 200);
  assert.equal(pages.at(-1), 2_800);
  assert.ok(pages.every((page, index) => index === 0 || page > pages[index - 1]));
});

test("maps an oldest-first page start to its cumulative star total", () => {
  assert.equal(starsAtPageStart(300_000, 1), 1);
  assert.equal(starsAtPageStart(300_000, 2_000), 199_901);
  assert.equal(starsAtPageStart(300_000, 3_000), 299_901);
});

test("maps each stargazer in an oldest-first page to its cumulative total", () => {
  assert.equal(starsAtStargazer(300_000, 1, 0), 1);
  assert.equal(starsAtStargazer(300_000, 1, 99), 100);
  assert.equal(starsAtStargazer(300_000, 3_000, 99), 300_000);
});
