"use client";

import * as React from "react";
import { toast } from "sonner";
import { Confetti, SmileyXEyes } from "@phosphor-icons/react";
import { guessClient, Errors as ContractErrors } from "@/lib/guess-client";
import { useWallet } from "@/components/wallet/wallet-provider";
import { BalanceCard } from "@/components/game/balance-card";
import { NumberPad } from "@/components/game/number-pad";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";

/** Map a Stellar contract error code to a human-friendly message. */
function describeContractError(code: number | string): string {
  const key = typeof code === "string" ? Number(code) : code;
  const entry = ContractErrors[key as keyof typeof ContractErrors];
  if (entry) return `${entry.message} (error #${key})`;
  return `Contract error #${key}`;
}

export function GuessGame() {
  const { address, isConnected, signTransaction } = useWallet();
  const [pendingGuess, setPendingGuess] = React.useState<number | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleGuess = React.useCallback(
    async (n: number) => {
      if (!isConnected || !address) {
        toast.error("Connect a wallet first.");
        return;
      }
      if (pendingGuess !== null) return; // ignore double-submits

      setPendingGuess(n);
      try {
        const tx = await guessClient.guess(
          { user_number: BigInt(n), guesser: address },
          { publicKey: address },
        );
        const { result } = await tx.signAndSend({ signTransaction });

        if (result.isErr()) {
          // Stellar contract error (decode from the on-chain code).
          const err = result.unwrapErr();
          toast.error("Guess failed", {
            description: describeContractError(err as unknown as number),
          });
        } else {
          const correct = result.unwrap();
          if (correct) {
            toast.success("Correct! +10 XLM 🎉", {
              description:
                "The contract paid you 10 XLM and rolled a new number. Try again?",
              icon: <Confetti className="size-4" weight="duotone" />,
            });
          } else {
            toast("Not this time", {
              description: "That guess wasn't the secret. Try a different number.",
              icon: <SmileyXEyes className="size-4" weight="duotone" />,
            });
          }
        }
      } catch (err) {
        // Anything thrown before result (wallet rejection, network, etc.)
        toast.error("Transaction failed", {
          description: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setPendingGuess(null);
        // Always refetch balance — win, lose, or error — so the UI stays
        // in sync with whatever the chain says.
        setRefreshKey((k) => k + 1);
      }
    },
    [address, isConnected, signTransaction, pendingGuess],
  );

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <BalanceCard refreshKey={refreshKey} />

      {!isConnected ? (
        <ConnectWalletButton />
      ) : (
        <NumberPad
          onGuess={handleGuess}
          disabled={pendingGuess !== null}
          pendingGuess={pendingGuess}
        />
      )}
    </div>
  );
}
