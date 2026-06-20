# Guess the Number — Soroban Smart Contract

A minimal Soroban smart contract that runs a "guess the number" game on Stellar. The contract picks a random secret number in `1..=5`, accepts guesses from any address, pays out **10 XLM** to the winner from its own balance, and immediately rolls a new number for the next round.

> Built with `soroban-sdk = 25` against Stellar Protocol 25 (Futurenet / Testnet / Public).

---

## Game rules

| Event                                                       | Result                                                                                               |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Constructor runs                                            | Admin transfers **100 XLM** to the contract, contract rolls the first secret number                  |
| `guess(n, who)` correct (`n ∈ 1..=5` and equals the secret) | Pays **10 XLM** from the contract → `who`, **auto-rolls** a new secret, returns `true`               |
| `guess(n, who)` wrong (in-range but not equal)              | Returns `false`. No transfer. Number unchanged.                                                      |
| `guess(n, who)` outside `1..=5`                             | Returns `Err(InvalidGuess)`. No transfer.                                                            |
| Correct guess but contract balance < 10 XLM                 | Returns `Err(InsufficientRewardFunds)`. **No transfer, no reset.** The contract refuses to underpay. |

The contract is **honest by construction**: winners always get the full advertised 10 XLM, or no transfer happens at all.

---

## Project structure

```text
guess-the-number/
├── Cargo.toml                            # workspace: soroban-sdk = "25"
├── README.md                             # you are here
└── contracts/
    └── guess-the-number/
        ├── Cargo.toml
        └── src/
            ├── lib.rs        # GuessTheNumber contract
            ├── xlm.rs        # XLM Stellar Asset Contract helpers
            ├── error.rs      # Error enum
            └── test.rs       # Unit tests
```

---

## Contract API

### `__constructor(env, admin: Address, xlm: Address)`

Initializes the contract. Requires `admin.require_auth()`.

- `admin` — the account that funds the initial 100 XLM pot (must be funded first, e.g. via friendbot).
- `xlm` — the address of the XLM Stellar Asset Contract on the target network.

| Network              | XLM SAC address                                            |
| -------------------- | ---------------------------------------------------------- |
| **Testnet**          | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| **Public (Mainnet)** | `CAS3J7GYLGXOFYSUSJ2TYAH4EPU4QB3P4P3C3ZCHRZNSVPK3RYWPXK2P` |
| **Futurenet**        | `CABNKYN3LBWWSN4DDDYYR2MHXT23WP5Z6YBCVWQQY65ZQKQZG3Z4Q5KM` |
| **Standalone**       | Deploy your own SAC; no fixed address                      |

### `guess(env, user_number: u64, guesser: Address) -> Result<bool, Error>`

Submit a guess. See rules above.

### `admin(env) -> Option<Address>`

Read the admin (the account that funded the contract). Read-only.

### `number(env) -> u64` _(pub(crate))_

Read the current secret. Only accessible from inside the contract — useful for tests, **not** callable from off-chain.

---

## Prerequisites

- [Rust](https://rustup.rs/) + `wasm32v1-none` target: `rustup target add wasm32v1-none`
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli) v23+ (`stellar --version` to verify)
- `jq` — `brew install jq`
- A funded Stellar account identity: `stellar keys generate danzrrr && stellar keys fund danzrrr --network testnet`

---

## Build

```bash
cargo build \
  --manifest-path contracts/guess-the-number/Cargo.toml \
  --target wasm32v1-none \
  --release
```

Output: `target/wasm32v1-none/release/guess_the_number.wasm` (≈ 9 KB).

### Run tests

```bash
cargo test --manifest-path contracts/guess-the-number/Cargo.toml
```

All 5 tests should pass:

```
running 5 tests
test test::constructed_correctly ... ok
test test::guess_correct_pays_and_resets ... ok
test test::guess_wrong_does_not_reset ... ok
test test::invalid_guess_out_of_range ... ok
test test::insufficient_funds_blocks_reward_and_reset ... ok
```

---

## Deploy

### Option A — automated script (recommended)

A wrapper script lives at [`../stellar-guess-3/scripts/guess-the-number.sh`](../stellar-guess-3/scripts/guess-the-number.sh).

```bash
cd ../stellar-guess-3
chmod +x scripts/guess-the-number.sh

# Build + deploy in one shot
./scripts/guess-the-number.sh deploy

# (Optional) save the printed contract ID
export CONTRACT_ID=CAX7C56YHSQXFUYUVKR3A5GB7XHLX3B4F4LATAQAFI25ZWI7YNMURLUU
```

### Option B — manual CLI

```bash
# 1. Build the WASM
cargo build \
  --manifest-path contracts/guess-the-number/Cargo.toml \
  --target wasm32v1-none --release

# 2. Friendbot your source account if it isn't already funded
stellar keys fund danzrrr --network testnet

# 3. Resolve the admin address
ADMIN=$(stellar keys address danzrrr)

# 4. Deploy (constructor takes --admin then --xlm)
stellar contract deploy \
  --wasm target/wasm32v1-none/release/guess_the_number.wasm \
  --network testnet \
  --source-account danzrrr \
  -- \
    --admin "$ADMIN" \
    --xlm   CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

Save the printed contract ID (looks like `CAX7C56Y…URLUU`).

### Option C — programmatically (bindings)

After deployment, generate a TypeScript binding for a frontend:

```bash
stellar contract bindings typescript \
  --wasm target/wasm32v1-none/release/guess_the_number.wasm \
  --network testnet \
  --contract-id CAX7C56YHSQXFUYUVKR3A5GB7XHLX3B4F4LATAQAFI25ZWI7YNMURLUU \
  --output-dir ./bindings
```

---

## Interact

### Using the script

```bash
CONTRACT_ID=CAX7C56YHSQXFUYUVKR3A5GB7XHLX3B4F4LATAQAFI25ZWI7YNMURLUU

# Snapshot: admin + XLM balances
./scripts/guess-the-number.sh status

# Submit a guess (read-only by default; auto-broadcasts if correct)
./scripts/guess-the-number.sh guess 3

# Guess as a different identity (must exist in `stellar keys ls`)
./scripts/guess-the-number.sh guess 4 receiver1

# Top up the contract by 50 XLM
./scripts/guess-the-number.sh topup 50
```

### Using `stellar contract invoke` directly

```bash
CONTRACT_ID=CAX7C56YHSQXFUYUVKR3A5GB7XHLX3B4F4LATAQAFI25ZWI7YNMURLUU

# Read admin (read-only)
stellar contract invoke \
  --id "$CONTRACT_ID" --network testnet --source-account danzrrr -- admin

# Read the contract's XLM balance
stellar contract invoke \
  --id CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC \
  --network testnet --source-account danzrrr -- balance --id "$CONTRACT_ID"

# Submit a guess (simulation only — pass --send=yes to broadcast)
stellar contract invoke \
  --id "$CONTRACT_ID" --network testnet --source-account danzrrr \
  -- guess --user_number 3 --guesser danzrrr
```

A `true` return value means a 10 XLM reward was paid and a new secret was rolled. A `false` means wrong guess, no state change.

---

## Known deployed contracts

| Network | Contract ID                                                | Explorer                                                                                                               |
| ------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Testnet | `CAX7C56YHSQXFUYUVKR3A5GB7XHLX3B4F4LATAQAFI25ZWI7YNMURLUU` | [lab.stellar.org](https://lab.stellar.org/r/testnet/contract/CAX7C56YHSQXFUYUVKR3A5GB7XHLX3B4F4LATAQAFI25ZWI7YNMURLUU) |

Admin: `GAQG4QHJTX4NHPEKSU6UE4NABDUV673HL6QCRSAJRYFWTAAPVKJU2QIH` (`danzrrr` identity).

---

## Security notes

- **PRNG is deterministic in tests.** `Env::default()` reseeds deterministically; do not use the test seed for real money. Production uses the host's PRNG via `env.prng()`.
- **Constructor has no upfront guard against double-deploy.** Re-running `deploy` creates a brand-new contract each time.
- **Reward is a fixed amount, not a variable payout.** If the contract balance drops below 10 XLM, the next correct guess is rejected with `InsufficientRewardFunds`. Refill via the `topup` helper or a direct SAC `transfer` to the contract.
- **Anyone can guess.** No access control on `guess` — by design. The contract pays out from its own balance; the guesser does not need to sign anything because no funds move from their account.
- **Admin is set once in the constructor.** There is no admin rotation, upgrade, or pause functionality in this version.

---

## References

- [Stellar Smart Contracts docs](https://developers.stellar.org/docs/build/smart-contracts/overview)
- [Soroban examples](https://github.com/stellar/soroban-examples)
- [Contract conventions: PRNG](https://developers.stellar.org/docs/build/smart-contracts/conventions/prng)
- [Contract testing guide](https://developers.stellar.org/docs/build/guides/testing)
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli)
