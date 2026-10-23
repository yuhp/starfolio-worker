import assert from "node:assert/strict";
import test from "node:test";

import { cumulativeDays, sampleTimeIntervals } from "../src/sampling.js";

test("expands weekly buckets into daily cumulative points", () => {
  const series = cumulativeDays([
    { week: 1000, total: 2, days: [0, 1, 1, 0, 0, 0, 0] },
    { week: 800, total: 1, days: [0, 0, 1, 0, 0, 0, 0] },
  ]);

  assert.deepEqual(series, [
    { starredAt: new Date((800 + 2 * 86_400) * 1000).toISOString(), stars: 1 },
    { starredAt: new Date((1000 + 86_400) * 1000).toISOString(), stars: 2 },
    { starredAt: new Date((1000 + 2 * 86_400) * 1000).toISOString(), stars: 3 },
  ]);
});

test("samples at uniform time intervals across repository history", () => {
  const createdAt = "2026-01-01T00:00:00.000Z";
  const now = Date.parse("2026-01-18T00:00:00.000Z");
  const series = [
    { starredAt: "2026-01-05T00:00:00.000Z", stars: 10 },
    { starredAt: "2026-01-10T00:00:00.000Z", stars: 50 },
    { starredAt: "2026-01-15T00:00:00.000Z", stars: 100 },
  ];

  const samples = sampleTimeIntervals(series, createdAt, now, 18);
  assert.equal(samples.length, 16);

  assert.equal(samples[0].stars, 0);
  assert.equal(samples[4].stars, 10);
  assert.equal(samples[8].stars, 50);
  assert.equal(samples.at(-1).stars, 100);
});

test("returns no internal samples when there is no star history", () => {
  assert.deepEqual(sampleTimeIntervals([], "2026-01-01T00:00:00.000Z"), []);
  assert.deepEqual(
    sampleTimeIntervals(cumulativeDays([]), "2026-01-01T00:00:00.000Z"),
    [],
  );
});

test("returns empty samples when duration is non-positive", () => {
  const createdAt = "2026-01-10T00:00:00.000Z";
  const now = Date.parse("2026-01-05T00:00:00.000Z");
  const series = [{ starredAt: "2026-01-06T00:00:00.000Z", stars: 5 }];

  assert.deepEqual(sampleTimeIntervals(series, createdAt, now), []);
});
