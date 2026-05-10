Status: ready-for-human

# Add local issue progress GitHub Action

## What to build

Add a GitHub Actions workflow that tracks progress for local markdown issues under `.scratch/` by summarizing issue statuses in the workflow run summary. This keeps local issue progression visible in GitHub without changing the repo's current local markdown issue tracker convention.

## Acceptance criteria

- [ ] A GitHub Actions workflow runs on pull requests and pushes that modify `.scratch/**/*.md`.
- [ ] The workflow parses `Status:` lines from local issue files and writes a concise progress summary to the GitHub Actions job summary.
- [ ] The workflow reports counts for `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`, and unknown statuses.
- [ ] The workflow is read-only and does not mutate issue files or create GitHub Issues.
- [ ] Documentation explains how maintainers should update local issue statuses.

## Blocked by

None - can start immediately
