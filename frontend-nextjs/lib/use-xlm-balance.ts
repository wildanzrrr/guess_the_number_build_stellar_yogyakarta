"use client";

import * as React from "react";
import { useWallet } from "@/components/wallet/wallet-provider";

export interface XlmBalanceState {
  /** Balance in XLM (human units, not stroops). "0" while loading or on error. */
  balance: string;
  /** `true` while a fetch is in flight. */
  isLoading: boolean;
  /** Last error message, or `null` if the last fetch succeeded. */
  error: string | null;
  /** Manually trigger a refetch. */
  refresh: () => void;
}

const STROOPS_PER_XLM = 10_000_000;
const HORIZON_URL = "https://horizon-testnet.stellar.org";

export function useXlmBalance(refreshKey: number = 0): XlmBalanceState {
  const { address, isConnected } = useWallet();
  const [balance, setBalance] = React.useState("0");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  const refresh = React.useCallback(() => setTick((n) => n + 1), []);

  React.useEffect(() => {
    // Reset to neutral state whenever the address changes.
    setBalance("0");
    setError(null);

    if (!isConnected || !address) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        // Soroban RPC doesn't expose native balances — query Horizon, which
        // returns the full account envelope including balances[].
        const url = `${HORIZON_URL}/accounts/${address}`;
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          throw new Error(`Horizon returned ${res.status}`);
        }
        const account = (await res.json()) as {
          balances?: { asset_type: string; balance: string }[];
        };
        if (cancelled) return;

        const native = account.balances?.find((b) => b.asset_type === "native");
        if (!native) {
          setBalance("0");
          setError(null);
          return;
        }
        // Horizon returns `"1000000000.0000000"` — 7 decimal places (stroops).
        const fixed = native.balance.padEnd(
          native.balance.indexOf(".") + 7 + 1,
          "0",
        );
        const [wholePart, fracPart = ""] = fixed.split(".");
        const frac7 = fracPart.padEnd(7, "0").slice(0, 7);
        const stroops =
          BigInt(wholePart) * BigInt(STROOPS_PER_XLM) + BigInt(frac7);
        const whole = stroops / BigInt(STROOPS_PER_XLM);
        const frac =
          (stroops % BigInt(STROOPS_PER_XLM)) / BigInt(STROOPS_PER_XLM / 10);
        setBalance(`${whole}.${frac.toString().padStart(1, "0")}`);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setBalance("0");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected, refreshKey, tick]);

  return { balance, isLoading, error, refresh };
}
