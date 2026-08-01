import assert from "node:assert/strict";
import test from "node:test";

import { renderChart } from "../src/chart.js";

const history = {
  createdAt: "2026-01-01T00:00:00Z",
  totalStars: 3,
  samples: [
    { starredAt: "2026-01-01T00:00:00Z", stars: 1 },
    { starredAt: "2026-01-03T00:00:00Z", stars: 3 },
  ],
};

test("renders a light SVG with the final star count", () => {
  const svg = renderChart("owner/repository", history, "light");

  assert.match(svg, /fill="#ffffff"/);
  assert.match(svg, />3<\/text>/);
  assert.match(svg, /owner\/repository/);
});

test("renders a dark SVG", () => {
  const svg = renderChart("owner/repository", history, "dark");

  assert.match(svg, /fill="#0d1117"/);
});

test("uses the repository total instead of the sample count", () => {
  const svg = renderChart("owner/repository", {
    createdAt: "2020-01-01T00:00:00Z",
    totalStars: 300_000,
    samples: [{ starredAt: "2023-01-01T00:00:00Z", stars: 150_000 }],
  }, "light");

  assert.match(svg, />300,000<\/text>/);
});

test("escapes repository names in SVG text", () => {
  const svg = renderChart("owner/<repository>", { ...history, samples: [] }, "light");

  assert.match(svg, /owner\/&lt;repository&gt;/);
});
