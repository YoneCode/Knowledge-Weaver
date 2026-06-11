<div align="center">

<img src="landing/app/icon.svg" alt="KnowledgeWeaver" width="72" height="72" />

# KnowledgeWeaver

### A graph that requires a quorum to grow.

Every contribution is judged independently by a quorum of GenLayer validators.<br/>
Only when their reasoning converges does the entry write to chain.

[![Network](https://img.shields.io/badge/network-Bradbury-10b981?style=for-the-badge)](https://explorer-bradbury.genlayer.com/)
[![Chain ID](https://img.shields.io/badge/chain%20id-4221-3b82f6?style=for-the-badge)](https://docs.genlayer.com/)
[![License](https://img.shields.io/badge/license-MIT-71717a?style=for-the-badge)](LICENSE)
[![Built on GenLayer](https://img.shields.io/badge/built%20on-GenLayer-fbbf24?style=for-the-badge)](https://genlayer.com/)
[![Status](https://img.shields.io/badge/status-live%20on%20testnet-10b981?style=for-the-badge)](https://explorer-bradbury.genlayer.com/address/0xE9b1c0c58fa9f1307223859d703686D7b02a5775)

</div>

---

## Live on Bradbury

The contract is deployed and currently active on the GenLayer Bradbury testnet. Every number below is a real on-chain read &mdash; not a marketing figure.

| Field | Value |
|---|---|
| Contract | [`0xE9b1c0c58fa9f1307223859d703686D7b02a5775`](https://explorer-bradbury.genlayer.com/address/0xE9b1c0c58fa9f1307223859d703686D7b02a5775) |
| Knowledge nodes | **2** accepted into the graph |
| Proposals decided | **3** &nbsp;·&nbsp; 2 accepted &nbsp;·&nbsp; 1 rejected |
| Participants | **3** registered addresses |
| Reward pool | **10** credits (forfeited stake) |
| Validators per proposal | **5** independent |
| Quality tolerance band | **&plusmn;30** points |

### Real consensus transactions

Every row below is an actual transaction on Bradbury &mdash; click through to see the validators, the LLM reasoning, and the resulting state mutation.

| Verdict | Category | Quality | Transaction |
|---|---|---|---|
| <picture><source srcset="https://img.shields.io/badge/-accepted-10b981?style=flat-square" media="(prefers-color-scheme: dark)"/><img src="https://img.shields.io/badge/-accepted-10b981?style=flat-square"/></picture> | physics | 95 | [`0x9234cb…961948b`](https://explorer-bradbury.genlayer.com/tx/0x9234cbbc3baa17bd9939b8b33ac2462fa162cf388e92dd6960396bbfb961948b) |
| <picture><source srcset="https://img.shields.io/badge/-accepted-10b981?style=flat-square" media="(prefers-color-scheme: dark)"/><img src="https://img.shields.io/badge/-accepted-10b981?style=flat-square"/></picture> | biology | 85 | [`0x31615f…7438593`](https://explorer-bradbury.genlayer.com/tx/0x31615f61c3cc3f99ccba4c2c012ca7524236a3396ae7a872346bd16707438593) |
| <picture><source srcset="https://img.shields.io/badge/-rejected-f87171?style=flat-square" media="(prefers-color-scheme: dark)"/><img src="https://img.shields.io/badge/-rejected-f87171?style=flat-square"/></picture> | spam | 0 | [`0x391613…82bb57cc7508`](https://explorer-bradbury.genlayer.com/tx/0x391613b0db6e067be89cdccb39e8617336cb11e3435a6d11cc6482bb57cc7508) |

The reasoning that earned the physics entry its place &mdash; produced by validator consensus and stored on-chain alongside the node:

> *"This entry describes a coherent, verifiable, and fundamental physical property of water that is a useful contribution to the graph."*

The reasoning behind the rejection:

> *"The content is commercial spam and provides no verifiable or useful knowledge for the graph."*

Deployment transaction: [`0x79b75d…73fa5f4c`](https://explorer-bradbury.genlayer.com/tx/0x79b75dfc00b24295cdb34712bac83eec6e3ce5877bb0634437bd84e773fa5f4c).

---

## What it is

Most "AI on chain" projects pipe a single LLM call into a smart contract and call that consensus. KnowledgeWeaver doesn't.

Every proposal runs through a leader and a quorum of independent GenLayer validators. Each validator runs its own LLM call against the same evidence. The contract accepts the verdict only when their decisions match and their quality scores fall inside a coarse tolerance band &mdash; not on a hash, but on the substance of the reasoning. Disagreement triggers rotation.

The result is an on-chain knowledge graph where nothing is taken on a single model's word, and where every accepted entry carries the natural-language reasoning that earned it its place.

## Architecture

```
proposal ──┬─→ validator A ──┐
           ├─→ validator B ──┤
           ├─→ validator C ──┼─→ equivalence check ──→ state mutation
           ├─→ validator D ──┤
           └─→ validator E ──┘
                                       │
                                       └─→ disagree → rotate
```

This is the part that genuinely needs GenLayer: a subjective accept/reject decision, verified independently by many validators, that a deterministic EVM contract cannot reproduce.

## Stack

| Layer | Technology |
|---|---|
| Intelligent Contract | Python 3.12 &middot; `py-genlayer` runner (pinned hash) |
| Lint &amp; typecheck | `genvm-linter` |
| Tests | `genlayer-test` (direct mode for logic; integration for consensus) |
| Deployment SDK | `genlayer-py` &middot; Bradbury RPC |
| Dashboard | Vite &middot; React 18 &middot; TypeScript &middot; design-token CSS &middot; Privy &middot; `genlayer-js` |
| Landing | Next.js 14 &middot; Tailwind CSS &middot; shadcn-style components &middot; static export |
| Hosting | Cloudflare Pages (static, both apps) |

## Repository

```
contracts/                     # Intelligent Contract
  knowledge_weaver.py
tests/direct/                  # Fast in-memory direct-mode tests
scripts/                       # deploy, account, seed
deployments/                   # On-chain deployment records
frontend/                      # Vite + React dApp dashboard
landing/                       # Next.js marketing site
gltest.config.yaml             # genlayer-test config
requirements.txt               # Python 3.12 contract toolchain
LICENSE
```

## Run locally

You need Node.js 18+ and Python 3.12. The repo uses [`uv`](https://docs.astral.sh/uv/) to provide Python 3.12 without sudo.

### Contract

```bash
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -r requirements.txt

.venv/bin/genvm-lint check contracts/knowledge_weaver.py
.venv/bin/pytest tests/direct/ -v
```

### Dashboard

```bash
cd frontend
cp .env.example .env           # set VITE_PRIVY_APP_ID
npm ci
npm run dev
```

### Landing

```bash
cd landing
npm ci
npm run dev
```

### Deploy a fresh contract to Bradbury

Fund a key at the [GenLayer faucet](https://testnet-faucet.genlayer.foundation/), put it in `.env` as `ACCOUNT_PRIVATE_KEY`, then:

```bash
.venv/bin/python scripts/deploy.py
```

The script writes the new address into `frontend/.env` automatically. The private key is never echoed.

## Deploy to Cloudflare Pages

Two static targets, one source repository:

| App | Root | Build command | Output | Env vars |
|---|---|---|---|---|
| Dashboard | `frontend` | `npm run build` | `dist` | `VITE_PRIVY_APP_ID`, `VITE_CONTRACT_ADDRESS`, `VITE_LANDING_URL` |
| Landing | `landing` | `npm run build` | `out` | `NEXT_PUBLIC_DASHBOARD_URL` |

Both apps build to fully static assets &mdash; no Node runtime is required at the edge.

## Security notes

- Private keys live only in gitignored `.env` files; deployment scripts never log or print them.
- All user and LLM input is sanitized (control characters stripped, injection markers neutralized, length-bounded) before reaching either an LLM prompt or on-chain storage.
- No floats and no events on-chain. Errors are tagged `[EXPECTED] / [EXTERNAL] / [TRANSIENT] / [LLM_ERROR]` so failure paths can also reach deterministic consensus.

## Contract API

**Writes:** `register()` &middot; `propose(content, category)` &middot; `endorse(node_id)` &middot; `set_min_stake(n)` *(admin)* &middot; `grant_credits(addr, n)` *(admin)*

**Views:** `get_stats()` &middot; `get_node(node_id)` &middot; `list_nodes(offset, limit)` &middot; `get_proposal(pid)` &middot; `list_proposals(offset, limit)` &middot; `get_profile(address)`

## License

MIT &mdash; see [LICENSE](LICENSE).

---

<div align="center">

[GitHub](https://github.com/YoneCode/Knowledge-Weaver) &middot; [X](https://x.com/YoneCode) &middot; [Explorer](https://explorer-bradbury.genlayer.com/address/0xE9b1c0c58fa9f1307223859d703686D7b02a5775)

</div>
