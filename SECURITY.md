# Security Policy

## Token Model

Starfolio Worker reads public repository metadata and GitHub's weekly, privacy-safe star-history data. These endpoints do not expose stargazer identities, and public repositories do not require administrator or collaborator access.

A GitHub token is optional. When configured, the Worker stores it as the `GITHUB_TOKEN` Cloudflare Worker Secret. It is not committed to the repository, emitted by the public chart endpoint, or included in generated Wrangler configuration.

Anonymous GitHub API requests are limited to 60 per hour per IP. A token raises the limit to 5,000 per hour, which is recommended for scheduled refreshes.

## Create the Smallest Practical Token

If you use a token:

1. Prefer a fine-grained personal access token with read-only access to public repositories.
2. Grant no write permissions.
3. Set an expiration date and rotate the token before it expires.

No repository-specific collaboration role is required for public repositories.

## Protect the Token

- Store the production GitHub value as the `STAR_HISTORY_TOKEN` GitHub Actions secret and the resulting `GITHUB_TOKEN` Worker Secret. For local development, use a separate token in the Git-ignored `.dev.vars` file.
- Never put a raw token, an encrypted token payload, or a secret-bearing Worker URL in a README, issue, discussion, or log.
- Do not commit `.dev.vars`, `wrangler.jsonc`, shell history exports, or screenshots containing credentials.
- Use branch protection and review who has access to the GitHub repository and Cloudflare account.
- Rotate the token immediately if it appears in an unexpected location, then run **Sync Star Token** to update the Worker Secret.

## Reporting a Vulnerability

Do not open a public issue for a suspected credential exposure or security vulnerability. Use GitHub's private vulnerability reporting for this repository when available, or contact the maintainer through the email address on the GitHub profile with enough detail to reproduce the issue safely.
