//! Integration tests for Aureva Rewards Soroban contracts.
//!
//! Covers the core Aureva v1 reward lifecycle:
//!   1. Full reward lifecycle: campaign creation → reward issuance → redemption
//!   2. Cross-contract calls: reward_pool distributes via aureva_token
//!   3. Admin governance: two-step transfer, multisig threshold (AdminRoles)
//!   4. Error paths: double-init, overdraft, etc.
//!
//! ## Deferred test coverage (Aureva v2+)
//!
//! The following contract integrations have been intentionally deferred from
//! this test suite as part of the Aureva v1 scope reduction. The contracts
//! themselves are preserved in git history.
//!
//! - `referral` — ReferralHub on-chain referral registry (deferred: referral system)
//! - `vesting` — VestingContract cliff/linear release (deferred: tokenomics/vesting)
//!
//! These will be re-introduced when the corresponding features are built in v2.

#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    vec, Address, Env,
};

use admin_roles::{AdminRolesContract, AdminRolesContractClient};
use aureva_token::{AurevaToken, AurevaTokenClient};
use reward_pool::{RewardPool, RewardPoolClient};

// ── Shared setup ─────────────────────────────────────────────────────────────

struct Suite<'a> {
    env: Env,
    admin: Address,
    token: AurevaTokenClient<'a>,
    pool: RewardPoolClient<'a>,
    admin_roles: AdminRolesContractClient<'a>,
}

fn setup() -> Suite<'static> {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);

    let token_id = env.register(AurevaToken, ());
    let token = AurevaTokenClient::new(&env, &token_id);
    token.initialize(&admin);

    let pool_id = env.register(RewardPool, ());
    let pool = RewardPoolClient::new(&env, &pool_id);
    pool.initialize(&admin);

    let roles_id = env.register(AdminRolesContract, ());
    let admin_roles = AdminRolesContractClient::new(&env, &roles_id);
    admin_roles.initialize(&admin, &vec![&env], &1);

    Suite {
        env,
        admin,
        token,
        pool,
        admin_roles,
    }
}

// ── 1. Full reward lifecycle ──────────────────────────────────────────────────

/// Campaign creation → reward issuance → redemption (burn).
#[test]
fn test_full_reward_lifecycle() {
    let s = setup();
    let merchant = Address::generate(&s.env);
    let user = Address::generate(&s.env);

    // Step 1 – Campaign budget: merchant deposits into pool.
    s.token.mint(&merchant, &10_000);
    s.pool.deposit(&merchant, &5_000);
    assert_eq!(s.pool.balance(), 5_000);

    // Step 2 – Reward issuance: admin mints tokens to user.
    s.token.mint(&user, &1_000);
    assert_eq!(s.token.balance(&user), 1_000);

    // Step 3 – Redemption: user burns tokens.
    s.token.burn(&user, &1_000);
    assert_eq!(s.token.balance(&user), 0);
}

// ── 2. Cross-contract: pool distributes via token ────────────────────────────

/// reward_pool withdraw followed by aureva_token mint to user — simulates
/// the distribution contract calling both contracts in sequence.
#[test]
fn test_cross_contract_pool_to_token_distribution() {
    let s = setup();
    let user = Address::generate(&s.env);

    s.pool.deposit(&s.admin, &20_000);
    assert_eq!(s.pool.balance(), 20_000);

    let reward_amount = 500_i128;
    s.pool.withdraw(&s.admin, &reward_amount);
    s.token.mint(&user, &reward_amount);

    assert_eq!(s.pool.balance(), 19_500);
    assert_eq!(s.token.balance(&user), 500);
}

/// Multiple users receive rewards from the same campaign pool.
#[test]
fn test_multi_user_distribution_from_pool() {
    let s = setup();
    let users: Vec<Address> = (0..3).map(|_| Address::generate(&s.env)).collect();

    s.pool.deposit(&s.admin, &3_000);

    for user in &users {
        s.pool.withdraw(&s.admin, &1_000);
        s.token.mint(user, &1_000);
    }

    assert_eq!(s.pool.balance(), 0);
    for user in &users {
        assert_eq!(s.token.balance(user), 1_000);
    }
}

// ── 3. Token cross-contract: approve + transfer ───────────────────────────────

#[test]
fn test_token_approve_and_allowance() {
    let s = setup();
    let owner = Address::generate(&s.env);
    let spender = Address::generate(&s.env);

    s.token.mint(&owner, &2_000);
    s.token
        .approve(&owner, &spender, &500, &(s.env.ledger().sequence() + 1_000));
    assert_eq!(s.token.allowance(&owner, &spender), 500);
}

#[test]
fn test_token_transfer_between_users() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let bob = Address::generate(&s.env);

    s.token.mint(&alice, &1_000);
    s.token.transfer(&alice, &bob, &400);

    assert_eq!(s.token.balance(&alice), 600);
    assert_eq!(s.token.balance(&bob), 400);
}

// ── 4. Admin roles ────────────────────────────────────────────────────────────

/// Two-step admin transfer: propose → accept.
#[test]
fn test_admin_two_step_transfer() {
    let s = setup();
    let new_admin = Address::generate(&s.env);

    s.admin_roles.propose_admin(&new_admin);
    assert_eq!(s.admin_roles.get_pending_admin(), Some(new_admin.clone()));

    s.admin_roles.accept_admin();
    assert_eq!(s.admin_roles.get_admin(), new_admin);
    assert_eq!(s.admin_roles.get_pending_admin(), None);
}

#[test]
fn test_admin_multisig_config() {
    let s = setup();
    let s1 = Address::generate(&s.env);
    let s2 = Address::generate(&s.env);

    s.admin_roles.update_signers(&vec![&s.env, s1, s2]);
    s.admin_roles.update_threshold(&2);

    assert_eq!(s.admin_roles.get_threshold(), 2);
    assert_eq!(s.admin_roles.get_signers().len(), 2);
}

// ── 5. Error paths ────────────────────────────────────────────────────────────

#[test]
#[should_panic(expected = "already initialized")]
fn test_token_double_init_rejected() {
    let s = setup();
    let other = Address::generate(&s.env);
    s.token.initialize(&other);
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_pool_double_init_rejected() {
    let s = setup();
    let other = Address::generate(&s.env);
    s.pool.initialize(&other);
}

#[test]
#[should_panic(expected = "already initialised")]
fn test_admin_roles_double_init_rejected() {
    let s = setup();
    let other = Address::generate(&s.env);
    s.admin_roles.initialize(&other, &vec![&s.env], &1);
}

#[test]
#[should_panic(expected = "insufficient balance")]
fn test_token_burn_overdraft_rejected() {
    let s = setup();
    let user = Address::generate(&s.env);
    s.token.mint(&user, &100);
    s.token.burn(&user, &200);
}

#[test]
#[should_panic(expected = "insufficient pool balance")]
fn test_pool_withdraw_overdraft_rejected() {
    let s = setup();
    s.pool.withdraw(&s.admin, &1);
}

// ── 6. Distribution integration tests ────────────────────────────────────────

use distribution::{DistributionContract, DistributionContractClient, DistributionError};

struct DistSuite<'a> {
    env: Env,
    admin: Address,
    token: AurevaTokenClient<'a>,
    dist: DistributionContractClient<'a>,
    dist_id: Address,
}

fn dist_setup() -> DistSuite<'static> {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);

    let token_id = env.register(AurevaToken, ());
    let token = AurevaTokenClient::new(&env, &token_id);
    token.initialize(&admin);

    let dist_id = env.register(DistributionContract, ());
    let dist = DistributionContractClient::new(&env, &dist_id);
    dist.initialize(
        &admin,
        &token_id,
        &soroban_sdk::vec![&env, admin.clone()],
        &1,
    );

    DistSuite {
        env,
        admin,
        token,
        dist,
        dist_id,
    }
}

#[test]
fn test_distribution_full_lifecycle() {
    let s = dist_setup();
    s.env.cost_estimate().budget().reset_unlimited();
    s.env.host().set_invocation_resource_limits(None).unwrap();
    let merchant = Address::generate(&s.env);
    let campaign_id: u64 = 1;
    let reward_per_user: i128 = 100;
    let n: u32 = 50;

    s.dist
        .register_campaign(&campaign_id, &merchant, &reward_per_user, &0);

    let total_budget = reward_per_user * n as i128;
    s.token.mint(&s.dist_id, &total_budget);
    assert_eq!(s.dist.contract_balance(), total_budget);

    let mut recipients = soroban_sdk::Vec::new(&s.env);
    let mut amounts = soroban_sdk::Vec::new(&s.env);
    for _ in 0..n {
        recipients.push_back(Address::generate(&s.env));
        amounts.push_back(reward_per_user);
    }

    s.dist.distribute_batch(&campaign_id, &recipients, &amounts);

    for i in 0..n {
        let addr = recipients.get(i).unwrap();
        assert_eq!(s.token.balance(&addr), reward_per_user);
    }

    assert_eq!(s.dist.contract_balance(), 0);

    s.token.mint(&s.dist_id, &reward_per_user);
    let extra_user = Address::generate(&s.env);
    s.dist
        .distribute_reward(&campaign_id, &extra_user, &reward_per_user);
    assert_eq!(s.token.balance(&extra_user), reward_per_user);

    let expiry = s.env.ledger().sequence() + 1_000;
    s.token
        .approve(&extra_user, &s.dist_id, &reward_per_user, &expiry);
    s.dist.clawback(&extra_user);
    assert_eq!(s.token.balance(&extra_user), 0);

    s.token.mint(&s.dist_id, &reward_per_user);
    let late_user = Address::generate(&s.env);
    s.dist
        .distribute_reward(&campaign_id, &late_user, &reward_per_user);
    s.token
        .approve(&late_user, &s.dist_id, &reward_per_user, &(expiry + 10_000));

    s.env.ledger().with_mut(|l| {
        l.timestamp += 2_592_001;
    });

    let clawback_result = s.dist.try_clawback(&late_user);
    assert!(clawback_result.is_err(), "clawback after window should fail");
}

#[test]
fn test_distribution_insufficient_balance() {
    let s = dist_setup();
    let merchant = Address::generate(&s.env);
    let campaign_id: u64 = 2;
    let reward_per_user: i128 = 200;

    s.dist
        .register_campaign(&campaign_id, &merchant, &reward_per_user, &0);
    s.token.mint(&s.dist_id, &(reward_per_user * 2));

    let recipients: soroban_sdk::Vec<Address> = soroban_sdk::vec![
        &s.env,
        Address::generate(&s.env),
        Address::generate(&s.env),
        Address::generate(&s.env)
    ];
    let amounts = soroban_sdk::vec![&s.env, reward_per_user, reward_per_user, reward_per_user];

    let err = s
        .dist
        .try_distribute_batch(&campaign_id, &recipients, &amounts)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, DistributionError::InsufficientBalance);

    for i in 0..3u32 {
        assert_eq!(s.token.balance(&recipients.get(i).unwrap()), 0);
    }
    assert_eq!(s.dist.contract_balance(), reward_per_user * 2);
}

#[test]
fn test_distribution_ineligible_recipient() {
    let s = dist_setup();
    let merchant = Address::generate(&s.env);
    let campaign_id: u64 = 3;
    let reward: i128 = 50;
    let min_actions: u32 = 3;

    s.dist
        .register_campaign(&campaign_id, &merchant, &reward, &min_actions);
    s.token.mint(&s.dist_id, &10_000);

    let user = Address::generate(&s.env);

    let err = s
        .dist
        .try_distribute_reward(&campaign_id, &user, &reward)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, DistributionError::Ineligible);

    s.dist.record_action(&campaign_id, &user);
    s.dist.record_action(&campaign_id, &user);
    let err = s
        .dist
        .try_distribute_reward(&campaign_id, &user, &reward)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, DistributionError::Ineligible);

    s.dist.record_action(&campaign_id, &user);
    s.dist.distribute_reward(&campaign_id, &user, &reward);
    assert_eq!(s.token.balance(&user), reward);
}

#[test]
fn test_distribution_invalid_batch_size() {
    let s = dist_setup();
    let merchant = Address::generate(&s.env);
    let campaign_id: u64 = 4;
    let reward: i128 = 10;

    s.dist
        .register_campaign(&campaign_id, &merchant, &reward, &0);
    s.token.mint(&s.dist_id, &(reward * 60));

    let mut recipients = soroban_sdk::Vec::new(&s.env);
    let mut amounts = soroban_sdk::Vec::new(&s.env);
    for _ in 0..51 {
        recipients.push_back(Address::generate(&s.env));
        amounts.push_back(reward);
    }

    let err = s
        .dist
        .try_distribute_batch(&campaign_id, &recipients, &amounts)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, DistributionError::InvalidBatchSize);
}

#[test]
fn test_distribution_batch_length_mismatch() {
    let s = dist_setup();
    let merchant = Address::generate(&s.env);
    let campaign_id: u64 = 5;

    s.dist.register_campaign(&campaign_id, &merchant, &100, &0);
    s.token.mint(&s.dist_id, &10_000);

    let recipients =
        soroban_sdk::vec![&s.env, Address::generate(&s.env), Address::generate(&s.env)];
    let amounts = soroban_sdk::vec![&s.env, 100_i128];

    let err = s
        .dist
        .try_distribute_batch(&campaign_id, &recipients, &amounts)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, DistributionError::BatchLengthMismatch);
}
