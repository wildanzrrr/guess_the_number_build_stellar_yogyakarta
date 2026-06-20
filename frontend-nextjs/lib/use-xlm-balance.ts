"use client";

import * as React from "react";
import { rpc } from "guess-the-number-bindings";
import { RPC_URL } from "@/lib/guess-client";
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
        const server = new rpc.Server(RPC_URL, { allowHttp: false });
        const account = await server.getAccount(address);
        if (cancelled) return;

        const native = account.balances.find(
          (b: { asset_type: string }) => b.asset_type === "native",
        );
        if (!native) {
          setBalance("0");
          setError(null);
        } else {
          const stroops = BigInt(
            (native as { balance: string }).balance.replace(".", ""),
          );
          // Native balance from Horizon/RPC is always in stroops as a string
          // like "1000000000". Convert to whole XLM with one decimal for UX.
          const whole = stroops / BigInt(STROOPS_PER_XLM);
          const frac =
            (stroops % BigInt(STROOPS_PER_XLM)) / BigInt(STROOPS_PER_XLM / 10);
          setBalance(`${whole}.${frac.toString().padStart(1, "0")}`);
          setError(null);
        }
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
