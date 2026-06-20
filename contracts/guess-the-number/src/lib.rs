#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol};

mod error;
mod xlm;

use error::Error;

#[contract]
pub struct GuessTheNumber;

const THE_NUMBER: Symbol = symbol_short!("n");
const ADMIN_KEY: Symbol = symbol_short!("ADMIN");
const MIN: u64 = 1;
const MAX: u64 = 5;
const REWARD_XLM: u64 = 10;
const INITIAL_FUNDING_XLM: u64 = 100;

#[contractimpl]
impl GuessTheNumber {
    /// Constructor.
    ///
    /// `admin` funds the contract with `INITIAL_FUNDING_XLM` XLM out of its
    /// own balance (the deployer should friendbot the admin first).
    /// `xlm` is the address of the XLM Stellar Asset Contract on the target
    /// network — the deployer supplies it explicitly so the contract stays
    /// network-agnostic.
    pub fn __constructor(env: &Env, admin: Address, xlm: Address) {
        admin.require_auth();
        xlm::set_contract_id(env, &xlm);
        xlm::token_client(env).transfer(
            &admin,
            &env.current_contract_address(),
            &xlm::to_stroops(INITIAL_FUNDING_XLM),
        );
        env.storage().instance().set(&ADMIN_KEY, &admin);
        Self::roll_number(env);
    }

    /// Submit a guess. Returns `Ok(true)` if the guess matches and the
    /// caller has been rewarded, `Ok(false)` on a wrong guess.
    /// Returns:
    /// - `Err(InvalidGuess)` if the guess is outside `1..=5`.
    /// - `Err(InsufficientRewardFunds)` if the contract cannot pay the
    ///   full 10 XLM reward (no transfer, no reset).
    /// - `Err(FailedToTransferReward)` if the token transfer itself fails.
    ///
    /// On a correct guess the contract pays 10 XLM to the `guesser` and
    /// immediately rolls a new random number for the next round.
    pub fn guess(env: &Env, user_number: u64, guesser: Address) -> Result<bool, Error> {
        if user_number < MIN || user_number > MAX {
            return Err(Error::InvalidGuess);
        }

        let contract_address = env.current_contract_address();
        let xlm = xlm::token_client(env);

        if user_number == Self::number(env) {
            let reward = xlm::to_stroops(REWARD_XLM);
            let balance = xlm.balance(&contract_address);
            if balance < reward {
                return Err(Error::InsufficientRewardFunds);
            }
            if xlm
                .try_transfer(&contract_address, &guesser, &reward)
                .is_err()
            {
                return Err(Error::FailedToTransferReward);
            }
            Self::roll_number(env);
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// Read the currently stored number. Public-within-crate so tests can
    /// drive the comparison path.
    pub(crate) fn number(env: &Env) -> u64 {
        // Safe: the constructor always sets `THE_NUMBER` before any
        // other contract method can be invoked.
        unsafe { env.storage().instance().get(&THE_NUMBER).unwrap_unchecked() }
    }

    /// Read the configured admin (the account that funded the contract).
    pub fn admin(env: &Env) -> Option<Address> {
        env.storage().instance().get(&ADMIN_KEY)
    }

    // Roll a new random number in `MIN..=MAX` and persist it.
    fn roll_number(env: &Env) {
        let new_number: u64 = env.prng().gen_range(MIN..=MAX);
        env.storage().instance().set(&THE_NUMBER, &new_number);
    }
}

mod test;
