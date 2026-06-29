import React from "react";
import ReactDOM from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import { testnetBradbury } from "genlayer-js/chains";
import App from "./App";
import { PRIVY_APP_ID } from "./config";
import "./styles.css";

// genlayer-js chain objects are viem-compatible; Privy accepts them directly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bradbury = testnetBradbury as any;

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
