"use client";

import { Client, Networks, rpc, Errors } from "guess-the-number-bindings";

/**
 * Deployed guess-the-number contract on Stellar testnet.
 * Update here when redeploying.
 */
export const GUESS_CONTRACT_ID =
  "CAX7C56YHSQXFUYUVKR3A5GB7XHLX3B4F4LATAQAFI25ZWI7YNMURLUU";

export const RPC_URL = "https://soroban-testnet.stellar.org";

/**
 * Singleton Client bound to the deployed guess-the-number contract.
 *
 * Reads (e.g. `admin()`) are stateless and can be invoked directly.
 * Writes (e.g. `guess()`) return an `AssembledTransaction` that must be
 * signed by the active wallet — see `useSubmitGuess` for that flow.
 */
export const guessClient = new Client({
  networkPassphrase: Networks.TESTNET,
  contractId: GUESS_CONTRACT_ID,
  rpcUrl: RPC_URL,
  allowHttp: false,
  publicKey: undefined,
});

export { Networks, rpc, Errors };
