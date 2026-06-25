#!/usr/bin/env python3
"""Deploy unified-crm-finance to production server via SSH (paramiko)."""

import paramiko
import sys
import time
import io

HOST = "64.188.56.25"
USER = "root"
PASSWORD = "oh4Y9A+-_iHDaJ"
REPO_URL = "https://github.com/ybatkovsky-jpg/unified-crm-finance.git"
APP_DIR = "/opt/unified-crm-finance"
PORT = 3000

def connect():
    """Create SSH connection."""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)
    print(f"✅ Connected to {HOST}")
    return client


def run(client, cmd: str, timeout: int = 120) -> tuple[int, str, str]:
    """Run a command via SSH, return (exit_code, stdout, stderr)."""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    exit_code = stdout.channel.recv_exit_status()
    return exit_code, out, err


def run_bash(client, script: str, timeout: int = 300) -> tuple[int, str]:
    """Run a bash script via SSH, prints output in real-time."""
    # Write script to temp file on server, then execute
    escaped = script.replace("'", "'\"'\"'")
    cmd = f"bash -c '{escaped}'"
    return run(client, cmd, timeout)


def step(name: str):
    print(f"\n{'='*60}")
    print(f"  {name}")
    print(f"{'='*60}")


def deploy():
    step("SSH Connection")
    try:
        client = connect()
    except Exception as e:
        print(f"❌ SSH failed: {e}")
        return False

    try:
        # 1. System info
        step("Server Info")
        code, out, _ = run(client, "echo 'CPU:' && nproc && echo 'RAM:' && free -h | grep Mem && echo 'Disk:' && df -h / | tail -1 && echo 'OS:' && cat /etc/os-release | head -2")
        print(out)

        # 2. Install system deps
        step("System Dependencies")
        install_cmd = """
export DEBIAN_FRONTEND=noninteractive
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - 2>/dev/null
    apt-get install -y -qq nodejs 2>&1 | tail -3
fi
echo "Node: $(node --version 2>/dev/null || echo 'NOT FOUND')"
echo "NPM: $(npm --version 2>/dev/null || echo 'NOT FOUND')"
if ! command -v git &> /dev/null; then
    apt-get install -y -qq git 2>&1 | tail -1
fi
echo "Git: $(git --version 2>/dev/null || echo 'NOT FOUND')"
"""
        code, out, err = run_bash(client, install_cmd, timeout=300)
        print(out)
        if code != 0: print(f"Warnings: {err[:300]}")

        # 3. Clone/Update repo
        step("Repository")
        git_cmd = f"""
if [ -d "{APP_DIR}" ]; then
    echo "Updating existing repo..."
    cd {APP_DIR}
    git fetch origin main 2>&1
    git reset --hard origin/main 2>&1
else
    echo "Cloning repo..."
    mkdir -p /opt
    git clone {REPO_URL} {APP_DIR} 2>&1
fi
cd {APP_DIR}
echo "Last 3 commits:"
git log --oneline -3
"""
        code, out, err = run_bash(client, git_cmd, timeout=120)
        print(out)
        if code != 0:
            print(f"Git failed: {err[:500]}")
            return False

        # 4. NPM install
        step("NPM Install")
        npm_cmd = f"""
cd {APP_DIR}/apps/web
echo "Installing dependencies..."
npm install --no-audit --no-fund 2>&1 | tail -8
echo ""
echo "Generating Prisma client..."
npx prisma generate 2>&1
echo "Done: $(ls node_modules/.package-lock.json 2>/dev/null && echo 'installed' || echo 'check node_modules')"
"""
        code, out, err = run_bash(client, npm_cmd, timeout=300)
        print(out)
        if code != 0: print(f"NPM warnings: {err[:500]}")

        # 5. Database
        step("Database")
        db_cmd = f"""
cd {APP_DIR}/apps/web
echo "Pushing schema to database..."
npx prisma db push --accept-data-loss 2>&1 | tail -5
if npx prisma db seed 2>&1; then
    echo "Seed OK"
else
    echo "Seed skipped (may already have data)"
fi
echo "DB size: $(ls -lh prisma/dev.db 2>/dev/null | awk '{{print $5}}')"
echo "Tables: $(sqlite3 prisma/dev.db '.tables' 2>/dev/null | wc -w)"
"""
        code, out, err = run_bash(client, db_cmd, timeout=120)
        print(out)
        if code != 0: print(f"DB warnings: {err[:500]}")

        # 6. Build
        step("Build Next.js")
        build_cmd = f"""
cd {APP_DIR}/apps/web
echo "Building Next.js (this takes ~2-3 minutes)..."
npx next build 2>&1 | tail -25
echo ""
echo "Build exit: $?"
ls -lh .next 2>/dev/null | head -3
"""
        code, out, err = run_bash(client, build_cmd, timeout=600)
        print(out)
        build_ok = code == 0 and '.next' in out

        # 7. Start app
        step("Starting App")
        start_cmd = f"""
# Kill existing process
fuser -k {PORT}/tcp 2>/dev/null || true
sleep 1

cd {APP_DIR}/apps/web

# Setup firewall if ufw is active
ufw allow {PORT}/tcp 2>/dev/null || iptables -I INPUT -p tcp --dport {PORT} -j ACCEPT 2>/dev/null || true

# Start server
if [ -d ".next" ]; then
    echo "Starting production server on 0.0.0.0:{PORT}..."
    nohup npx next start -p {PORT} -H 0.0.0.0 > /var/log/unified-crm.log 2>&1 &
    PID=$!
    echo "PID: $PID"
    sleep 4
    curl -sf http://localhost:{PORT}/api/health && echo "✅ Production server running!" || echo "⚠ Health check failed"
else
    echo "No build found, starting dev server..."
    nohup npx next dev -p {PORT} -H 0.0.0.0 > /var/log/unified-crm.log 2>&1 &
    PID=$!
    echo "PID: $PID"
    sleep 8
    curl -sf http://localhost:{PORT}/api/health && echo "✅ Dev server running!" || echo "⚠ Still starting..."
fi
"""
        code, out, err = run_bash(client, start_cmd, timeout=120)
        print(out)

        # Wait and retry if needed
        if "⚠" in out:
            print("\nWaiting for server to start...")
            time.sleep(10)
            code2, out2, _ = run(client, f"curl -sf http://localhost:{PORT}/api/health && echo 'OK' || echo 'FAIL'")
            print(f"Retry: {out2.strip()}")

        # 8. Verify
        step("Verification")
        verify_cmd = f"""
echo "=== HEALTH ==="
curl -s http://localhost:{PORT}/api/health 2>&1

echo ""
echo "=== PROCESS ==="
ps aux | grep -E "next" | grep -v grep | head -2

echo ""
echo "=== LISTENING ==="
ss -tlnp 2>/dev/null | grep :{PORT} || netstat -tlnp 2>/dev/null | grep :{PORT} || echo "Port check unavailable"
"""
        code, out, _ = run_bash(client, verify_cmd, timeout=30)
        print(out)

        # External test
        step("External Access")
        try:
            import urllib.request
            url = f"http://{HOST}:{PORT}/api/health"
            req = urllib.request.Request(url, headers={'User-Agent': 'DeployScript/1.0'})
            resp = urllib.request.urlopen(req, timeout=15)
            print(f"✅ EXTERNAL ACCESS OK — HTTP {resp.status}")
            print(resp.read().decode()[:300])
        except Exception as e:
            print(f"⚠ Cannot reach from here: {e}")
            print(f"   Check firewall allows port {PORT}")

        print(f"\n{'='*60}")
        print(f"  DEPLOY COMPLETE")
        print(f"{'='*60}")
        print(f"")
        print(f"🌐 http://{HOST}:{PORT}")
        print(f"❤️ http://{HOST}:{PORT}/api/health")
        print(f"📋 ssh {USER}@{HOST} 'tail -f /var/log/unified-crm.log'")

    finally:
        client.close()

if __name__ == "__main__":
    deploy()
