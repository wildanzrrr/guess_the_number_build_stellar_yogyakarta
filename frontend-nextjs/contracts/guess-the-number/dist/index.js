import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from "@stellar/stellar-sdk/contract";
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
    3: { message: "InvalidGuess" }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Constructor/Initialization Args for the contract's `__constructor` method */
    { admin, xlm }, 
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy({ admin, xlm }, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAAAAAEFSZWFkIHRoZSBjb25maWd1cmVkIGFkbWluICh0aGUgYWNjb3VudCB0aGF0IGZ1bmRlZCB0aGUgY29udHJhY3QpLgAAAAAAAAVhZG1pbgAAAAAAAAAAAAABAAAD6AAAABM=",
            "AAAAAAAAAeNTdWJtaXQgYSBndWVzcy4gUmV0dXJucyBgT2sodHJ1ZSlgIGlmIHRoZSBndWVzcyBtYXRjaGVzIGFuZCB0aGUKY2FsbGVyIGhhcyBiZWVuIHJld2FyZGVkLCBgT2soZmFsc2UpYCBvbiBhIHdyb25nIGd1ZXNzLgpSZXR1cm5zOgotIGBFcnIoSW52YWxpZEd1ZXNzKWAgaWYgdGhlIGd1ZXNzIGlzIG91dHNpZGUgYDEuLj01YC4KLSBgRXJyKEluc3VmZmljaWVudFJld2FyZEZ1bmRzKWAgaWYgdGhlIGNvbnRyYWN0IGNhbm5vdCBwYXkgdGhlCmZ1bGwgMTAgWExNIHJld2FyZCAobm8gdHJhbnNmZXIsIG5vIHJlc2V0KS4KLSBgRXJyKEZhaWxlZFRvVHJhbnNmZXJSZXdhcmQpYCBpZiB0aGUgdG9rZW4gdHJhbnNmZXIgaXRzZWxmIGZhaWxzLgoKT24gYSBjb3JyZWN0IGd1ZXNzIHRoZSBjb250cmFjdCBwYXlzIDEwIFhMTSB0byB0aGUgYGd1ZXNzZXJgIGFuZAppbW1lZGlhdGVseSByb2xscyBhIG5ldyByYW5kb20gbnVtYmVyIGZvciB0aGUgbmV4dCByb3VuZC4AAAAABWd1ZXNzAAAAAAAAAgAAAAAAAAALdXNlcl9udW1iZXIAAAAABgAAAAAAAAAHZ3Vlc3NlcgAAAAATAAAAAQAAA+kAAAABAAAAAw==",
            "AAAAAAAAASxDb25zdHJ1Y3Rvci4KCmBhZG1pbmAgZnVuZHMgdGhlIGNvbnRyYWN0IHdpdGggYElOSVRJQUxfRlVORElOR19YTE1gIFhMTSBvdXQgb2YgaXRzCm93biBiYWxhbmNlICh0aGUgZGVwbG95ZXIgc2hvdWxkIGZyaWVuZGJvdCB0aGUgYWRtaW4gZmlyc3QpLgpgeGxtYCBpcyB0aGUgYWRkcmVzcyBvZiB0aGUgWExNIFN0ZWxsYXIgQXNzZXQgQ29udHJhY3Qgb24gdGhlIHRhcmdldApuZXR3b3JrIOKAlCB0aGUgZGVwbG95ZXIgc3VwcGxpZXMgaXQgZXhwbGljaXRseSBzbyB0aGUgY29udHJhY3Qgc3RheXMKbmV0d29yay1hZ25vc3RpYy4AAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAADeGxtAAAAABMAAAAA",
            "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAwAAAEFUaGUgY29udHJhY3QgZmFpbGVkIHRvIHRyYW5zZmVyIHRoZSAxMCBYTE0gcmV3YXJkIHRvIHRoZSBndWVzc2VyLgAAAAAAABZGYWlsZWRUb1RyYW5zZmVyUmV3YXJkAAAAAAABAAAASVRoZSBjb250cmFjdCBkb2VzIG5vdCBjdXJyZW50bHkgaG9sZCBlbm91Z2ggWExNIHRvIHBheSB0aGUgMTAgWExNIHJld2FyZC4AAAAAAAAXSW5zdWZmaWNpZW50UmV3YXJkRnVuZHMAAAAAAgAAAD1UaGUgZ3Vlc3MgbXVzdCBiZSBhIHdob2xlIG51bWJlciBiZXR3ZWVuIDEgYW5kIDUgKGluY2x1c2l2ZSkuAAAAAAAADEludmFsaWRHdWVzcwAAAAM="]), options);
        this.options = options;
    }
    fromJSON = {
        admin: (this.txFromJSON),
        guess: (this.txFromJSON)
    };
}
