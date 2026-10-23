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

export function cumulativeDays(weeks: WeeklyStars[]): StarHistoryPoint[];
export function sampleTimeIntervals(
  series: StarHistoryPoint[],
  createdAt: string,
  now?: number,
  points?: number,
): StarHistoryPoint[];
