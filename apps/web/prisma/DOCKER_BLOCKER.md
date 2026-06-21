# Docker Desktop Blocker - Unblocking Instructions

## Problem

Docker Desktop fails to start on Windows 11 Pro, preventing PostgreSQL container startup.
This blocks T02 and all dependent migration tasks including T09.

## Error Symptoms

```
docker ps
# Error: Cannot connect to the Docker daemon
```

## Unblocking Steps

### 1. Check Windows Subsystem for Linux (WSL)
```powershell
wsl --status
wsl --list --verbose
```

### 2. Update WSL kernel
```powershell
wsl --update
wsl --shutdown
```

### 3. Enable WSL and Hyper-V (if not enabled)
```powershell
# Run as Administrator
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

### 4. Restart Docker Desktop
- Open Docker Desktop
- Check Settings > General: "Use WSL 2 based engine"
- Check Settings > Resources > WSL Integration: Enable for your distro

### 5. Verify Docker is running
```bash
docker version
docker ps
```

### 6. Start PostgreSQL container
```bash
cd /path/to/project
docker-compose up -d postgres
```

## Workaround (Current)

Until Docker Desktop is fixed, the project uses SQLite for development:
- `DATABASE_URL=file:./dev.db` in `.env`
- Migrations work but production-ready PostgreSQL is blocked
- Performance and feature limitations apply (no array types, different SQL dialect)

## Impact

| Task | Status | Impact |
|------|--------|--------|
| T02 | BLOCKED | Cannot test PostgreSQL migrations |
| T03 | COMPLETE | Schema file-only, no DB impact |
| T07 | COMPLETE | Documentation only |
| T08 | COMPLETE | Stubs work without DB |
| T09 | DEFERRED | Cannot execute migrations until unblocked |

## Next Steps After Unblock

1. Start PostgreSQL: `docker-compose up -d postgres`
2. Update DATABASE_URL in `.env` to PostgreSQL
3. Run migration plan: See `MIGRATION_PLAN.md`
4. Verify: `bash apps/web/scripts/verify-migrations.sh`
