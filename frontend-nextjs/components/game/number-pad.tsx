"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface NumberPadProps {
  /** Called when the user confirms a number in the popover. */
  onGuess: (n: number) => void;
  /** Disable the whole pad (no wallet, or a guess is already in flight). */
  disabled?: boolean;
  /** The number currently being submitted, if any. */
  pendingGuess?: number | null;
}

const NUMBERS = [1, 2, 3, 4, 5] as const;

export function NumberPad({
  onGuess,
  disabled = false,
  pendingGuess = null,
}: NumberPadProps) {
  return (
    <div className="grid grid-cols-5 gap-3 w-full max-w-md">
      {NUMBERS.map((n) => (
        <NumberButton
          key={n}
          value={n}
          onConfirm={() => onGuess(n)}
          disabled={disabled}
          isPending={pendingGuess === n}
        />
      ))}
    </div>
  );
}

interface NumberButtonProps {
  value: number;
  onConfirm: () => void;
  disabled: boolean;
  isPending: boolean;
}

function NumberButton({ value, onConfirm, disabled, isPending }: NumberButtonProps) {
  const [open, setOpen] = React.useState(false);

  const handleConfirm = () => {
    setOpen(false);
    onConfirm();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="lg"
          variant="default"
          disabled={disabled}
          aria-busy={isPending}
          className="text-xl font-semibold tabular-nums h-14"
        >
          {isPending ? "…" : value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" side="top">
        <div className="flex flex-col gap-3">
          <div className="space-y-1">
            <p className="font-heading text-sm">Guess {value}?</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              This will submit a transaction to the Soroban contract. A correct
              guess pays 10 XLM from the contract to your wallet.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="neutral"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
