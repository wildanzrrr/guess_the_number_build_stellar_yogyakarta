"use client";

import { Client, Networks, rpc, Errors } from "guess-the-number-bindings";

/**
 * Deployed guess-the-number contract on Stellar testnet.
 * Update here when redeploying.
 *
 * v2 (bet-based): contract now charges a 1 XLM bet per guess and returns
 * a string result ("correct" / "incorrect") instead of a boolean.
 */
export const GUESS_CONTRACT_ID =
  "CB5HLXNF2MDPCUP7GQEWS2OM6D2S6COJ52GB3DBQ2HDRB5KFA55PI2D7";

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
