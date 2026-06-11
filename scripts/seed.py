#!/usr/bin/env python3
"""Seed real on-chain data into KnowledgeWeaver so the dashboard metrics are
non-zero. Uses the deployer (admin) account from .env. Everything here is real
Bradbury consensus — no mock data.

- grant_credits(addr) registers example participants  -> participant_count
- propose(good)  -> validators accept -> node_count + accepted_count
- propose(spam)  -> validators reject -> reward_pool + rejected_count

Run: .venv/bin/python scripts/seed.py
"""
import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from eth_account import Account
from genlayer_py import create_client, create_account
from genlayer_py.chains import testnet_bradbury

ROOT = Path(__file__).resolve().parent.parent


def load_address() -> str:
    dep = ROOT / "deployments" / "bradbury.json"
    return json.loads(dep.read_text())["address"]


def wait_decided(client, txid: str, label: str, max_s: int = 480) -> str:
    """Poll until the tx reaches a decided state. Returns status_name."""
    waited = 0
    while waited < max_s:
        tx = client.get_transaction(transaction_hash=txid)
        s = tx.get("status_name")
        ex = tx.get("tx_execution_result_name")
        if s in ("ACCEPTED", "FINALIZED"):
            print(f"  [{label}] {s} / {ex}")
            return s
        if s in ("UNDETERMINED", "LEADER_TIMEOUT") or ex == "FINISHED_WITH_ERROR":
            print(f"  [{label}] {s} / {ex} (not applied)")
            return s
        time.sleep(8)
        waited += 8
    print(f"  [{label}] timeout after {max_s}s (last status pending)")
    return "TIMEOUT"


def main() -> None:
    load_dotenv(ROOT / ".env", override=True)
    pk = os.getenv("ACCOUNT_PRIVATE_KEY", "").strip()
    if not pk or "YOUR" in pk:
        print("ERROR: ACCOUNT_PRIVATE_KEY missing in .env", file=sys.stderr)
        sys.exit(1)

    addr = load_address()
    acct = create_account(pk)
    client = create_client(chain=testnet_bradbury, account=acct)
    print(f"Contract: {addr}\nAdmin   : {acct.address}\n")

    # 1) Register example participants (deterministic admin writes).
    example_addrs = [Account.create().address for _ in range(3)]
    for i, ea in enumerate(example_addrs, 1):
        tx = client.write_contract(address=addr, function_name="grant_credits", args=[ea, 50])
        print(f"grant_credits #{i} -> {ea}  tx={tx}")
        wait_decided(client, tx, f"grant {i}")

    # 2) Good proposals (expected ACCEPT via consensus).
    good = [
        ("Water expands as it freezes, which is why solid ice is less dense and floats on liquid water.", "physics"),
        ("Photosynthesis lets plants convert sunlight, water, and carbon dioxide into glucose and oxygen.", "biology"),
        ("The Pythagorean theorem states that in a right triangle the square of the hypotenuse equals the sum of the squares of the other two sides.", "mathematics"),
    ]
    for i, (content, cat) in enumerate(good, 1):
        tx = client.write_contract(address=addr, function_name="propose", args=[content, cat])
        print(f"propose good #{i} ({cat})  tx={tx}")
        wait_decided(client, tx, f"good {i}")

    # 3) One spam proposal (expected REJECT -> reward pool).
    tx = client.write_contract(
        address=addr,
        function_name="propose",
        args=["buy cheap followers now click click free money guaranteed winner", "spam"],
    )
    print(f"propose spam  tx={tx}")
    wait_decided(client, tx, "spam")

    print("\nSeeding submitted. Read the dashboard or run a genlayer-js read to confirm metrics.")


if __name__ == "__main__":
    main()
