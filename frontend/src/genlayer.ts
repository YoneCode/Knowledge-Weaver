import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { CONTRACT_ADDRESS, WALLET_RPC_URL } from "./config";

// ───────────────────────────── Types ─────────────────────────────────────
export interface Stats {
  admin: string;
  created_at: string;
  min_stake: number;
  starting_credits: number;
  node_count: number;
  proposal_count: number;
  accepted_count: number;
  rejected_count: number;
  reward_pool: number;
  participant_count: number;
}

export interface KnowledgeNode {
  node_id: string;
  label: string;
  summary: string;
  category: string;
  proposer: string;
  quality: number;
  endorsements: number;
  created_at: string;
  provenance: string[];
}

export interface Proposal {
  proposal_id: number;
  proposer: string;
  content: string;
  category: string;
  stake: number;
  status: string;
  quality: number;
  reason: string;
  node_id: string;
  created_at: string;
}

export interface Profile {
  address: string;
  joined: boolean;
  credits: number;
  reputation: number;
}

// genlayer-js decodes integers as bigint; normalize to JS numbers for the UI.
const n = (v: unknown): number =>
  typeof v === "bigint" ? Number(v) : typeof v === "number" ? v : Number(v ?? 0);

const addr = () => CONTRACT_ADDRESS as `0x${string}`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─────────────── Rate-limit handling ─────────────────────────────────────
// The public Bradbury RPC rate-limits `gen_call`. We serialize all reads
// through a single queue with a minimum gap, and retry with exponential
// backoff when the node returns a rate-limit error.
const MIN_GAP_MS = 350;
let lastCallAt = 0;
let queue: Promise<unknown> = Promise.resolve();

function isRateLimit(e: unknown): boolean {
  const msg = (e as Error)?.message ?? String(e ?? "");
  return /rate limit|too many requests|429|-32429/i.test(msg);
}

async function withRetry<T>(fn: () => Promise<T>, tries = 5): Promise<T> {
  let delay = 800;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt < tries && isRateLimit(e)) {
        await sleep(delay);
        delay = Math.min(delay * 2, 8000);
        continue;
      }
      throw e;
    }
  }
}

/** Serialize + throttle a read so we never burst the RPC. */
function schedule<T>(fn: () => Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    const wait = MIN_GAP_MS - (Date.now() - lastCallAt);
    if (wait > 0) await sleep(wait);
    try {
      return await withRetry(fn);
    } finally {
      lastCallAt = Date.now();
    }
  };
  const result = queue.then(run, run);
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

// ───────────────────────────── Clients ───────────────────────────────────
let _reader: ReturnType<typeof createClient> | null = null;

export function getReader() {
  if (!_reader) {
    _reader = createClient({ chain: testnetBradbury });
  }
  return _reader;
}

/** EIP-3085 chain params for adding Bradbury to a wallet if it's missing. */
const BRADBURY_HEX_ID = "0x107d"; // 4221
const BRADBURY_CHAIN_PARAMS = {
  chainId: BRADBURY_HEX_ID,
  chainName: "GenLayer Bradbury Testnet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  // Wallet submits transactions here. Uses the id-normalizing proxy in
  // production so MetaMask's string ids don't get rejected by the node.
  rpcUrls: [WALLET_RPC_URL],
  blockExplorerUrls: ["https://explorer-bradbury.genlayer.com/"],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Eip1193 = { request: (args: { method: string; params?: any[] }) => Promise<any> };

/**
 * Ensure the connected wallet is on Bradbury (chain 4221) using only standard
 * EIP-3326 / EIP-3085 methods. We deliberately do NOT use genlayer-js
 * `client.connect()`, which forces the MetaMask Snap flow (`wallet_getSnaps`)
 * and crashes on wallets that don't implement Snaps (Privy embedded, etc.).
 */
async function ensureBradbury(provider: Eip1193): Promise<void> {
  try {
    const current = await provider.request({ method: "eth_chainId" });
    if (typeof current === "string" && current.toLowerCase() === BRADBURY_HEX_ID) {
      return;
    }
  } catch {
    // some providers don't support eth_chainId pre-connect; fall through to switch
  }
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BRADBURY_HEX_ID }],
    });
  } catch (err) {
    const e = err as { code?: number; message?: string };
    const notAdded =
      e?.code === 4902 ||
      /unrecognized chain|not been added|add this network/i.test(e?.message ?? "");
    if (notAdded) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [BRADBURY_CHAIN_PARAMS],
      });
    } else {
      throw err;
    }
  }
}

/** Build a write client backed by the connected wallet (e.g. Privy). */
export async function getWriter(account: `0x${string}`, provider: unknown) {
  const p = provider as Eip1193;
  // Switch the wallet to Bradbury with standard methods (no MetaMask Snap).
  await ensureBradbury(p);
  return createClient({
    chain: testnetBradbury,
    account,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider: p as any,
  });
}

/**
 * Ask the wallet to add the Bradbury network pointed at the id-normalizing
 * proxy RPC. Useful when a wallet (e.g. MetaMask) already has Bradbury saved
 * with the raw node RPC, which rejects its string JSON-RPC ids.
 */
export async function addBradburyNetwork(provider: unknown): Promise<void> {
  const p = provider as Eip1193;
  await p.request({ method: "wallet_addEthereumChain", params: [BRADBURY_CHAIN_PARAMS] });
}

/**
 * True when an error is the Bradbury node rejecting a string JSON-RPC id —
 * i.e. the wallet is submitting through an incompatible (non-proxy) RPC.
 */
export function isRpcIdError(err: unknown): boolean {
  const msg = (err as Error)?.message ?? String(err ?? "");
  return /unmarshal string into|id of type int|-32700|Parse error as single request/i.test(msg);
}

// ───────────────────────────── Reads ─────────────────────────────────────
export async function readStats(): Promise<Stats> {
  const r = (await schedule(() =>
    getReader().readContract({ address: addr(), functionName: "get_stats", args: [] }),
  )) as Record<string, unknown>;
  return {
    admin: String(r.admin ?? ""),
    created_at: String(r.created_at ?? ""),
    min_stake: n(r.min_stake),
    starting_credits: n(r.starting_credits),
    node_count: n(r.node_count),
    proposal_count: n(r.proposal_count),
    accepted_count: n(r.accepted_count),
    rejected_count: n(r.rejected_count),
    reward_pool: n(r.reward_pool),
    participant_count: n(r.participant_count),
  };
}

export async function readNodes(offset = 0, limit = 50): Promise<KnowledgeNode[]> {
  const rows = (await schedule(() =>
    getReader().readContract({ address: addr(), functionName: "list_nodes", args: [offset, limit] }),
  )) as Record<string, unknown>[];
  return (rows ?? []).map((r) => ({
    node_id: String(r.node_id ?? ""),
    label: String(r.label ?? ""),
    summary: String(r.summary ?? ""),
    category: String(r.category ?? ""),
    proposer: String(r.proposer ?? ""),
    quality: n(r.quality),
    endorsements: n(r.endorsements),
    created_at: String(r.created_at ?? ""),
    provenance: Array.isArray(r.provenance) ? (r.provenance as string[]) : [],
  }));
}

export async function readProposals(offset = 0, limit = 50): Promise<Proposal[]> {
  const rows = (await schedule(() =>
    getReader().readContract({ address: addr(), functionName: "list_proposals", args: [offset, limit] }),
  )) as Record<string, unknown>[];
  return (rows ?? []).map((r) => ({
    proposal_id: n(r.proposal_id),
    proposer: String(r.proposer ?? ""),
    content: String(r.content ?? ""),
    category: String(r.category ?? ""),
    stake: n(r.stake),
    status: String(r.status ?? ""),
    quality: n(r.quality),
    reason: String(r.reason ?? ""),
    node_id: String(r.node_id ?? ""),
    created_at: String(r.created_at ?? ""),
  }));
}

export async function readProfile(address: string): Promise<Profile> {
  const r = (await schedule(() =>
    getReader().readContract({ address: addr(), functionName: "get_profile", args: [address] }),
  )) as Record<string, unknown>;
  return {
    address: String(r.address ?? address),
    joined: Boolean(r.joined),
    credits: n(r.credits),
    reputation: n(r.reputation),
  };
}

// ───────────────────────────── Writes ────────────────────────────────────
type WriteClient = Awaited<ReturnType<typeof getWriter>>;

/**
 * Submit a write and return the GenLayer transaction id. This resolves once
 * the submission transaction is mined (seconds) — the multi-stage consensus
 * lifecycle then runs asynchronously and is followed via `trackTransaction`.
 */
async function send(
  client: WriteClient,
  functionName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[],
): Promise<string> {
  const txHash = await client.writeContract({
    address: addr(),
    functionName,
    args,
    value: 0n,
  });
  return String(txHash);
}

export const sendRegister = (c: WriteClient) => send(c, "register", []);
export const sendPropose = (c: WriteClient, content: string, category: string) =>
  send(c, "propose", [content, category]);
export const sendEndorse = (c: WriteClient, nodeId: string) => send(c, "endorse", [nodeId]);

/** Terminal GenLayer consensus states. */
const TERMINAL_STATUSES = new Set([
  "ACCEPTED",
  "FINALIZED",
  "UNDETERMINED",
  "CANCELED",
  "LEADER_TIMEOUT",
  "VALIDATORS_TIMEOUT",
]);

export interface TrackResult {
  statusName: string;
  executionResultName?: string;
  succeeded: boolean;
}

/** Live consensus snapshot reported while a transaction is in flight. */
export interface TxLive {
  statusName: string;
  validators: number;
  committed: number;
  revealed: number;
  round: number;
}

/**
 * Poll a transaction through the consensus lifecycle, invoking `onUpdate`
 * whenever the status or vote tallies change (PENDING -> PROPOSING ->
 * COMMITTING -> REVEALING -> ACCEPTED -> FINALIZED), and resolve when it
 * reaches a terminal state (or times out).
 */
export async function trackTransaction(
  txId: string,
  onUpdate: (live: TxLive) => void,
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<TrackResult> {
  const intervalMs = opts.intervalMs ?? 4000;
  const timeoutMs = opts.timeoutMs ?? 12 * 60 * 1000;
  const start = Date.now();
  let last = "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reader = getReader() as any;
  for (;;) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tx: any;
    try {
      tx = await withRetry(() => reader.getTransaction({ hash: txId }));
    } catch {
      // transient read error — keep polling
    }
    const name: string = tx?.statusName ?? "";
    const lr = tx?.lastRound ?? {};
    const validators =
      Number(lr.roundValidators?.length ?? tx?.numOfInitialValidators ?? 0) || 0;
    const committed = Number(lr.votesCommitted ?? 0) || 0;
    const revealed = Number(lr.votesRevealed ?? 0) || 0;
    const round = Number(tx?.numOfRounds ?? lr.round ?? 0) || 0;

    const key = `${name}:${committed}:${revealed}:${validators}`;
    if (name && key !== last) {
      last = key;
      onUpdate({ statusName: name, validators, committed, revealed, round });
    }
    if (name && TERMINAL_STATUSES.has(name)) {
      const succeeded = name === "ACCEPTED" || name === "FINALIZED";
      return { statusName: name, executionResultName: tx?.txExecutionResultName, succeeded };
    }
    if (Date.now() - start > timeoutMs) {
      return { statusName: name || "TIMEOUT", succeeded: false };
    }
    await sleep(intervalMs);
  }
}

/** Most recent proposal authored by `address` (for verdict reveal). */
export async function latestProposalFor(address: string): Promise<Proposal | null> {
  const rows = await readProposals(0, 10);
  const mine = rows.filter((p) => p.proposer.toLowerCase() === address.toLowerCase());
  return mine[0] ?? rows[0] ?? null;
}
