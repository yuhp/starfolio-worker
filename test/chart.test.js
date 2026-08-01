import assert from "node:assert/strict";
import test from "node:test";

import { renderChart } from "../src/chart.js";

const stargazers = [
  { starred_at: "2026-01-01T00:00:00Z" },
  { starred_at: "2026-01-03T00:00:00Z" },
  { starred_at: "2026-01-03T12:00:00Z" },
];

test("renders a light SVG with the final star count", () => {
  const svg = renderChart("owner/repository", stargazers, "light");

  assert.match(svg, /fill="#ffffff"/);
  assert.match(svg, />3<\/text>/);
  assert.match(svg, /owner\/repository/);
});

test("renders a dark SVG", () => {
  const svg = renderChart("owner/repository", stargazers, "dark");

  assert.match(svg, /fill="#0d1117"/);
});

test("escapes repository names in SVG text", () => {
  const svg = renderChart("owner/<repository>", [], "light");

  assert.match(svg, /owner\/&lt;repository&gt;/);
});
