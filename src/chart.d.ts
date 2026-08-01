interface Stargazer {
  starred_at: string;
}

export function renderChart(
  repository: string,
  stargazers: Stargazer[],
  theme: "light" | "dark",
): string;
