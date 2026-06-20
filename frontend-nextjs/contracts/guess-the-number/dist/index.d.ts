import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions, Result } from "@stellar/stellar-sdk/contract";
import type { u64, Option } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
export declare const Errors: {
    /**
     * The contract failed to transfer the 10 XLM reward to the guesser.
     */
    1: {
        message: string;
    };
    /**
     * The contract does not currently hold enough XLM to pay the 10 XLM reward.
     */
    2: {
        message: string;
    };
    /**
     * The guess must be a whole number between 1 and 5 (inclusive).
     */
    3: {
        message: string;
    };
};
export interface Client {
    /**
     * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Read the configured admin (the account that funded the contract).
     */
    admin: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>;
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
    guess: ({ user_number, guesser }: {
        user_number: u64;
        guesser: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Result<boolean>>>;
}
export declare class Client extends ContractClient {
    readonly options: ContractClientOptions;
    static deploy<T = Client>(
    /** Constructor/Initialization Args for the contract's `__constructor` method */
    { admin, xlm }: {
        admin: string;
        xlm: string;
    }, 
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions & Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
    }): Promise<AssembledTransaction<T>>;
    constructor(options: ContractClientOptions);
    readonly fromJSON: {
        admin: (json: string) => AssembledTransaction<Option<string>>;
        guess: (json: string) => AssembledTransaction<Result<boolean, import("@stellar/stellar-sdk/contract").ErrorMessage>>;
    };
}
