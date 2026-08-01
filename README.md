# Starfolio Worker

A self-hosted Cloudflare Worker that generates and caches GitHub star-history SVG charts. It uses the GitHub API directly, so it does not depend on the Star History API.

## Features

- Serves static SVG charts from Cloudflare KV.
- Refreshes configured repositories every hour with a Cloudflare Cron Trigger.
- Supports `light` and `dark` themes.
- Uses GitHub stargazer timestamps to render cumulative star history.
- Is deployable from GitHub Actions without committing Cloudflare IDs or tokens.

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

The curve uses every date with one or more new stars as a source point. The five x-axis date labels are display ticks only; they do not aggregate or alter the data.

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local GitHub API token file:

   ```bash
   cp .dev.vars.example .dev.vars
   ```

3. Set `GITHUB_TOKEN` in `.dev.vars`. A fine-grained token needs read access to the tracked public repositories. A classic token needs the `public_repo` scope.

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

The deployment workflow generates a temporary `wrangler.jsonc` from repository configuration, updates the Worker runtime secret, then deploys the Worker. No deployment-specific IDs are committed to this repository.

Create these GitHub repository secrets:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with permission to deploy the target Worker. |
| `CLOUDFLARE_ACCOUNT_ID` | Target Cloudflare account ID. |
| `GITHUB_STAR_TOKEN` | GitHub token written to the deployed Worker as its `GITHUB_TOKEN` runtime secret. |

Create these GitHub repository variables:

| Variable | Purpose |
| --- | --- |
| `CLOUDFLARE_WORKER_NAME` | Name of the deployed Worker, for example `starfolio`. |
| `CLOUDFLARE_KV_NAMESPACE_ID` | ID of the KV namespace bound as `KV_StarHistory`. |

Push to `main` or run the **Deploy Worker** workflow manually. Pull requests and all pushes run type checks and tests without deploying.

For a manual deployment, create `wrangler.jsonc` as above, authenticate with `npx wrangler login`, set the production secret, then deploy:

```bash
npx wrangler secret put GITHUB_TOKEN
npm run deploy
```

## Architecture

See [docs/design.md](docs/design.md) for the request path, scheduled refresh flow, cache model, and failure behavior.

## Development

```bash
npm run check
npm test
```

## Acknowledgements

The chart's hand-drawn visual language is inspired by [Star History](https://github.com/star-history/star-history). Starfolio Worker is independent, does not call the Star History API, and is not affiliated with the Star History project.

## License

[MIT](LICENSE)
