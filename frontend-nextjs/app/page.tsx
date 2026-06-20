"use client";

import { GuessGame } from "@/components/game/guess-game";

export default function Home() {
  return (
    <main className="flex flex-1 w-full max-w-3xl mx-auto flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">
          Guess the Number
        </h1>
        <p className="max-w-md text-base text-zinc-600 dark:text-zinc-400">
          A Soroban smart contract on Stellar testnet. Connect a wallet, pick a
          number from 1 to 5, and win 10 XLM on a correct guess.
        </p>
      </div>

      <GuessGame />
    </main>
  );
}
