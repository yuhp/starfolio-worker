# Starfolio Worker

A self-deployable Cloudflare Worker that generates and caches GitHub star-history SVG charts. It uses the GitHub API directly, so it does not depend on the Star History API or send your GitHub token to a chart SaaS.

> **For maintainers affected by GitHub's stargazers API restriction:** deploy Starfolio Worker in your own Cloudflare account, keep the token in a Worker Secret, and embed the cached SVG in your README.

## Is This For You?

Use Starfolio Worker when you:

- own or collaborate on the repositories whose star history you want to show;
- have a Cloudflare account and can create a KV namespace;
- want a public README chart without putting a GitHub token in the README or handing it to a third-party chart service.

It cannot recover star timestamps for repositories where the token owner is neither an administrator nor a collaborator. It does not bypass GitHub's access restriction.

## Quick Start

1. Add the repositories you want to track in [`src/projects.js`](src/projects.js).
2. Create a Cloudflare KV namespace and add the GitHub Actions secrets and variables listed in the [deployment guide](docs/deploy.md).
3. Push to `main`, run **Sync Star Token** once, then add the generated image URL to your README.

The full setup, including the least-privilege Cloudflare deployment token, is in [docs/deploy.md](docs/deploy.md). Read [SECURITY.md](SECURITY.md) before creating the GitHub token.

## Origin

Starfolio Worker was originally inspired by [Star History](https://github.com/star-history/star-history), including its hand-drawn chart visual language.

It exists because GitHub is restricting its stargazers API, the endpoint that returns who starred a repository and when. As announced on June 30, 2026, access to this data is being limited to a repository's own administrators and collaborators. This makes it impractical for a shared Star History-style SaaS to fetch star timestamps using a read-only token supplied for an arbitrary public repository.

By deploying this Worker in your own Cloudflare account and using your own GitHub token, you control the API credentials and the repository list used to generate the cached charts. The token stays in your Cloudflare Worker Secret rather than being supplied to a third-party chart SaaS, reducing the risk of exposing a higher-privilege token outside your own deployment.

## Features

- Serves static SVG charts from Cloudflare KV.
- Refreshes configured repositories every hour with a Cloudflare Cron Trigger.
- Supports `light` and `dark` themes.
- Uses bounded, evenly distributed GitHub stargazer samples to render cumulative star history, including repositories with hundreds of thousands of stars.
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

Each refresh divides a repository into at most 15 equal cumulative-Star segments. It reads the repository's total star count and creation date, then concurrently requests only the stargazer pages containing the internal segment boundaries. The chart uses those boundary timestamps together with repository creation and current-total endpoints. Repositories with fewer than 15 stars use their available unique boundaries. This requires at most 15 GitHub requests per repository, including the metadata request.

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local GitHub API token file:

   ```bash
   cp .dev.vars.example .dev.vars
   ```

3. Set `GITHUB_TOKEN` in `.dev.vars`. The token owner must be an administrator or collaborator of every tracked repository because GitHub restricts stargazer timestamps to those roles. Use the least-privileged token that grants access to the configured repositories.

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
| `STAR_HISTORY_TOKEN` | GitHub token written to the deployed Worker as its `GITHUB_TOKEN` runtime secret. Its owner must be an administrator or collaborator of every tracked repository. |

Create these GitHub repository variables:

| Variable | Purpose |
| --- | --- |
| `CLOUDFLARE_WORKER_NAME` | Name of the deployed Worker, for example `starfolio`. |
| `CLOUDFLARE_KV_NAMESPACE_ID` | ID of the KV namespace bound as `KV_StarHistory`. |

Push to `main` or run the **Deploy Worker** workflow manually. Pull requests and all pushes run type checks and tests without deploying.

Run the separate **Sync Star Token** workflow only after initially setting or rotating `STAR_HISTORY_TOKEN`. It writes that GitHub secret to the Worker as `GITHUB_TOKEN` without triggering a code deployment.

For a manual deployment, create `wrangler.jsonc` as above, authenticate with `npx wrangler login`, set the production secret, then deploy:

```bash
npx wrangler secret put GITHUB_TOKEN
npm run deploy
```

## Architecture

See [docs/design.md](docs/design.md) for the request path, scheduled refresh flow, cache model, and failure behavior.

## FAQ

### Is Star History down?

No. Star History is still available. GitHub now limits the stargazers endpoint, which supplies the timestamps needed for a growth chart, to a repository's administrators and collaborators. That restriction makes it difficult for a shared service to fetch the history for arbitrary repositories.

### Why not use a live third-party embed with my token?

The token that can now read stargazer timestamps is no longer an unscoped read-only credential. Starfolio Worker does not remove that GitHub requirement, but it keeps the token in a Cloudflare Worker Secret under your account and only serves the generated SVG publicly. See [SECURITY.md](SECURITY.md) for scope and handling guidance.

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
