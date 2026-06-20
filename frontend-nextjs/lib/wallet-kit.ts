"use client";

import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { KitEventType, Networks } from "@creit-tech/stellar-wallets-kit/types";
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";

let initialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Lazy, idempotent init of the global kit singleton. Safe to call from
 * multiple components; subsequent calls resolve immediately. Must only be
 * called from the browser.
 */
export async function ensureKit(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    StellarWalletsKit.init({
      network: Networks.TESTNET,
      modules: defaultModules(),
    });
    initialized = true;
  })();

  return initPromise;
}

/** Testnet passphrase used by the deployed guess-the-number contract. */
export const NETWORK_PASSPHRASE: string = Networks.TESTNET;

export { KitEventType };
