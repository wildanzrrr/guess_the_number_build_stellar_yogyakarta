import { Buffer } from "buffer";
import {
  Client as ContractClient,
  Spec as ContractSpec,
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
export class Client extends ContractClient {
  options;
  static async deploy(
    /** Constructor/Initialization Args for the contract's `__constructor` method */
    { admin, xlm },
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options,
  ) {
    return ContractClient.deploy({ admin, xlm }, options);
  }
  constructor(options) {
    super(
      new ContractSpec([
        "AAAAAAAAAEFSZWFkIHRoZSBjb25maWd1cmVkIGFkbWluICh0aGUgYWNjb3VudCB0aGF0IGZ1bmRlZCB0aGUgY29udHJhY3QpLgAAAAAAAAVhZG1pbgAAAAAAAAAAAAABAAAD6AAAABM=",
        "AAAAAAAAAtlTdWJtaXQgYSBndWVzcy4gVGhlIGNhbGxlciBtdXN0IGZpcnN0IGF1dGhvcml6ZSBhIDEgWExNIHRyYW5zZmVyCnRvIHRoZSBjb250cmFjdCBhcyB0aGUgY29zdCBvZiBwbGF5aW5nLgoKUmV0dXJuczoKLSBgT2soImNvcnJlY3QiKWAgaWYgdGhlIGd1ZXNzIG1hdGNoZXMg4oCUIHRoZSBjb250cmFjdCBwYXlzIHRoZQoxMCBYTE0gcmV3YXJkIHRvIHRoZSBndWVzc2VyIGFuZCByb2xscyBhIG5ldyByYW5kb20gbnVtYmVyLgotIGBPaygiaW5jb3JyZWN0IilgIGlmIHRoZSBndWVzcyBkb2VzIG5vdCBtYXRjaCDigJQgdGhlIGJldCBzdGF5cwppbiB0aGUgY29udHJhY3QgYW5kIHRoZSBudW1iZXIgaXMgTk9UIHJvbGxlZC4KCkVycm9ycyAoYWxsIHN0YXRlIGNoYW5nZXMgYXJlIHJvbGxlZCBiYWNrIGF0b21pY2FsbHkgYnkgU29yb2Jhbik6Ci0gYEVycihJbnZhbGlkR3Vlc3MpYCBpZiB0aGUgZ3Vlc3MgaXMgb3V0c2lkZSBgMS4uPTVgLgotIGBFcnIoRmFpbGVkVG9UcmFuc2ZlckJldClgIGlmIHRoZSAxIFhMTSBiZXQgY291bGQgbm90IGJlIHB1bGxlZApmcm9tIHRoZSBndWVzc2VyLgotIGBFcnIoSW5zdWZmaWNpZW50UmV3YXJkRnVuZHMpYCBpZiB0aGUgY29udHJhY3QgY2Fubm90IHBheSB0aGUKZnVsbCAxMCBYTE0gcmV3YXJkIG9uIGEgY29ycmVjdCBndWVzcy4KLSBgRXJyKEZhaWxlZFRvVHJhbnNmZXJSZXdhcmQpYCBpZiB0aGUgcmV3YXJkIHRyYW5zZmVyIGl0c2VsZgpmYWlscy4AAAAAAAAFZ3Vlc3MAAAAAAAACAAAAAAAAAAt1c2VyX251bWJlcgAAAAAGAAAAAAAAAAdndWVzc2VyAAAAABMAAAABAAAD6QAAABEAAAAD",
        "AAAAAAAAASxDb25zdHJ1Y3Rvci4KCmBhZG1pbmAgZnVuZHMgdGhlIGNvbnRyYWN0IHdpdGggYElOSVRJQUxfRlVORElOR19YTE1gIFhMTSBvdXQgb2YgaXRzCm93biBiYWxhbmNlICh0aGUgZGVwbG95ZXIgc2hvdWxkIGZyaWVuZGJvdCB0aGUgYWRtaW4gZmlyc3QpLgpgeGxtYCBpcyB0aGUgYWRkcmVzcyBvZiB0aGUgWExNIFN0ZWxsYXIgQXNzZXQgQ29udHJhY3Qgb24gdGhlIHRhcmdldApuZXR3b3JrIOKAlCB0aGUgZGVwbG95ZXIgc3VwcGxpZXMgaXQgZXhwbGljaXRseSBzbyB0aGUgY29udHJhY3Qgc3RheXMKbmV0d29yay1hZ25vc3RpYy4AAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAADeGxtAAAAABMAAAAA",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABAAAAEFUaGUgY29udHJhY3QgZmFpbGVkIHRvIHRyYW5zZmVyIHRoZSAxMCBYTE0gcmV3YXJkIHRvIHRoZSBndWVzc2VyLgAAAAAAABZGYWlsZWRUb1RyYW5zZmVyUmV3YXJkAAAAAAABAAAASVRoZSBjb250cmFjdCBkb2VzIG5vdCBjdXJyZW50bHkgaG9sZCBlbm91Z2ggWExNIHRvIHBheSB0aGUgMTAgWExNIHJld2FyZC4AAAAAAAAXSW5zdWZmaWNpZW50UmV3YXJkRnVuZHMAAAAAAgAAAD1UaGUgZ3Vlc3MgbXVzdCBiZSBhIHdob2xlIG51bWJlciBiZXR3ZWVuIDEgYW5kIDUgKGluY2x1c2l2ZSkuAAAAAAAADEludmFsaWRHdWVzcwAAAAMAAAA7VGhlIGNvbnRyYWN0IGZhaWxlZCB0byBwdWxsIHRoZSAxIFhMTSBiZXQgZnJvbSB0aGUgZ3Vlc3Nlci4AAAAAE0ZhaWxlZFRvVHJhbnNmZXJCZXQAAAAABA==",
      ]),
      options,
    );
    this.options = options;
  }
  fromJSON = {
    admin: this.txFromJSON,
    guess: this.txFromJSON,
  };
}
