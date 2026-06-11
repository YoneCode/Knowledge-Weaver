/**
 * The KnowledgeWeaver dashboard is a separate application (Vite) running on
 * its own origin. In local development it is reachable through the SSH tunnel
 * at http://localhost:4000. In production this should be the deployed origin.
 *
 * Override with NEXT_PUBLIC_DASHBOARD_URL in .env.local (or your deploy env).
 */
export const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:4000";

export const EXPLORER_CONTRACT_URL =
  "https://explorer-bradbury.genlayer.com/address/0xE9b1c0c58fa9f1307223859d703686D7b02a5775";

export const FAUCET_URL = "https://testnet-faucet.genlayer.foundation/";
