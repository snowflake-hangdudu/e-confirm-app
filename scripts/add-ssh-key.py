"""Add an SSH public key to ubuntu@124.222.62.190 authorized_keys."""
from pathlib import Path

import paramiko

HOST = "124.222.62.190"
USER = "ubuntu"
KEY = (
    "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGS1Zohx8shJngIcBtUCixt/IsCsH3u1ultaPyAzoLa3 "
    "codex-download-site-deploy"
)
SECRETS = Path(__file__).resolve().parents[1] / "docs" / "server.secrets.local.md"


def read_password() -> str:
    for line in SECRETS.read_text(encoding="utf-8").splitlines():
        if "SSH 密码" in line and "`" in line:
            return line.split("`")[1]
    raise RuntimeError(f"SSH password not found in {SECRETS}")


def main() -> None:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=read_password(), timeout=30)

    cmd = f"""
mkdir -p ~/.ssh && chmod 700 ~/.ssh
grep -qxF '{KEY}' ~/.ssh/authorized_keys 2>/dev/null || echo '{KEY}' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
grep -n 'codex-download-site-deploy' ~/.ssh/authorized_keys
wc -l ~/.ssh/authorized_keys
"""
    _, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    code = stdout.channel.recv_exit_status()
    client.close()

    if out:
        print(out)
    if err:
        print(err)
    if code != 0:
        raise SystemExit(code)
    print("SSH key configured.")


if __name__ == "__main__":
    main()
