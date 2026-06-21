use soroban_sdk::{token::TokenClient, Address, Env, Symbol};

const XLM_KEY: Symbol = soroban_sdk::symbol_short!("XLM");
pub const ONE_XLM: i128 = 10_000_000; // 1 XLM = 10^7 stroops

/// Convert whole XLM to stroops.
pub const fn to_stroops(num: u64) -> i128 {
    (num as i128) * ONE_XLM
}

/// Convert a fractional XLM amount (in tenths of an XLM) to stroops.
/// e.g. `to_stroops_tenths(1)` = 0.1 XLM = 1_000_000 stroops.
pub const fn to_stroops_tenths(num: u64) -> i128 {
    (num as i128) * (ONE_XLM / 10)
}

/// Read the configured XLM SAC contract address from instance storage.
pub fn contract_id(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&XLM_KEY)
        .expect("XLM contract not configured. Deployer must pass the XLM SAC address.")
}

/// Persist the XLM SAC address in instance storage. Called once by the
/// constructor before any token transfers happen.
pub fn set_contract_id(env: &Env, xlm: &Address) {
    env.storage().instance().set(&XLM_KEY, xlm);
}

/// Build a token client for the configured XLM SAC.
pub fn token_client(env: &Env) -> TokenClient<'_> {
    TokenClient::new(env, &contract_id(env))
}
