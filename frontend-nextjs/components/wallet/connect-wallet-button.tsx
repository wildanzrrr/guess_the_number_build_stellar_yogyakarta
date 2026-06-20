"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/wallet/wallet-provider";

/** Truncate a Stellar G-address for display: `GABC…WXYZ`. */
function truncate(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { address, isConnected, isReady, connect, disconnect } = useWallet();
  const [isWorking, setIsWorking] = React.useState(false);

  const handleConnect = async () => {
    setIsWorking(true);
    try {
      await connect();
    } catch (err) {
      console.error("Connect failed:", err);
    } finally {
      setIsWorking(false);
    }
  };

  const handleDisconnect = async () => {
    setIsWorking(true);
    try {
      await disconnect();
    } catch (err) {
      console.error("Disconnect failed:", err);
    } finally {
      setIsWorking(false);
    }
  };

  if (!isReady) {
    return (
      <Button type="button" disabled aria-busy>
        Loading wallet…
      </Button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="neutral"
          onClick={handleDisconnect}
          disabled={isWorking}
          title="Click to disconnect"
        >
          {truncate(address)}
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" onClick={handleConnect} disabled={isWorking}>
      {isWorking ? "Opening…" : "Connect Wallet"}
    </Button>
  );
}
