export const STARGAZERS_PER_PAGE: number;
export const CHART_SEGMENTS: number;

export function sampleStarNumbers(totalStars: number, segments?: number): number[];
export function samplePageNumbers(starNumbers: number[]): number[];
export function starsAtPageStart(totalStars: number, page: number): number;
export function starsAtStargazer(totalStars: number, page: number, index: number): number;
