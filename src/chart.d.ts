interface StarHistory {
  createdAt: string;
  lastStarAt?: string | null;
  totalStars: number;
  samples: Array<{
    starredAt: string;
    stars: number;
  }>;
}

export function renderChart(
  repository: string,
  history: StarHistory,
  theme: "light" | "dark",
): string;
