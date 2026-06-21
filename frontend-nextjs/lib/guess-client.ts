"use client";

import { Client, Networks, rpc, Errors } from "guess-the-number-bindings";

/**
 * Network configuration is read from NEXT_PUBLIC_* env vars, which are
 * populated by `scripts/deploy.sh` into `frontend-nextjs/.env.local`.
 *
 * Required vars:
 *   NEXT_PUBLIC_RPC_URL              — Soroban RPC endpoint
 *   NEXT_PUBLIC_NETWORK_PASSPHRASE   — Stellar network passphrase
 *   NEXT_PUBLIC_CONTRACT_ADDRESS     — Deployed contract address (C…)
 */
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "";
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? Networks.TESTNET;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

if (!RPC_URL) {
  console.warn(
    "[guess-client] NEXT_PUBLIC_RPC_URL is not set — copy .env to frontend-nextjs/.env.local",
  );
}
if (!CONTRACT_ADDRESS) {
  console.warn(
    "[guess-client] NEXT_PUBLIC_CONTRACT_ADDRESS is not set — deploy the contract first",
  );
}

export const GUESS_CONTRACT_ID = CONTRACT_ADDRESS;
export { RPC_URL };

/**
 * Singleton Client bound to the deployed guess-the-number contract.
 *
 * Reads (e.g. `admin()`) are stateless and can be invoked directly.
 * Writes (e.g. `guess()`) return an `AssembledTransaction` that must be
 * signed by the active wallet — see `useSubmitGuess` for that flow.
 */
export const guessClient = new Client({
  networkPassphrase: NETWORK_PASSPHRASE,
  contractId: CONTRACT_ADDRESS,
  rpcUrl: RPC_URL,
  allowHttp: false,
  publicKey: undefined,
});

export { Networks, rpc, Errors };
