#![cfg(test)]

extern crate std;

use super::*;
use soroban_sdk::{
    testutils::{Address as _, StellarAssetContract},
    token::StellarAssetClient,
    Address, Env, Symbol,
};

/// Register an XLM Stellar Asset Contract for tests, mint 10,000 XLM to
/// `admin`, and return both the SAC address and its admin client.
fn setup_xlm<'a>(env: &'a Env, admin: &Address) -> (Address, StellarAssetClient<'a>) {
    let sac: StellarAssetContract = env.register_stellar_asset_contract_v2(admin.clone());
    let client = StellarAssetClient::new(env, &sac.address());
    client.mint(admin, &xlm::to_stroops(10_000));
    (sac.address(), client)
}

/// Register the contract with `(admin, xlm_sac_address)`.
fn init_client<'a>(env: &'a Env, admin: &Address, xlm: &Address) -> GuessTheNumberClient<'a> {
    let contract_id = env.register(GuessTheNumber, (admin.clone(), xlm.clone()));
    GuessTheNumberClient::new(env, &contract_id)
}

#[test]
fn constructed_correctly() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (xlm_addr, sac) = setup_xlm(&env, &admin);
    let contract_id = env.register(GuessTheNumber, (admin.clone(), xlm_addr.clone()));
    let client = GuessTheNumberClient::new(&env, &contract_id);

    // Admin was recorded.
    assert_eq!(client.admin(), Some(admin.clone()));
    // Contract was funded with the initial pot.
    assert_eq!(sac.balance(&contract_id), xlm::to_stroops(100));
    // First number is in range.
    let stored = env.as_contract(&contract_id, || GuessTheNumber::number(&env));
    assert!(
        (1..=5).contains(&stored),
        "stored number out of range: {stored}"
    );
}

#[test]
fn guess_correct_pays_and_resets() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (xlm_addr, sac) = setup_xlm(&env, &admin);
    let contract_id = env.register(GuessTheNumber, (admin.clone(), xlm_addr.clone()));
    let client = GuessTheNumberClient::new(&env, &contract_id);

    let initial = env.as_contract(&contract_id, || GuessTheNumber::number(&env));
    let alice = Address::generate(&env);
    // Fund alice so she can pay the 1 XLM bet.
    sac.mint(&alice, &xlm::to_stroops(100));
    let alice_balance_before = sac.balance(&alice);

    // Correct guess: pays 1 XLM bet, pays 10 XLM reward, resets the number.
    // Net effect on alice: +9 XLM. Net effect on contract: -9 XLM.
    assert_eq!(client.guess(&initial, &alice), Symbol::new(&env, "correct"));
    assert_eq!(
        sac.balance(&alice),
        alice_balance_before + xlm::to_stroops(9)
    );
    assert_eq!(
        sac.balance(&contract_id),
        xlm::to_stroops(100) - xlm::to_stroops(9)
    );

    // The stored number must have rolled — should still be in range.
    let after = env.as_contract(&contract_id, || GuessTheNumber::number(&env));
    assert!(
        (1..=5).contains(&after),
        "post-reset number out of range: {after}"
    );
}

#[test]
fn guess_wrong_does_not_reset() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (xlm_addr, sac) = setup_xlm(&env, &admin);
    let contract_id = env.register(GuessTheNumber, (admin.clone(), xlm_addr.clone()));
    let client = GuessTheNumberClient::new(&env, &contract_id);

    let stored = env.as_contract(&contract_id, || GuessTheNumber::number(&env));
    let wrong: u64 = if stored == 1 { 2 } else { 1 };
    assert_ne!(wrong, stored);

    let alice = Address::generate(&env);
    // Fund alice so she can pay the 1 XLM bet.
    sac.mint(&alice, &xlm::to_stroops(100));
    let alice_balance_before = sac.balance(&alice);
    let contract_balance_before = sac.balance(&contract_id);

    // Wrong guess: pays 1 XLM bet, no reward, number unchanged.
    assert_eq!(client.guess(&wrong, &alice), Symbol::new(&env, "incorrect"));
    assert_eq!(
        sac.balance(&alice),
        alice_balance_before - xlm::to_stroops(1)
    );
    assert_eq!(
        sac.balance(&contract_id),
        contract_balance_before + xlm::to_stroops(1)
    );

    // Number unchanged.
    let still_stored = env.as_contract(&contract_id, || GuessTheNumber::number(&env));
    assert_eq!(stored, still_stored);
}

#[test]
fn invalid_guess_out_of_range() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (xlm_addr, _) = setup_xlm(&env, &admin);
    let client = init_client(&env, &admin, &xlm_addr);
    let anyone = Address::generate(&env);

    assert_eq!(
        client.try_guess(&0_u64, &anyone).unwrap_err(),
        Ok(Error::InvalidGuess)
    );
    assert_eq!(
        client.try_guess(&6_u64, &anyone).unwrap_err(),
        Ok(Error::InvalidGuess)
    );
}

#[test]
fn failed_to_transfer_bet_when_guesser_has_no_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (xlm_addr, sac) = setup_xlm(&env, &admin);
    let contract_id = env.register(GuessTheNumber, (admin.clone(), xlm_addr.clone()));
    let client = GuessTheNumberClient::new(&env, &contract_id);

    let stored = env.as_contract(&contract_id, || GuessTheNumber::number(&env));
    let broke = Address::generate(&env);
    // broke has zero XLM — the 1 XLM bet transfer must fail.
    assert_eq!(sac.balance(&broke), 0);
    let contract_balance_before = sac.balance(&contract_id);

    assert_eq!(
        client.try_guess(&stored, &broke).unwrap_err(),
        Ok(Error::FailedToTransferBet)
    );
    // Contract balance unchanged — no bet was pulled.
    assert_eq!(sac.balance(&contract_id), contract_balance_before);
    // Number unchanged.
    let still_stored = env.as_contract(&contract_id, || GuessTheNumber::number(&env));
    assert_eq!(stored, still_stored);
}

#[test]
fn insufficient_funds_blocks_reward_and_reset() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (xlm_addr, sac) = setup_xlm(&env, &admin);
    let contract_id = env.register(GuessTheNumber, (admin.clone(), xlm_addr.clone()));
    let client = GuessTheNumberClient::new(&env, &contract_id);

    // Drain the contract below the reward threshold.
    let drain_to: i128 = xlm::to_stroops(5);
    let drained_by = sac.balance(&contract_id) - drain_to;
    sac.transfer(&contract_id, &admin, &drained_by);
    assert_eq!(sac.balance(&contract_id), drain_to);

    let stored = env.as_contract(&contract_id, || GuessTheNumber::number(&env));
    let alice = Address::generate(&env);
    // Fund alice so she can pay the 1 XLM bet.
    sac.mint(&alice, &xlm::to_stroops(100));
    let alice_balance_before = sac.balance(&alice);
    let contract_balance_before = sac.balance(&contract_id);

    assert_eq!(
        client.try_guess(&stored, &alice).unwrap_err(),
        Ok(Error::InsufficientRewardFunds)
    );
    // Soroban rolls back ALL state changes when a contract returns an
    // error, so the bet transfer is reverted too — alice keeps her XLM
    // and the contract balance is unchanged.
    assert_eq!(sac.balance(&alice), alice_balance_before);
    assert_eq!(sac.balance(&contract_id), contract_balance_before);
    // Number did NOT reset.
    let still_stored = env.as_contract(&contract_id, || GuessTheNumber::number(&env));
    assert_eq!(stored, still_stored);
}
