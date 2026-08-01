export const STARGAZERS_PER_PAGE = 100;
export const CHART_SEGMENTS = 15;

export function sampleStarNumbers(totalStars, segments = CHART_SEGMENTS) {
  return Array.from({ length: segments - 1 }, (_, index) => (
    Math.round(((index + 1) * totalStars) / segments)
  )).filter((star, index, stars) => star > 0 && star < totalStars && star !== stars[index - 1]);
}

export function samplePageNumbers(starNumbers) {
  return [...new Set(starNumbers.map((star) => Math.ceil(star / STARGAZERS_PER_PAGE)))];
}

export function starsAtPageStart(_totalStars, page) {
  return (page - 1) * STARGAZERS_PER_PAGE + 1;
}

export function starsAtStargazer(totalStars, page, index) {
  return Math.min(starsAtPageStart(totalStars, page) + index, totalStars);
}
