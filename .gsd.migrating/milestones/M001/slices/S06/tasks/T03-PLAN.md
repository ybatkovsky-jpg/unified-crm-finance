---
estimated_steps: 20
estimated_files: 3
skills_used: []
---

# T03: Create GitHub Actions deploy workflow with Coolify webhook

## Why
Automated deployment on main branch merge enables continuous delivery to production VPS. This workflow builds the Docker image, pushes to GitHub Container Registry (GHCR), and triggers Coolify autodeploy via webhook.

## Do
1. Create .github/workflows/deploy.yml with:
   - Trigger on push to main branch only
   - Job: build (docker/build-push-action@v6)
   - Login to GitHub Container Registry (ghcr.io)
   - Build and push worker image with git commit SHA tag
   - Step to trigger COOLIFY_WEBHOOK_URL secret via curl POST
   - Required secrets: GH_PAT, COOLIFY_WEBHOOK_URL
2. Create apps/worker/Dockerfile if it doesn't exist (multi-stage with python:3.12-slim base)
3. Create .github/DEPLOYMENT.md documenting:
   - How to set up GitHub secrets (GH_PAT, COOLIFY_WEBHOOK_URL)
   - How to configure Coolify webhook to receive deployment notifications
   - How to trigger manual deployment from GitHub Actions UI

## Done when
- .github/workflows/deploy.yml file exists with valid YAML syntax
- apps/worker/Dockerfile exists with python:3.12 base
- .github/DEPLOYMENT.md documents the deployment process
- Workflow includes ghcr.io and COOLIFY_WEBHOOK_URL references

## Inputs

- `.github/workflows/ci.yml`

## Expected Output

- `.github/workflows/deploy.yml`
- `apps/worker/Dockerfile`
- `.github/DEPLOYMENT.md`

## Verification

test -f .github/workflows/deploy.yml && test -f apps/worker/Dockerfile && test -f .github/DEPLOYMENT.md

## Observability Impact

Deploy workflow logs show Docker image SHA pushed to GHCR and Coolify webhook response (status code). Coolify dashboard shows deployment history with success/failure status. VPS 64.188.56.25 receives new container image on successful deploy.
