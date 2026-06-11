export const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID ?? "";

export const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS ??
  "") as `0x${string}` | "";

export const BRADBURY_CHAIN_ID = 4221;
export const EXPLORER_URL = "https://explorer-bradbury.genlayer.com";
export const FAUCET_URL = "https://testnet-faucet.genlayer.foundation/";

// Marketing site (landing). In local dev with the SSH tunnel it's localhost:4001;
// in production it should be the deployed origin (set via VITE_LANDING_URL).
export const LANDING_URL =
  (import.meta.env.VITE_LANDING_URL as string | undefined) ?? "/";

export const isContractConfigured = (): boolean =>
  typeof CONTRACT_ADDRESS === "string" && CONTRACT_ADDRESS.startsWith("0x");
