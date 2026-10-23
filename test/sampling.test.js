import assert from "node:assert/strict";
import test from "node:test";

import {
  cumulativeWeeks,
  lastStarTimestamp,
  sampleCumulativeSeries,
} from "../src/sampling.js";

test("orders weekly data from oldest to newest and accumulates stars", () => {
  const series = cumulativeWeeks([
    { week: 300, total: 5 },
    { week: 100, total: 3 },
    { week: 200, total: 0 },
  ]);

  assert.deepEqual(series.map((point) => point.stars), [3, 3, 8]);
  assert.equal(series[0].starredAt, new Date(100_000).toISOString());
});

test("selects 16 internal boundaries for 18 plotted points", () => {
  const series = Array.from({ length: 100 }, (_, index) => ({
    starredAt: new Date((index + 1) * 100_000).toISOString(),
    stars: index + 1,
  }));
  const samples = sampleCumulativeSeries(series, 100);

  assert.equal(samples.length, 16);
  assert.equal(samples[0].stars, 6);
  assert.equal(samples[1].stars, 12);
  assert.equal(samples.at(-1).stars, 95);
});

test("finds the day of the most recent star", () => {
  const weeks = [
    { week: 1000, total: 2, days: [0, 1, 1, 0, 0, 0, 0] },
    { week: 2000, total: 0, days: [0, 0, 0, 0, 0, 0, 0] },
    { week: 4000, total: 2, days: [0, 0, 0, 2, 0, 0, 0] },
  ];

  assert.equal(
    lastStarTimestamp(weeks),
    new Date((4000 + 3 * 86_400) * 1000).toISOString(),
  );
});

test("returns null when no stars were received", () => {
  assert.equal(lastStarTimestamp([]), null);
  assert.equal(
    lastStarTimestamp([{ week: 1000, total: 0, days: [0, 0, 0, 0, 0, 0, 0] }]),
    null,
  );
});

test("returns no internal samples when there is no star history", () => {
  assert.deepEqual(sampleCumulativeSeries([], 0), []);
  assert.deepEqual(sampleCumulativeSeries(cumulativeWeeks([]), 0), []);
});

test("omits boundaries at or beyond the current total", () => {
  const series = cumulativeWeeks([
    { week: 100, total: 10 },
    { week: 200, total: 10 },
  ]);

  assert.deepEqual(sampleCumulativeSeries(series, 10), []);
});
