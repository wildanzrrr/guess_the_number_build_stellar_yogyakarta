import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}




export const Errors = {
  /**
   * The contract failed to transfer the 10 XLM reward to the guesser.
   */
  1: {message:"FailedToTransferReward"},
  /**
   * The contract does not currently hold enough XLM to pay the 10 XLM reward.
   */
  2: {message:"InsufficientRewardFunds"},
  /**
   * The guess must be a whole number between 1 and 5 (inclusive).
   */
  3: {message:"InvalidGuess"}
}

export interface Client {
  /**
   * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Read the configured admin (the account that funded the contract).
   */
  admin: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a guess transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Submit a guess. Returns `Ok(true)` if the guess matches and the
   * caller has been rewarded, `Ok(false)` on a wrong guess.
   * Returns:
   * - `Err(InvalidGuess)` if the guess is outside `1..=5`.
   * - `Err(InsufficientRewardFunds)` if the contract cannot pay the
   * full 10 XLM reward (no transfer, no reset).
   * - `Err(FailedToTransferReward)` if the token transfer itself fails.
   * 
   * On a correct guess the contract pays 10 XLM to the `guesser` and
   * immediately rolls a new random number for the next round.
   */
  guess: ({user_number, guesser}: {user_number: u64, guesser: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<boolean>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin, xlm}: {admin: string, xlm: string},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({admin, xlm}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAEFSZWFkIHRoZSBjb25maWd1cmVkIGFkbWluICh0aGUgYWNjb3VudCB0aGF0IGZ1bmRlZCB0aGUgY29udHJhY3QpLgAAAAAAAAVhZG1pbgAAAAAAAAAAAAABAAAD6AAAABM=",
        "AAAAAAAAAeNTdWJtaXQgYSBndWVzcy4gUmV0dXJucyBgT2sodHJ1ZSlgIGlmIHRoZSBndWVzcyBtYXRjaGVzIGFuZCB0aGUKY2FsbGVyIGhhcyBiZWVuIHJld2FyZGVkLCBgT2soZmFsc2UpYCBvbiBhIHdyb25nIGd1ZXNzLgpSZXR1cm5zOgotIGBFcnIoSW52YWxpZEd1ZXNzKWAgaWYgdGhlIGd1ZXNzIGlzIG91dHNpZGUgYDEuLj01YC4KLSBgRXJyKEluc3VmZmljaWVudFJld2FyZEZ1bmRzKWAgaWYgdGhlIGNvbnRyYWN0IGNhbm5vdCBwYXkgdGhlCmZ1bGwgMTAgWExNIHJld2FyZCAobm8gdHJhbnNmZXIsIG5vIHJlc2V0KS4KLSBgRXJyKEZhaWxlZFRvVHJhbnNmZXJSZXdhcmQpYCBpZiB0aGUgdG9rZW4gdHJhbnNmZXIgaXRzZWxmIGZhaWxzLgoKT24gYSBjb3JyZWN0IGd1ZXNzIHRoZSBjb250cmFjdCBwYXlzIDEwIFhMTSB0byB0aGUgYGd1ZXNzZXJgIGFuZAppbW1lZGlhdGVseSByb2xscyBhIG5ldyByYW5kb20gbnVtYmVyIGZvciB0aGUgbmV4dCByb3VuZC4AAAAABWd1ZXNzAAAAAAAAAgAAAAAAAAALdXNlcl9udW1iZXIAAAAABgAAAAAAAAAHZ3Vlc3NlcgAAAAATAAAAAQAAA+kAAAABAAAAAw==",
        "AAAAAAAAASxDb25zdHJ1Y3Rvci4KCmBhZG1pbmAgZnVuZHMgdGhlIGNvbnRyYWN0IHdpdGggYElOSVRJQUxfRlVORElOR19YTE1gIFhMTSBvdXQgb2YgaXRzCm93biBiYWxhbmNlICh0aGUgZGVwbG95ZXIgc2hvdWxkIGZyaWVuZGJvdCB0aGUgYWRtaW4gZmlyc3QpLgpgeGxtYCBpcyB0aGUgYWRkcmVzcyBvZiB0aGUgWExNIFN0ZWxsYXIgQXNzZXQgQ29udHJhY3Qgb24gdGhlIHRhcmdldApuZXR3b3JrIOKAlCB0aGUgZGVwbG95ZXIgc3VwcGxpZXMgaXQgZXhwbGljaXRseSBzbyB0aGUgY29udHJhY3Qgc3RheXMKbmV0d29yay1hZ25vc3RpYy4AAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAADeGxtAAAAABMAAAAA",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAwAAAEFUaGUgY29udHJhY3QgZmFpbGVkIHRvIHRyYW5zZmVyIHRoZSAxMCBYTE0gcmV3YXJkIHRvIHRoZSBndWVzc2VyLgAAAAAAABZGYWlsZWRUb1RyYW5zZmVyUmV3YXJkAAAAAAABAAAASVRoZSBjb250cmFjdCBkb2VzIG5vdCBjdXJyZW50bHkgaG9sZCBlbm91Z2ggWExNIHRvIHBheSB0aGUgMTAgWExNIHJld2FyZC4AAAAAAAAXSW5zdWZmaWNpZW50UmV3YXJkRnVuZHMAAAAAAgAAAD1UaGUgZ3Vlc3MgbXVzdCBiZSBhIHdob2xlIG51bWJlciBiZXR3ZWVuIDEgYW5kIDUgKGluY2x1c2l2ZSkuAAAAAAAADEludmFsaWRHdWVzcwAAAAM=" ]),
      options
    )
  }
  public readonly fromJSON = {
    admin: this.txFromJSON<Option<string>>,
        guess: this.txFromJSON<Result<boolean>>
  }
}