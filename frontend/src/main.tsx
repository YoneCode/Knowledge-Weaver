import React from "react";
import ReactDOM from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import { testnetBradbury } from "genlayer-js/chains";
import App from "./App";
import { PRIVY_APP_ID, WALLET_RPC_URL } from "./config";
import "./styles.css";

// genlayer-js chain objects are viem-compatible; Privy accepts them directly.
// We override the RPC the *wallet* uses with the id-normalizing proxy so that
// transaction submission works across wallets (MetaMask sends string ids that
// the Bradbury node would otherwise reject).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const base = testnetBradbury as any;
const bradbury = {
  ...base,
  rpcUrls: {
    ...base.rpcUrls,
    default: { ...base.rpcUrls?.default, http: [WALLET_RPC_URL] },
    public: { http: [WALLET_RPC_URL] },
  },
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#00E88A",
          logo: undefined,
        },
        defaultChain: bradbury,
        supportedChains: [bradbury],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        loginMethods: ["email", "wallet", "google"],
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>,
);
