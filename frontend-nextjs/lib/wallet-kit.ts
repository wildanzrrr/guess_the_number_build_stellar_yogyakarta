"use client";

import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { KitEventType, Networks } from "@creit-tech/stellar-wallets-kit/types";
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";

/**
 * Network passphrase — read from NEXT_PUBLIC_NETWORK_PASSPHRASE so the
 * wallet kit signs for the same network the contract is deployed on.
 * Falls back to testnet if unset.
 */
export const NETWORK_PASSPHRASE: string =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? Networks.TESTNET;

/**
 * Map the passphrase to the kit's `Networks` enum (used for wallet
 * module selection). Falls back to testnet.
 */
function networkFromPassphrase(passphrase: string): Networks {
  if (passphrase === Networks.PUBLIC) return Networks.PUBLIC;
  if (passphrase === Networks.FUTURENET) return Networks.FUTURENET;
  return Networks.TESTNET;
}

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
      network: networkFromPassphrase(NETWORK_PASSPHRASE),
      modules: defaultModules(),
    });
    initialized = true;
  })();

  return initPromise;
}

export { KitEventType };
