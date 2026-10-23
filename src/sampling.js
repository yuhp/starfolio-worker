export const CHART_POINTS = 18;

export function cumulativeWeeks(weeks) {
  let stars = 0;

  return [...weeks]
    .sort((left, right) => left.week - right.week)
    .map(({ week, total }) => {
      stars += total;
      return {
        starredAt: new Date(week * 1000).toISOString(),
        stars,
      };
    });
}

export function lastStarTimestamp(weeks) {
  const latest = weeks
    .filter((week) => week.total > 0)
    .reduce((current, week) => (
      current === null || week.week > current.week ? week : current
    ), null);

  if (latest === null) return null;

  const day = (latest.days ?? []).findLastIndex((count) => count > 0);
  const offset = day < 0 ? 0 : day;

  return new Date((latest.week + offset * 86_400) * 1000).toISOString();
}

export function sampleCumulativeSeries(series, totalStars, points = CHART_POINTS) {
  if (series.length === 0 || totalStars <= 0) return [];

  const segments = points - 1;
  const samples = [];
  let index = 0;

  for (let segment = 1; segment < segments; segment += 1) {
    const target = (segment * totalStars) / segments;
    while (index < series.length && series[index].stars < target) index += 1;

    const point = series[index];
    if (point === undefined) break;
    if (point.stars <= 0 || point.stars >= totalStars) continue;
    if (samples.at(-1)?.stars === point.stars) continue;

    samples.push(point);
  }

  return samples;
}
