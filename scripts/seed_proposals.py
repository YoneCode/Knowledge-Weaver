#!/usr/bin/env python3
"""Submit proposals with retry on transient submission reverts / leader timeouts.
Real Bradbury consensus. Run: .venv/bin/python -u scripts/seed_proposals.py
"""
import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from genlayer_py import create_client, create_account
from genlayer_py.chains import testnet_bradbury

ROOT = Path(__file__).resolve().parent.parent

GOOD = [
    ("Water expands as it freezes, which is why solid ice is less dense and floats on liquid water.", "physics"),
    ("Photosynthesis lets plants convert sunlight, water, and carbon dioxide into glucose and oxygen.", "biology"),
]
SPAM = ("buy cheap followers now click click free money guaranteed winner prize", "spam")


def addr_of():
    return json.loads((ROOT / "deployments" / "bradbury.json").read_text())["address"]


def wait_decided(client, txid, label, max_s=540):
    waited = 0
    while waited < max_s:
        tx = client.get_transaction(transaction_hash=txid)
        s = tx.get("status_name"); ex = tx.get("tx_execution_result_name")
        if s in ("ACCEPTED", "FINALIZED"):
            print(f"  [{label}] {s} / {ex}", flush=True)
            return True
        if s in ("UNDETERMINED", "LEADER_TIMEOUT") or ex == "FINISHED_WITH_ERROR":
            print(f"  [{label}] {s} / {ex} -> retry", flush=True)
            return False
        time.sleep(8); waited += 8
    print(f"  [{label}] timeout", flush=True)
    return False


def submit(client, address, content, cat, label, attempts=4):
    for a in range(1, attempts + 1):
        try:
            tx = client.write_contract(address=address, function_name="propose", args=[content, cat])
            print(f"{label} attempt {a}: tx={tx}", flush=True)
            if wait_decided(client, tx, label):
                return True
        except Exception as e:
            print(f"{label} attempt {a} submit error: {str(e)[:120]} -> retry", flush=True)
        time.sleep(12)
    print(f"{label}: gave up after {attempts} attempts", flush=True)
    return False


def main():
    load_dotenv(ROOT / ".env", override=True)
    pk = os.getenv("ACCOUNT_PRIVATE_KEY", "").strip()
    if not pk or "YOUR" in pk:
        print("ERROR: missing key", file=sys.stderr); sys.exit(1)
    address = addr_of()
    client = create_client(chain=testnet_bradbury, account=create_account(pk))
    print(f"Contract {address}", flush=True)
    for i, (c, cat) in enumerate(GOOD, 1):
        submit(client, address, c, cat, f"good{i}")
    submit(client, address, SPAM[0], SPAM[1], "spam")
    print("done", flush=True)


if __name__ == "__main__":
    main()
