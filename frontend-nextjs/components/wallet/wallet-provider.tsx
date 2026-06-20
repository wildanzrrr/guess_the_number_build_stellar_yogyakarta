"use client";

import * as React from "react";
import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { ensureKit, KitEventType, NETWORK_PASSPHRASE } from "@/lib/wallet-kit";

export interface SignTransactionInput {
  /** Base64 XDR of the transaction to sign. */
  xdr: string;
  /** Optional override of the address used to sign. Defaults to the active address. */
  address?: string;
}

export interface WalletContextValue {
  /** Connected Stellar public key (G…), or `null` when not connected. */
  address: string | null;
  /** `true` once the kit has finished initialising on the client. */
  isReady: boolean;
  /** `true` if a wallet is currently selected and an address is available. */
  isConnected: boolean;
  /** Open the auth modal so the user can pick + connect a wallet. */
  connect: () => Promise<void>;
  /** Disconnect the active wallet and clear local address state. */
  disconnect: () => Promise<void>;
  /** Request a signature for a transaction XDR. */
  signTransaction: (input: SignTransactionInput) => Promise<string>;
}

const WalletContext = React.createContext<WalletContextValue | null>(null);

export interface WalletProviderProps {
  children: React.ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [address, setAddress] = React.useState<string | null>(null);
  const [isReady, setIsReady] = React.useState(false);

  // Init kit on mount, then attempt to restore prior session.
  //
  // We defer init with `requestAnimationFrame` so that the kit's reactive
  // store doesn't synchronously mutate <html> during React's hydration
  // commit phase. (It adds `--swk-*` CSS variables to
  // `document.documentElement.style`, which would otherwise produce a
  // hydration mismatch warning.)
  React.useEffect(() => {
    let cancelled = false;
    let rafId: number | null = null;

    rafId = requestAnimationFrame(() => {
      (async () => {
        try {
          await ensureKit();
          if (cancelled) return;

          // If a wallet is already connected (kit persists across reloads),
          // pull its address without opening the auth modal.
          try {
            const { address: existing } = await StellarWalletsKit.getAddress();
            if (!cancelled && existing) setAddress(existing);
          } catch {
            // No active session — that's fine.
          }

          if (!cancelled) setIsReady(true);
        } catch (err) {
          // Surface init failures so the UI can show them.
          console.error("Failed to initialise StellarWalletsKit:", err);
          if (!cancelled) setIsReady(true);
        }
      })();
    });

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // Subscribe to address / disconnect events. The kit is a module-level
  // singleton so we don't bother unsubscribing on unmount — the callback
  // becomes inert once the provider tree is gone.
  React.useEffect(() => {
    if (!isReady) return;

    StellarWalletsKit.on(
      KitEventType.STATE_UPDATED,
      (event: { payload?: { address?: string } }) => {
        const next = event?.payload?.address ?? null;
        setAddress(next || null);
      },
    );

    StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      setAddress(null);
    });
  }, [isReady]);

  const connect = React.useCallback(async () => {
    await ensureKit();
    const { address: next } = await StellarWalletsKit.authModal();
    if (next) setAddress(next);
  }, []);

  const disconnect = React.useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect();
    } finally {
      setAddress(null);
    }
  }, []);

  const signTransaction = React.useCallback(
    async ({ xdr, address: signWith }: SignTransactionInput) => {
      await ensureKit();
      const useAddress = signWith ?? address;
      if (!useAddress) throw new Error("No active wallet address to sign with");
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: useAddress,
      });
      return signedTxXdr;
    },
    [address],
  );

  const value = React.useMemo<WalletContextValue>(
    () => ({
      address,
      isReady,
      isConnected: !!address,
      connect,
      disconnect,
      signTransaction,
    }),
    [address, isReady, connect, disconnect, signTransaction],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = React.useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used inside <WalletProvider>");
  }
  return ctx;
}
