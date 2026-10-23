# Starfolio Worker

A self-deployable Cloudflare Worker that generates and caches GitHub star-history SVG charts. It uses GitHub's privacy-safe star history API directly, so it does not depend on the Star History API or send a GitHub token to a chart SaaS.

> **For maintainers who want a cached, self-hosted chart:** deploy Starfolio Worker in your own Cloudflare account and embed the generated SVG in your README. A GitHub token is optional but recommended for higher API rate limits.

## Is This For You?

Use Starfolio Worker when you:

- want a README chart for any public GitHub repository;
- have a Cloudflare account and can create a KV namespace;
- want a cached SVG without a third-party chart service or client-side JavaScript.

Charts use GitHub's weekly, privacy-safe star history data and do not expose stargazer identities.

## Quick Start

1. Add the repositories you want to track in [`src/projects.js`](src/projects.js).
2. Create a Cloudflare KV namespace and add the GitHub Actions secrets and variables listed in the [deployment guide](docs/deploy.md).
3. Push to `main`, optionally run **Sync Star Token** once, then add the generated image URL to your README.

The full setup, including the least-privilege Cloudflare deployment token, is in [docs/deploy.md](docs/deploy.md). Read [SECURITY.md](SECURITY.md) before creating a GitHub token.

## Origin

Starfolio Worker was originally inspired by [Star History](https://github.com/star-history/star-history), including its hand-drawn chart visual language.

It began during the July 2026 stargazers API restriction, when per-stargazer timestamps became limited to a repository's administrators and collaborators. GitHub later added a privacy-safe, weekly star-history endpoint, which Starfolio Worker now uses. That means it can chart any public repository without a privileged token.

Deploying the Worker in your own Cloudflare account keeps chart generation and caching under your control, and public requests only receive the generated SVG. A GitHub token remains optional and is used only to raise API rate limits.

## Features

- Serves static SVG charts from Cloudflare KV.
- Refreshes configured repositories every hour with a Cloudflare Cron Trigger.
- Supports `light` and `dark` themes.
- Uses GitHub's privacy-safe, weekly star-history API for public repositories of any size.
- Reduces each history to at most 18 plotted points for a consistent, smooth curve.
- Is deployable from GitHub Actions without committing Cloudflare IDs or tokens.

## Example Charts

### Dark

![Dark star history chart](https://sh.yuhp.dev/star-history/opencode-models-discovery?theme=dark)

### Light

![Light star history chart](https://sh.yuhp.dev/star-history/opencode-models-discovery?theme=light)

## Embed In A README

Use `<picture>` to automatically show the matching chart for a reader's light or dark system theme. Replace the Worker domain and project slug with your own values:

```html
<a href="https://github.com/owner/repository">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://your-worker.your-subdomain.workers.dev/star-history/project-slug?theme=dark"
    />
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://your-worker.your-subdomain.workers.dev/star-history/project-slug?theme=light"
    />
    <img
      alt="Star history chart"
      src="https://your-worker.your-subdomain.workers.dev/star-history/project-slug?theme=light"
    />
  </picture>
</a>
```

## Routes

| Request | Response |
| --- | --- |
| `GET /` | Health check: `{"status":"ok"}`. |
| `GET /star-history/{project}` | Light-theme SVG for a configured project. |
| `GET /star-history/{project}?theme=dark` | Dark-theme SVG. |
| Unknown route, project, or theme | `404 Not Found`. |

When a configured chart has no cache entry yet, the Worker returns `503` with `Retry-After: 10` and starts a background refresh. Retry shortly afterwards.

```md
![Star history](https://your-worker.your-subdomain.workers.dev/star-history/opencode-models-discovery)
```

## Configure Projects

Edit [`src/projects.js`](src/projects.js) to expose a project. Keys become URL path segments and values are GitHub `owner/repository` names.

```js
export const projects = {
  "opencode-models-discovery": "yuhp/opencode-models-discovery",
  "another-project": "owner/another-project",
};
```

The generated cache entries are:

```text
star-history:{project}:light
star-history:{project}:dark
```

Each refresh reads repository metadata for its creation date and current total, then pages through the weekly star-history endpoint until it reaches the repository's first week. The weekly counts become a cumulative series, which is reduced to at most 18 plotted points: the repository creation point, up to 16 equal cumulative-Star boundaries, and the current total. Small repositories use whatever unique boundaries are available.

The star-history endpoint returns up to 30 weeks per page, newest first. A typical repository needs a handful of requests; even a repository spanning GitHub's full lifetime needs roughly 32. Anonymous requests are limited to 60 per hour per IP, so a token is recommended for scheduled refreshes.

The curve reaches its current total on the day of the most recent star, then extends flat to the current time. That avoids drawing old growth as if it happened today.

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Optionally create a local GitHub API token file:

   ```bash
   cp .dev.vars.example .dev.vars
   ```

3. Set `GITHUB_TOKEN` in `.dev.vars` if you created the file. The token is optional for public repositories and needs no write access; it raises the GitHub API limit from 60 to 5,000 requests per hour.

4. Copy the Cloudflare configuration template and fill in your Worker name and KV namespace ID:

   ```bash
   cp wrangler.jsonc.example wrangler.jsonc
   ```

5. Start the Worker:

   ```bash
   npm run dev
   ```

`wrangler.jsonc` and `.dev.vars` are ignored by Git and must not be committed.

## Deploy With GitHub Actions

The deployment workflow generates a temporary `wrangler.jsonc` from repository configuration and deploys the Worker. No deployment-specific IDs are committed to this repository.

See [Deployment](docs/deploy.md) for the complete Cloudflare and GitHub setup, including least-privilege Cloudflare API Token permissions, KV creation, GitHub credentials, and verification.

Create these GitHub repository secrets:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with permission to deploy the target Worker. |
| `CLOUDFLARE_ACCOUNT_ID` | Target Cloudflare account ID. |
| `STAR_HISTORY_TOKEN` | Optional GitHub token written to the deployed Worker as its `GITHUB_TOKEN` runtime secret. It raises API rate limits and needs no write access. |

Create these GitHub repository variables:

| Variable | Purpose |
| --- | --- |
| `CLOUDFLARE_WORKER_NAME` | Name of the deployed Worker, for example `starfolio`. |
| `CLOUDFLARE_KV_NAMESPACE_ID` | ID of the KV namespace bound as `KV_StarHistory`. |

Push to `main` or run the **Deploy Worker** workflow manually. Pull requests and all pushes run type checks and tests without deploying.

Run the separate **Sync Star Token** workflow only after initially setting or rotating `STAR_HISTORY_TOKEN`. It writes that GitHub secret to the Worker as `GITHUB_TOKEN` without triggering a code deployment.

For a manual deployment, create `wrangler.jsonc` as above, authenticate with `npx wrangler login`, optionally set the production secret, then deploy:

```bash
npx wrangler secret put GITHUB_TOKEN
npm run deploy
```

## Architecture

See [docs/design.md](docs/design.md) for the request path, scheduled refresh flow, cache model, and failure behavior.

## FAQ

### Does this require a privileged GitHub token?

No. Starfolio Worker uses GitHub's privacy-safe weekly star-history endpoint, which works for public repositories without administrator or collaborator access. A token is optional; it raises the API limit from 60 to 5,000 requests per hour and makes scheduled refreshes more reliable.

### Why self-deploy instead of using a hosted chart service?

Self-deploying keeps the repository list and any token under your control, and the public endpoint only serves cached SVG. It also avoids depending on a third-party chart service for data that GitHub now exposes directly. See [SECURITY.md](SECURITY.md) for token handling.

### Does every README view call the GitHub API?

No. Public requests read a completed SVG from KV. The scheduled Worker job refreshes chart data hourly. On a first cache miss, the endpoint starts a background refresh and returns `503` with `Retry-After: 10`; it preserves the last successful chart if a later refresh fails.

## Development

```bash
npm run check
npm test
```

## Acknowledgements

Starfolio Worker is independent, does not call the Star History API, and is not affiliated with the Star History project.

## License

[MIT](LICENSE)
