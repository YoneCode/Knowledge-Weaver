#!/usr/bin/env python3
"""Generate a fresh GenLayer/EVM account for Bradbury.

SECURITY: the private key is written directly into .env (ACCOUNT_PRIVATE_KEY).
It is NEVER printed to stdout or logs. Only the public address is shown so you
can fund it at the faucet.

Usage:
    .venv/bin/python scripts/new_account.py
Then fund the printed address at https://testnet-faucet.genlayer.foundation/
"""
import sys
from pathlib import Path

from eth_account import Account

ROOT = Path(__file__).resolve().parent.parent
ENV = ROOT / ".env"


def main() -> None:
    acct = Account.create()
    address = acct.address
    private_key = acct.key.hex()
    if not private_key.startswith("0x"):
        private_key = "0x" + private_key

    # Read existing .env (if any), replace/append ACCOUNT_PRIVATE_KEY only.
    lines = []
    if ENV.exists():
        lines = [
            ln for ln in ENV.read_text(encoding="utf-8").splitlines()
            if not ln.startswith("ACCOUNT_PRIVATE_KEY=")
        ]
    lines.insert(0, f"ACCOUNT_PRIVATE_KEY={private_key}")
    if not any(ln.startswith("GENLAYER_NETWORK=") for ln in lines):
        lines.append("GENLAYER_NETWORK=testnet-bradbury")
    ENV.write_text("\n".join(lines) + "\n", encoding="utf-8")
    try:
        ENV.chmod(0o600)
    except OSError:
        pass

    # Wipe sensitive locals.
    del private_key

    print("✅ New account generated and saved to .env (key not displayed).")
    print(f"   Address: {address}")
    print("\nNext: fund this address at https://testnet-faucet.genlayer.foundation/")
    print("Then deploy: .venv/bin/python scripts/deploy.py")


if __name__ == "__main__":
    main()
