# Deployment Guide

This document describes how to deploy the FastAPI worker to production using GitHub Actions and Coolify.

## Overview

The deployment pipeline:
1. Push to `main` branch triggers the `deploy` workflow
2. Docker image is built and pushed to GitHub Container Registry (GHCR)
3. Coolify webhook is triggered to pull the new image and deploy to VPS

## Prerequisites

### GitHub Secrets

Configure these secrets in your GitHub repository Settings > Secrets and variables > Actions:

| Secret | Description | Example |
|--------|-------------|---------|
| `GH_PAT` | GitHub Personal Access Token with `read:packages` and `write:packages` scopes | `ghp_xxxxxxxxxxxx` |
| `COOLIFY_WEBHOOK_URL` | Coolify webhook URL for autodeploy | `https://coolify.example.com/api/webhooks/xxx` |

#### Creating a GitHub Personal Access Token

1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `read:packages` - to read from GHCR
   - `write:packages` - to push to GHCR
4. Generate and copy the token
5. Add it as repository secret `GH_PAT`

#### Finding your Coolify Webhook URL

1. Log in to your Coolify instance
2. Navigate to your project > Services
3. Select the worker service
4. Go to the "Webhooks" tab
5. Copy the webhook URL
6. Add it as repository secret `COOLIFY_WEBHOOK_URL`

## GitHub Actions Workflows

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request:
- **Lint**: `ruff check` on Python code
- **Test**: `pytest` with coverage reporting

This must pass before merge is allowed.

### Deploy Workflow (`.github/workflows/deploy.yml`)

Runs on push to `main` branch:
- Builds Docker image with git SHA tag
- Pushes to `ghcr.io/<repo>/worker:latest` and `ghcr.io/<repo>/worker:main-<sha>`
- Triggers Coolify webhook to deploy

## Manual Deployment

To trigger a manual deployment without pushing to `main`:

1. Go to Actions tab in GitHub
2. Select "deploy" workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow"

## Coolify Configuration

Your Coolify service should be configured with:

- **Image**: `ghcr.io/<your-org>/unified-crm-finance/worker:latest`
- **Port**: `8000`
- **Environment Variables**: Configure via Coolify UI
  - `DATABASE_URL`
  - `RABBITMQ_URL`
  - Any other required secrets

## VPS Details

Production VPS: `64.188.56.25`

Coolify manages deployments to this VPS automatically when the webhook is triggered.

## Troubleshooting

### Deploy workflow fails at webhook trigger

Check the COOLIFY_WEBHOOK_URL secret is correct and that Coolify is accessible.

### Docker image not found

Verify:
1. GH_PAT has correct `read:packages` and `write:packages` scopes
2. Image was pushed successfully (check workflow logs)
3. Coolify service uses correct image path

### Health check failing

The Dockerfile includes a health check at `/health`. Ensure:
1. Application is binding to `0.0.0.0:8000`
2. Port 8000 is exposed in Coolify service configuration
