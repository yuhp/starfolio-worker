export const CHART_POINTS: number;

export interface WeeklyStars {
  week: number;
  total: number;
  days: number[];
}

export interface StarHistoryPoint {
  starredAt: string;
  stars: number;
}

export function cumulativeWeeks(weeks: WeeklyStars[]): StarHistoryPoint[];
export function lastStarTimestamp(weeks: WeeklyStars[]): string | null;
export function sampleCumulativeSeries(
  series: StarHistoryPoint[],
  totalStars: number,
  points?: number,
): StarHistoryPoint[];
