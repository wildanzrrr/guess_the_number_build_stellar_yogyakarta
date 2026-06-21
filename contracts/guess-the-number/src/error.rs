#[soroban_sdk::contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// The contract failed to transfer the 0.5 XLM reward to the guesser.
    FailedToTransferReward = 1,
    /// The contract does not currently hold enough XLM to pay the 0.5 XLM reward.
    InsufficientRewardFunds = 2,
    /// The guess must be a whole number between 1 and 5 (inclusive).
    InvalidGuess = 3,
    /// The contract failed to pull the 0.1 XLM bet from the guesser.
    FailedToTransferBet = 4,
}
