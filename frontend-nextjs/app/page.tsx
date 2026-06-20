"use client";

import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { useWallet } from "@/components/wallet/wallet-provider";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export default function Home() {
  const { address, isConnected } = useWallet();

  return (
    <main className="flex flex-1 w-full max-w-3xl mx-auto flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">
          Guess the Number
        </h1>
        <p className="max-w-md text-base text-zinc-600 dark:text-zinc-400">
          A Soroban smart contract on Stellar testnet. Connect a wallet, pick a
          number from 1 to 5, and win 10 XLM on a correct guess.
        </p>
      </div>

      <ConnectWalletButton />

      <Button
        onClick={() =>
          toast("Event has been created", {
            description: "Sunday, December 03, 2023 at 9:00 AM",
            action: {
              label: "Undo",
              onClick: () => console.log("Undo"),
            },
          })
        }
      >
        Show Toast
      </Button>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 min-h-6">
        {isConnected && address ? (
          <span>
            Connected as <span className="font-mono">{address}</span>
          </span>
        ) : (
          <span>No wallet connected.</span>
        )}
      </div>
    </main>
  );
}
