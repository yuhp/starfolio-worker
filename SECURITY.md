# Security Policy

## Token Model

Starfolio Worker reads GitHub repository metadata and stargazer timestamps. GitHub restricts stargazer timestamp access to a repository's administrators and collaborators, so the token owner must hold one of those roles for every configured repository.

The Worker stores this value as the `GITHUB_TOKEN` Cloudflare Worker Secret. It is not committed to the repository, emitted by the public chart endpoint, or included in generated Wrangler configuration.

## Create the Smallest Practical Token

For repositories under one account or organization, prefer a fine-grained personal access token:

1. Set the resource owner to that account or organization.
2. Select only the repositories shown in `src/projects.js`.
3. Start with `Metadata: Read-only`; based on current GitHub behavior, the stargazers endpoint can also require `Contents: Read and write` to verify collaborator access.
4. Set an expiration date and rotate the token before it expires.

Verify the minimum permission for your account and repositories before relying on a fine-grained token. For charts spanning multiple owners or organizations, GitHub's classic `public_repo` scope may be required. It has a broader reach, so avoid it when a fine-grained token can serve the deployment.

## Protect the Token

- Store the production GitHub value as the `STAR_HISTORY_TOKEN` GitHub Actions secret and the resulting `GITHUB_TOKEN` Worker Secret. For local development, use a separate token in the Git-ignored `.dev.vars` file.
- Never put a raw token, an encrypted token payload, or a secret-bearing Worker URL in a README, issue, discussion, or log.
- Do not commit `.dev.vars`, `wrangler.jsonc`, shell history exports, or screenshots containing credentials.
- Keep configured repositories to the minimum necessary set, use branch protection, and review who has access to the GitHub repository and Cloudflare account.
- Rotate the token immediately if it appears in an unexpected location, then run **Sync Star Token** to update the Worker Secret.

## Reporting a Vulnerability

Do not open a public issue for a suspected credential exposure or security vulnerability. Use GitHub's private vulnerability reporting for this repository when available, or contact the maintainer through the email address on the GitHub profile with enough detail to reproduce the issue safely.
