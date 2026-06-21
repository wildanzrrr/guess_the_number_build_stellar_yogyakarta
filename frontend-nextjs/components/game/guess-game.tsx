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

        // The simulation result is available before signing.
        // The contract returns a string: "correct" or "incorrect".
        // On an incorrect guess the contract keeps the 1 XLM bet and
        // does NOT change the stored number, so the SDK marks it as a
        // "read call" and signAndSend would throw NoSignatureNeeded.
        // We read the simulation result first to handle that case.
        const simResult = tx.result;

        if (simResult.isErr()) {
          const err = simResult.unwrapErr();
          toast.error("Guess failed", {
            description: describeContractError(err as unknown as number),
          });
          return;
        }

        const outcome = simResult.unwrap();

        if (outcome === "incorrect") {
          // Wrong guess — bet stays with the contract, no state change,
          // no need to sign & send.
          toast("Not this time", {
            description:
              "That wasn't the secret. Your 1 XLM bet stays with the contract — try again!",
            icon: <SmileyXEyes className="size-5" weight="duotone" />,
            duration: 5000,
          });
          return;
        }

        if (outcome !== "correct") {
          // Defensive: unknown string from the contract.
          toast.error("Unexpected result", {
            description: `Contract returned: ${outcome}`,
          });
          return;
        }

        // Correct guess — the transaction changes state (1 XLM bet in,
        // 10 XLM reward out, new random roll), so we need to sign and
        // send it on-chain.
        const { result } = await tx.signAndSend({ signTransaction });

        if (result.isErr()) {
          const err = result.unwrapErr();
          toast.error("Guess failed", {
            description: describeContractError(err as unknown as number),
          });
        } else {
          toast.success("Correct! You won 10 XLM 🎉", {
            description:
              "Net +9 XLM (1 XLM bet returned as part of the 10 XLM reward). A new secret number has been rolled — try again!",
            icon: <Confetti className="size-5" weight="duotone" />,
            duration: 6000,
          });
        }
      } catch (err) {
        console.error("Guess transaction failed", err);
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
