"""Upload Android APK to production download directory."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import paramiko

HOST = "124.222.62.190"
USER = "ubuntu"

ROOT = Path(__file__).resolve().parents[1]
SECRETS = ROOT / "docs" / "server.secrets.local.md"
SOURCE = ROOT / "dist" / "equejing-android-v1.0.0.apk"
VERSIONED_NAME = "equejing-android-v1.0.0.apk"
LATEST_NAME = "equejing-android.apk"
REMOTE_DIR = "/var/www/econfirm/downloads"
NGINX_CONF = "/etc/nginx/sites-available/econfirm"
LOCAL_NGINX = ROOT.parent / "e-confirm-api" / "deploy" / "nginx-econfirm.conf"


def read_password() -> str:
    text = SECRETS.read_text(encoding="utf-8")
    for line in text.splitlines():
        if "SSH 密码" in line and "`" in line:
            return line.split("`")[1]
    raise RuntimeError(f"SSH password not found in {SECRETS}")


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"APK not found: {SOURCE}")

    size_mb = SOURCE.stat().st_size / (1024 * 1024)
    print(f"Source: {SOURCE} ({size_mb:.1f} MB)")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=read_password(), timeout=30)
    sftp = client.open_sftp()

    def run(cmd: str) -> None:
        print(f"$ {cmd}")
        _, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode("utf-8", errors="replace").strip()
        err = stderr.read().decode("utf-8", errors="replace").strip()
        code = stdout.channel.recv_exit_status()
        if out:
            print(out)
        if code != 0:
            raise RuntimeError(err or out or f"exit {code}")

    run(f"sudo mkdir -p {REMOTE_DIR}")
    run(f"sudo chown ubuntu:ubuntu {REMOTE_DIR}")

    remote_versioned = f"{REMOTE_DIR}/{VERSIONED_NAME}"
    remote_latest = f"{REMOTE_DIR}/{LATEST_NAME}"

    print(f"Uploading -> {remote_versioned}")
    sftp.put(str(SOURCE), remote_versioned)

    run(f"cp {remote_versioned} {remote_latest}")
    run(f"chmod 644 {remote_versioned} {remote_latest}")

    if LOCAL_NGINX.exists():
        sftp.put(str(LOCAL_NGINX), "/tmp/nginx-econfirm.conf")
        run(f"sudo cp /tmp/nginx-econfirm.conf {NGINX_CONF}")
        run("sudo nginx -t")
        run("sudo systemctl reload nginx")

    sftp.close()
    client.close()

    base = f"http://{HOST}/download"
    print("\nDone.")
    print(f"Versioned: {base}/{VERSIONED_NAME}")
    print(f"Fixed URL: {base}/{LATEST_NAME}")


if __name__ == "__main__":
    main()
