interface Env {
  KV_StarHistory: KVNamespace;
  GITHUB_TOKEN: string;
}

import { renderChart } from "./chart.js";
import { projects } from "./projects.js";

interface StarHistoryMetadata {
  refreshedAt: string;
}

const SVG_CONTENT_TYPE = "image/svg+xml; charset=utf-8";
const GITHUB_API = "https://api.github.com";
const THEMES = ["light", "dark"] as const;

type Theme = typeof THEMES[number];

interface Stargazer {
  starred_at: string;
}

function cacheKey(project: string, theme: Theme) {
  return `star-history:${project}:${theme}`;
}

async function fetchStargazers(repository: string, token: string) {
  const stargazers: Stargazer[] = [];

  let url: string | null = `${GITHUB_API}/repos/${repository}/stargazers?per_page=100`;
  while (url !== null) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.star+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "starfolio-worker",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const reset = response.headers.get("x-ratelimit-reset");
      const retryAt = reset === null ? "" : `; rate limit resets at ${new Date(Number(reset) * 1000).toISOString()}`;
      throw new Error(`GitHub returned ${response.status} for ${repository}${retryAt}`);
    }

    const pageStargazers = (await response.json()) as Stargazer[];
    stargazers.push(...pageStargazers);
    const next = response.headers.get("link")?.match(/<([^>]+)>; rel="next"/);
    url = next?.[1] ?? null;
  }

  return stargazers;
}

async function refreshProject(project: string, repository: string, env: Env) {
  const stargazers = await fetchStargazers(repository, env.GITHUB_TOKEN);
  const refreshedAt = new Date().toISOString();

  await Promise.all(THEMES.map((theme) => env.KV_StarHistory.put(
    cacheKey(project, theme),
    renderChart(repository, stargazers, theme),
    { metadata: { refreshedAt } },
  )));
}

async function refreshAll(env: Env) {
  for (const [project, repository] of Object.entries(projects)) {
    try {
      await refreshProject(project, repository, env);
    } catch (error) {
      console.error(`Unable to refresh ${project}:`, error);
    }
  }
}

function notFound() {
  return new Response("Not found\n", { status: 404 });
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return Response.json({ status: "ok" });
    }

    const match = /^\/star-history\/([^/]+)$/.exec(url.pathname);
    if (!match) {
      return notFound();
    }

    const project = decodeURIComponent(match[1]);
    const repository = projects[project];
    if (repository === undefined) {
      return notFound();
    }

    const requestedTheme = url.searchParams.get("theme") ?? "light";
    if (!THEMES.includes(requestedTheme as Theme)) {
      return notFound();
    }
    const theme = requestedTheme as Theme;
    const value = await env.KV_StarHistory.getWithMetadata<StarHistoryMetadata>(
      cacheKey(project, theme),
    );
    if (value.value === null) {
      ctx.waitUntil(
        refreshProject(project, repository, env).catch((error) => {
          console.error(`Unable to refresh ${project}:`, error);
        }),
      );
      return new Response("Star history is being refreshed\n", {
        status: 503,
        headers: { "Retry-After": "10" },
      });
    }

    return new Response(value.value, {
      headers: {
        "Content-Type": SVG_CONTENT_TYPE,
        "Cache-Control": "public, max-age=300",
        "X-Star-History-Refreshed-At": String(value.metadata?.refreshedAt ?? "unknown"),
      },
    });
  },

  async scheduled(_event, env, ctx): Promise<void> {
    ctx.waitUntil(refreshAll(env));
  },
} satisfies ExportedHandler<Env>;
