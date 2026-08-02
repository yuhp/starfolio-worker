# Deployment

Starfolio Worker can be deployed automatically from GitHub Actions. The workflow in [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) runs when changes are pushed to `main` or when it is started manually.

## 1. Create A KV Namespace

In Cloudflare Dashboard, open **Workers & Pages** > **KV** and create a namespace, for example `starfolio-star-history`.

Copy its Namespace ID. It becomes the GitHub repository variable `CLOUDFLARE_KV_NAMESPACE_ID` and is bound to the Worker as `KV_StarHistory`.

## 2. Create A Cloudflare API Token

In Cloudflare Dashboard, open **My Profile** > **API Tokens** > **Create Token**, then choose **Custom Token**.

Grant these minimum Account permissions:

| Permission group | Permission | Why it is needed |
| --- | --- | --- |
| Account | `Workers Scripts: Edit` | Uploads and updates the Worker, its Cron Trigger, and its Worker Secret. |
| Account | `Workers KV Storage: Edit` | Lets Wrangler validate and configure the KV namespace binding. |
| Account | `Account Settings: Read` | Lets Wrangler resolve and validate the selected account during deployment. |

Restrict **Account Resources** to only the Cloudflare account where Starfolio Worker will run. No Zone permissions are required for the default `workers.dev` address.

If you later deploy the Worker on a custom domain or an existing zone route, also grant:

| Permission group | Permission | Why it is needed |
| --- | --- | --- |
| Zone | `Workers Routes: Edit` | Creates or updates the Worker route in that zone. |

Save the token as the GitHub repository secret `CLOUDFLARE_API_TOKEN`. Do not commit it or put it in `wrangler.jsonc`.

## 3. Create A GitHub Star Token

Create a GitHub personal access token for the account that is an administrator or collaborator of every repository configured in [`src/projects.js`](../src/projects.js). GitHub restricts stargazer timestamps to those roles. See [Security](../SECURITY.md) for the recommended token type, repository scope, expiration, and handling rules.

Use the least-privileged token that can access the configured repositories. Save it as the GitHub repository secret `STAR_HISTORY_TOKEN`.

Run the **Sync Star Token** workflow after initially setting or rotating this secret. It writes the value to the Cloudflare Worker as the standard Worker Secret `GITHUB_TOKEN`. It is not included in source code, generated deployment configuration, or the public Worker response.

## 4. Configure GitHub Repository Secrets

Open **Settings** > **Secrets and variables** > **Actions** > **Secrets** in the GitHub repository and add:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token created in step 2. |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID that owns the Worker and KV namespace. |
| `STAR_HISTORY_TOKEN` | GitHub token created in step 3. |

## 5. Configure GitHub Repository Variables

In **Settings** > **Secrets and variables** > **Actions** > **Variables**, add:

| Variable | Value |
| --- | --- |
| `CLOUDFLARE_WORKER_NAME` | The Worker name, for example `starfolio`. |
| `CLOUDFLARE_KV_NAMESPACE_ID` | The KV Namespace ID from step 1. |

## 6. Deploy And Verify

Push to `main`, or select **Actions** > **Deploy Worker** > **Run workflow**.

The deployment workflow runs type checks and tests, generates a temporary `wrangler.jsonc`, and deploys the Worker with an hourly Cron Trigger.

After the first deployment, run **Actions** > **Sync Star Token** > **Run workflow** once to write the Worker Secret. Run it again only when `STAR_HISTORY_TOKEN` changes. Keeping token synchronization separate avoids creating an additional Worker version for every code deployment.

After deployment, verify the health endpoint:

```bash
curl https://<worker-name>.<account-subdomain>.workers.dev/
```

Expected response:

```json
{"status":"ok"}
```

Request a configured chart to initiate its first refresh:

```bash
curl -I "https://<worker-name>.<account-subdomain>.workers.dev/star-history/opencode-models-discovery?theme=dark"
```

The first request can return `503` while the Worker fetches GitHub data and populates KV. Retry after the `Retry-After` interval; a successful response has `Content-Type: image/svg+xml`.

## Local Deployment

For a local Wrangler deployment, copy `wrangler.jsonc.example` to `wrangler.jsonc`, set the Worker name and KV Namespace ID, then run:

```bash
npx wrangler login
npx wrangler secret put GITHUB_TOKEN
npm run deploy
```

`wrangler.jsonc` and `.dev.vars` are ignored by Git. They must not contain credentials in committed files.
