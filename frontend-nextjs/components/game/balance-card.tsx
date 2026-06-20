"use client";

import * as React from "react";
import { ArrowsClockwise, Wallet } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/wallet/wallet-provider";
import { useXlmBalance } from "@/lib/use-xlm-balance";
import { cn } from "@/lib/utils";

function truncate(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`;
}

export interface BalanceCardProps {
  /**
   * Bump to force a balance refetch. Parent passes a counter that
   * increments after every guess result so the UI reflects the latest
   * payout / spend immediately.
   */
  refreshKey?: number;
}

export function BalanceCard({ refreshKey = 0 }: BalanceCardProps) {
  const { address, isConnected } = useWallet();
  const { balance, isLoading, error, refresh } = useXlmBalance(refreshKey);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="size-5" weight="duotone" />
          Wallet
        </CardTitle>
        {isConnected && (
          <Button
            type="button"
            variant="noShadow"
            size="icon"
            onClick={refresh}
            disabled={isLoading}
            aria-label="Refresh balance"
            title="Refresh balance"
          >
            <ArrowsClockwise
              className={cn("size-4", isLoading && "animate-spin")}
              weight="bold"
            />
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-1.5">
        {!isConnected ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Connect a wallet to see your XLM balance.
          </p>
        ) : (
          <>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {address ? truncate(address) : ""}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight tabular-nums">
                {balance}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                XLM
              </span>
            </div>
            {error ? (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            ) : isLoading ? (
              <p className="text-xs text-zinc-400">Fetching balance…</p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
