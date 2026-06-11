#!/usr/bin/env python3
"""Deploy the KnowledgeWeaver contract to the GenLayer Bradbury testnet.

Reads ACCOUNT_PRIVATE_KEY from .env. The private key is NEVER printed or logged.
Writes the deployed address to deployments/bradbury.json and frontend/.env.

Usage:
    .venv/bin/python scripts/deploy.py
Optional constructor overrides via env:
    MIN_STAKE=10 STARTING_CREDITS=100 .venv/bin/python scripts/deploy.py
"""
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from genlayer_py import create_client, create_account
from genlayer_py.chains import testnet_bradbury
from genlayer_py.types import TransactionStatus

ROOT = Path(__file__).resolve().parent.parent
CONTRACT_PATH = ROOT / "contracts" / "knowledge_weaver.py"


def fail(msg: str) -> "NoReturn":
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    load_dotenv(ROOT / ".env", override=True)

    pk = os.getenv("ACCOUNT_PRIVATE_KEY", "").strip()
    if not pk or "YOUR_PRIVATE_KEY" in pk:
        fail(
            "ACCOUNT_PRIVATE_KEY is not set in .env. Add your funded Bradbury "
            "key (fund it at https://testnet-faucet.genlayer.foundation/)."
        )
    if not pk.startswith("0x") or len(pk) != 66:
        fail("ACCOUNT_PRIVATE_KEY must be a 0x-prefixed 32-byte hex string.")

    min_stake = int(os.getenv("MIN_STAKE", "10"))
    starting_credits = int(os.getenv("STARTING_CREDITS", "100"))

    account = create_account(pk)
    print(f"Deployer address: {account.address}")
    print("Network: Bradbury testnet (chain 4221)")

    client = create_client(chain=testnet_bradbury, account=account)

    code = CONTRACT_PATH.read_text(encoding="utf-8")
    print(f"Deploying {CONTRACT_PATH.name} (min_stake={min_stake}, "
          f"starting_credits={starting_credits}) ...")

    tx_hash = client.deploy_contract(
        code=code,
        args=[min_stake, starting_credits],
    )
    print(f"Deploy tx: {tx_hash}")

    receipt = client.wait_for_transaction_receipt(
        transaction_hash=tx_hash,
        status=TransactionStatus.ACCEPTED,
    )

    data = receipt.get("data") or {}
    address = (
        data.get("contract_address")
        or receipt.get("contract_address")
        or receipt.get("recipient")
    )
    if not address:
        fail(f"Could not find deployed address in receipt. Raw: {json.dumps(receipt, default=str)[:600]}")

    explorer = f"https://explorer-bradbury.genlayer.com/contract/{address}"
    print("\n✅ Deployed KnowledgeWeaver")
    print(f"   Address : {address}")
    print(f"   Explorer: {explorer}")

    # Persist deployment record
    dep_dir = ROOT / "deployments"
    dep_dir.mkdir(exist_ok=True)
    (dep_dir / "bradbury.json").write_text(
        json.dumps(
            {
                "network": "testnet-bradbury",
                "chain_id": 4221,
                "address": address,
                "tx_hash": tx_hash,
                "explorer": explorer,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    # Wire the frontend (.env consumed by Vite). Preserve other keys if present.
    fe_env = ROOT / "frontend" / ".env"
    lines = []
    if fe_env.exists():
        lines = [
            ln for ln in fe_env.read_text(encoding="utf-8").splitlines()
            if not ln.startswith("VITE_CONTRACT_ADDRESS=")
        ]
    lines.append(f"VITE_CONTRACT_ADDRESS={address}")
    fe_env.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"\nWrote deployments/bradbury.json and frontend/.env (VITE_CONTRACT_ADDRESS).")


if __name__ == "__main__":
    main()
