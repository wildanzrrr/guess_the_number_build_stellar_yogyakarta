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
  1: { message: "FailedToTransferReward" },
  /**
   * The contract does not currently hold enough XLM to pay the 10 XLM reward.
   */
  2: { message: "InsufficientRewardFunds" },
  /**
   * The guess must be a whole number between 1 and 5 (inclusive).
   */
  3: { message: "InvalidGuess" },
  /**
   * The contract failed to pull the 1 XLM bet from the guesser.
   */
  4: { message: "FailedToTransferBet" },
};

export interface Client {
  /**
   * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Read the configured admin (the account that funded the contract).
   */
  admin: (
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<Option<string>>>;

  /**
   * Construct and simulate a guess transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Submit a guess. The caller must first authorize a 1 XLM transfer
   * to the contract as the cost of playing.
   *
   * Returns:
   * - `Ok("correct")` if the guess matches — the contract pays the
   * 10 XLM reward to the guesser and rolls a new random number.
   * - `Ok("incorrect")` if the guess does not match — the bet stays
   * in the contract and the number is NOT rolled.
   *
   * Errors (all state changes are rolled back atomically by Soroban):
   * - `Err(InvalidGuess)` if the guess is outside `1..=5`.
   * - `Err(FailedToTransferBet)` if the 1 XLM bet could not be pulled
   * from the guesser.
   * - `Err(InsufficientRewardFunds)` if the contract cannot pay the
   * full 10 XLM reward on a correct guess.
   * - `Err(FailedToTransferReward)` if the reward transfer itself
   * fails.
   */
  guess: (
    { user_number, guesser }: { user_number: u64; guesser: string },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<Result<string>>>;
}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Constructor/Initialization Args for the contract's `__constructor` method */
    { admin, xlm }: { admin: string; xlm: string },
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      },
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({ admin, xlm }, options);
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([
        "AAAAAAAAAEFSZWFkIHRoZSBjb25maWd1cmVkIGFkbWluICh0aGUgYWNjb3VudCB0aGF0IGZ1bmRlZCB0aGUgY29udHJhY3QpLgAAAAAAAAVhZG1pbgAAAAAAAAAAAAABAAAD6AAAABM=",
        "AAAAAAAAAtlTdWJtaXQgYSBndWVzcy4gVGhlIGNhbGxlciBtdXN0IGZpcnN0IGF1dGhvcml6ZSBhIDEgWExNIHRyYW5zZmVyCnRvIHRoZSBjb250cmFjdCBhcyB0aGUgY29zdCBvZiBwbGF5aW5nLgoKUmV0dXJuczoKLSBgT2soImNvcnJlY3QiKWAgaWYgdGhlIGd1ZXNzIG1hdGNoZXMg4oCUIHRoZSBjb250cmFjdCBwYXlzIHRoZQoxMCBYTE0gcmV3YXJkIHRvIHRoZSBndWVzc2VyIGFuZCByb2xscyBhIG5ldyByYW5kb20gbnVtYmVyLgotIGBPaygiaW5jb3JyZWN0IilgIGlmIHRoZSBndWVzcyBkb2VzIG5vdCBtYXRjaCDigJQgdGhlIGJldCBzdGF5cwppbiB0aGUgY29udHJhY3QgYW5kIHRoZSBudW1iZXIgaXMgTk9UIHJvbGxlZC4KCkVycm9ycyAoYWxsIHN0YXRlIGNoYW5nZXMgYXJlIHJvbGxlZCBiYWNrIGF0b21pY2FsbHkgYnkgU29yb2Jhbik6Ci0gYEVycihJbnZhbGlkR3Vlc3MpYCBpZiB0aGUgZ3Vlc3MgaXMgb3V0c2lkZSBgMS4uPTVgLgotIGBFcnIoRmFpbGVkVG9UcmFuc2ZlckJldClgIGlmIHRoZSAxIFhMTSBiZXQgY291bGQgbm90IGJlIHB1bGxlZApmcm9tIHRoZSBndWVzc2VyLgotIGBFcnIoSW5zdWZmaWNpZW50UmV3YXJkRnVuZHMpYCBpZiB0aGUgY29udHJhY3QgY2Fubm90IHBheSB0aGUKZnVsbCAxMCBYTE0gcmV3YXJkIG9uIGEgY29ycmVjdCBndWVzcy4KLSBgRXJyKEZhaWxlZFRvVHJhbnNmZXJSZXdhcmQpYCBpZiB0aGUgcmV3YXJkIHRyYW5zZmVyIGl0c2VsZgpmYWlscy4AAAAAAAAFZ3Vlc3MAAAAAAAACAAAAAAAAAAt1c2VyX251bWJlcgAAAAAGAAAAAAAAAAdndWVzc2VyAAAAABMAAAABAAAD6QAAABEAAAAD",
        "AAAAAAAAASxDb25zdHJ1Y3Rvci4KCmBhZG1pbmAgZnVuZHMgdGhlIGNvbnRyYWN0IHdpdGggYElOSVRJQUxfRlVORElOR19YTE1gIFhMTSBvdXQgb2YgaXRzCm93biBiYWxhbmNlICh0aGUgZGVwbG95ZXIgc2hvdWxkIGZyaWVuZGJvdCB0aGUgYWRtaW4gZmlyc3QpLgpgeGxtYCBpcyB0aGUgYWRkcmVzcyBvZiB0aGUgWExNIFN0ZWxsYXIgQXNzZXQgQ29udHJhY3Qgb24gdGhlIHRhcmdldApuZXR3b3JrIOKAlCB0aGUgZGVwbG95ZXIgc3VwcGxpZXMgaXQgZXhwbGljaXRseSBzbyB0aGUgY29udHJhY3Qgc3RheXMKbmV0d29yay1hZ25vc3RpYy4AAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAADeGxtAAAAABMAAAAA",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABAAAAEFUaGUgY29udHJhY3QgZmFpbGVkIHRvIHRyYW5zZmVyIHRoZSAxMCBYTE0gcmV3YXJkIHRvIHRoZSBndWVzc2VyLgAAAAAAABZGYWlsZWRUb1RyYW5zZmVyUmV3YXJkAAAAAAABAAAASVRoZSBjb250cmFjdCBkb2VzIG5vdCBjdXJyZW50bHkgaG9sZCBlbm91Z2ggWExNIHRvIHBheSB0aGUgMTAgWExNIHJld2FyZC4AAAAAAAAXSW5zdWZmaWNpZW50UmV3YXJkRnVuZHMAAAAAAgAAAD1UaGUgZ3Vlc3MgbXVzdCBiZSBhIHdob2xlIG51bWJlciBiZXR3ZWVuIDEgYW5kIDUgKGluY2x1c2l2ZSkuAAAAAAAADEludmFsaWRHdWVzcwAAAAMAAAA7VGhlIGNvbnRyYWN0IGZhaWxlZCB0byBwdWxsIHRoZSAxIFhMTSBiZXQgZnJvbSB0aGUgZ3Vlc3Nlci4AAAAAE0ZhaWxlZFRvVHJhbnNmZXJCZXQAAAAABA==",
      ]),
      options,
    );
  }
  public readonly fromJSON = {
    admin: this.txFromJSON<Option<string>>,
    guess: this.txFromJSON<Result<string>>,
  };
}
