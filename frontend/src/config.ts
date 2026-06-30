export const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID ?? "";

export const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS ??
  "") as `0x${string}` | "";

export const BRADBURY_CHAIN_ID = 4221;
export const EXPLORER_URL = "https://explorer-bradbury.genlayer.com";
export const FAUCET_URL = "https://testnet-faucet.genlayer.foundation/";

// The official Bradbury RPC. Reads (genlayer-js, integer ids) work directly.
export const DIRECT_RPC_URL = "https://rpc-bradbury.genlayer.com";

/**
 * RPC URL the *wallet* uses to submit transactions.
 *
 * The Bradbury node requires integer JSON-RPC ids; MetaMask submits string
 * ids, which the node rejects. In production we route the wallet through a
 * same-origin Pages Function ("/rpc") that normalizes the id. Embedded
 * (viem) wallets already use integer ids, so local dev points straight at
 * the node.
 */
export function resolveWalletRpcUrl(): string {
  const env = import.meta.env.VITE_RPC_URL as string | undefined;
  if (env) return env;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return DIRECT_RPC_URL;
    return `${window.location.origin}/rpc`;
  }
  return DIRECT_RPC_URL;
}

export const WALLET_RPC_URL = resolveWalletRpcUrl();

// Marketing site (landing). In local dev with the SSH tunnel it's localhost:4001;
// in production it should be the deployed origin (set via VITE_LANDING_URL).
export const LANDING_URL =
  (import.meta.env.VITE_LANDING_URL as string | undefined) ?? "/";

export const isContractConfigured = (): boolean =>
  typeof CONTRACT_ADDRESS === "string" && CONTRACT_ADDRESS.startsWith("0x");
