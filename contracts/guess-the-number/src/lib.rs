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
const BET_XLM: u64 = 1;
const REWARD_XLM: u64 = 10;
const INITIAL_FUNDING_XLM: u64 = 100;

/// Result symbols returned by `guess`. The frontend interprets these
/// strings to decide which toast to show.
const RESULT_CORRECT: Symbol = symbol_short!("correct");
const RESULT_INCORRECT: Symbol = symbol_short!("incorrect");

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

    /// Submit a guess. The caller must first authorize a 1 XLM transfer
    /// to the contract as the cost of playing.
    ///
    /// Returns:
    /// - `Ok("correct")` if the guess matches — the contract pays the
    ///   10 XLM reward to the guesser and rolls a new random number.
    /// - `Ok("incorrect")` if the guess does not match — the bet stays
    ///   in the contract and the number is NOT rolled.
    ///
    /// Errors (all state changes are rolled back atomically by Soroban):
    /// - `Err(InvalidGuess)` if the guess is outside `1..=5`.
    /// - `Err(FailedToTransferBet)` if the 1 XLM bet could not be pulled
    ///   from the guesser.
    /// - `Err(InsufficientRewardFunds)` if the contract cannot pay the
    ///   full 10 XLM reward on a correct guess.
    /// - `Err(FailedToTransferReward)` if the reward transfer itself
    ///   fails.
    pub fn guess(env: &Env, user_number: u64, guesser: Address) -> Result<Symbol, Error> {
        if user_number < MIN || user_number > MAX {
            return Err(Error::InvalidGuess);
        }

        guesser.require_auth();

        let contract_address = env.current_contract_address();
        let xlm = xlm::token_client(env);

        // Pull the 1 XLM bet from the guesser first. If this fails the
        // contract state is unchanged.
        let bet = xlm::to_stroops(BET_XLM);
        if xlm.try_transfer(&guesser, &contract_address, &bet).is_err() {
            return Err(Error::FailedToTransferBet);
        }

        if user_number == Self::number(env) {
            // Correct guess — pay the 10 XLM reward and roll a new number.
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
            Ok(RESULT_CORRECT)
        } else {
            // Wrong guess — bet stays with the contract, number is kept.
            Ok(RESULT_INCORRECT)
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
