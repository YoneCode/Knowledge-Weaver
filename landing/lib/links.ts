/**
 * The KnowledgeWeaver dashboard ships under /app/ on the same origin as the
 * landing (one Cloudflare Pages project, combined build). For local dev with
 * separate ports, override with NEXT_PUBLIC_DASHBOARD_URL in landing/.env.local.
 */
export const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "/app/";

export const EXPLORER_CONTRACT_URL =
  "https://explorer-bradbury.genlayer.com/address/0xE9b1c0c58fa9f1307223859d703686D7b02a5775";

export const FAUCET_URL = "https://testnet-faucet.genlayer.foundation/";
