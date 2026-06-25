---
status: issues_found
files_reviewed: 1
critical: 4
warning: 4
info: 3
total: 11
reviewed_at: 2026-06-25
---

# Code Review: deploy.py

**File:** `deploy.py` (234 lines)
**Depth:** standard

---

## CR-001: Hardcoded credentials in source code
**Severity:** CRITICAL
**Lines:** 10-11

Root password and username are hardcoded as module-level constants:

```python
USER = "root"
PASSWORD = "oh4Y9A+-_iHDaJ"
```

This means:
- The password is visible to anyone with repo access
- It's committed to git history forever
- It can't be rotated without changing the script
- It leaks via logs, error messages, process lists

**Fix:** Use environment variables (`os.environ.get("DEPLOY_HOST")`, etc.) or SSH key-based auth.

---

## CR-002: SSH Host key verification disabled
**Severity:** CRITICAL
**Line:** 19

```python
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
```

`AutoAddPolicy` blindly accepts any host key on first connection without verification. This makes the connection vulnerable to MITM attacks — an attacker can intercept the SSH connection and capture the root password.

**Fix:** Use `WarningPolicy` (warns but continues) or load known hosts from `~/.ssh/known_hosts`:

```python
client.load_system_host_keys()
# or
client.set_missing_host_key_policy(paramiko.WarningPolicy())
```

---

## CR-003: `prisma db push --accept-data-loss` can destroy production data
**Severity:** CRITICAL
**Line:** 125

```python
npx prisma db push --accept-data-loss 2>&1 | tail -5
```

The `--accept-data-loss` flag tells Prisma to silently drop tables/columns that would otherwise require migration. In production, this can irreversibly destroy data if the schema has destructive changes.

**Fix:** Use `prisma migrate deploy` for production, or at minimum run `prisma db push` without `--accept-data-loss` and fail the deploy if the schema can't be safely pushed.

---

## CR-004: `iptables -I INPUT` creates duplicate rules
**Severity:** CRITICAL
**Line:** 162

```python
ufw allow {PORT}/tcp 2>/dev/null || iptables -I INPUT -p tcp --dport {PORT} -j ACCEPT 2>/dev/null || true
```

`iptables -I` inserts a rule at the top of the chain **unconditionally** — it doesn't check if the rule already exists. Each deployment adds another duplicate ACCEPT rule. Over time, the iptables chain grows indefinitely, degrading network performance and making firewall debugging impossible.

**Fix:** Check if the rule exists first, or use `-C` (check):

```bash
iptables -C INPUT -p tcp --dport {PORT} -j ACCEPT 2>/dev/null || iptables -A INPUT -p tcp --dport {PORT} -j ACCEPT
```

---

## WR-001: No process supervision — `nohup` is fragile for production
**Severity:** WARNING
**Lines:** 167, 174

```python
nohup npx next start -p {PORT} -H 0.0.0.0 > /var/log/unified-crm.log 2>&1 &
```

`nohup` provides no restart-on-crash, no startup ordering, no log rotation, and no health monitoring. If the process dies, it stays dead until the next manual deploy.

**Fix:** Create a systemd service unit instead, or at minimum document this as a known limitation and add a cron-based health check watchdog.

---

## WR-002: Shell escaping in `run_bash` is fragile
**Severity:** WARNING
**Lines:** 34-39

```python
escaped = script.replace("'", "'\"'\"'")
cmd = f"bash -c '{escaped}'"
```

This escaping only handles single quotes. It doesn't handle backticks, `$()` substitution, null bytes, or other shell metacharacters. If any dynamic value flows into `script` (e.g., `REPO_URL` which is a constant now but could become configurable), this is a command injection vector.

**Fix:** Write the script to a temp file and execute it, or use `stdin.write()`:

```python
stdin, stdout, stderr = client.exec_command("bash -s", timeout=timeout)
stdin.write(script)
stdin.channel.shutdown_write()
```

---

## WR-003: `fuser -k {PORT}/tcp` kills any process on the port
**Severity:** WARNING
**Line:** 156

```python
fuser -k {PORT}/tcp 2>/dev/null || true
```

`fuser -k` sends SIGKILL to ALL processes using port 3000, with no confirmation. If another service happens to be on that port, it gets killed silently.

**Fix:** Check if the process is actually the Next.js server before killing:

```bash
EXISTING_PID=$(fuser {PORT}/tcp 2>/dev/null)
if [ -n "$EXISTING_PID" ]; then
    if ps -p $EXISTING_PID -o comm= | grep -q "next"; then
        kill $EXISTING_PID
    else
        echo "Port {PORT} used by non-next process: $EXISTING_PID — aborting"
        exit 1
    fi
fi
```

---

## WR-004: `run_bash` function defined but never called
**Severity:** WARNING
**Lines:** 34-39

The `run_bash` function is defined but never used in the `deploy()` function. All bash execution goes through `run()` directly. This is dead code that adds maintenance burden and confusion.

**Fix:** Remove the function, or use it consistently for all bash script execution (it has better timeout defaults and the escaping logic).

---

## IN-001: Unused import `io`
**Severity:** INFO
**Line:** 7

```python
import io
```

The `io` module is imported but never referenced anywhere in the file.

---

## IN-002: Implicit `urllib.request` import inside a try block
**Severity:** INFO
**Lines:** 211

```python
import urllib.request
```

The import is done inside a try/except block deep in the deploy function. It should be at the top of the file with the other imports. If urllib is unavailable, the deploy should fail early, not at step 8 after the app is already running.

---

## IN-003: No rollback on failure
**Severity:** INFO
**Lines:** 48-230 (entire deploy function)

If deployment fails at step 5 (build), the app is in an undefined state: the old process was killed, the repo was updated, but the new build doesn't exist. There's no mechanism to restore the previous working version.

**Fix:** Clone to a versioned directory (e.g., `/opt/unified-crm-finance/releases/$(date +%s)`) and symlink on success. Keep the last N releases for rollback.
