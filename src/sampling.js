export const CHART_POINTS = 18;

export function cumulativeDays(weeks) {
  let stars = 0;

  return [...weeks]
    .sort((left, right) => left.week - right.week)
    .flatMap(({ week, days }) => (days ?? []).flatMap((count, day) => {
      if (count <= 0) return [];

      stars += count;
      return [{
        starredAt: new Date((week + day * 86_400) * 1000).toISOString(),
        stars,
      }];
    }));
}

export function sampleTimeIntervals(
  series,
  createdAt,
  now = Date.now(),
  points = CHART_POINTS,
) {
  if (series.length === 0) return [];

  const firstDate = Date.parse(createdAt);
  const duration = now - firstDate;
  if (duration <= 0) return [];

  const segments = points - 1;
  const samples = [];
  let seriesIndex = 0;
  let currentStars = 0;

  for (let segment = 1; segment < segments; segment += 1) {
    const targetTime = firstDate + (segment * duration) / segments;

    while (
      seriesIndex < series.length &&
      Date.parse(series[seriesIndex].starredAt) <= targetTime
    ) {
      currentStars = series[seriesIndex].stars;
      seriesIndex += 1;
    }

    samples.push({
      starredAt: new Date(targetTime).toISOString(),
      stars: currentStars,
    });
  }

  return samples;
}
