//! # M-of-N Upgrade Approval Integration Tests
//!
//! Covers the `approve_upgrade` pattern for retained Aureva v1 contracts:
//! `campaign` and `distribution`.
//!
//! ## Deferred
//!
//! Governance contract upgrade tests have been deferred to Aureva v2 alongside
//! the governance feature. See `contracts/governance/` in git history.

#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Events},
    vec, Address, BytesN, Env,
};

// ─────────────────────────────────────────────────────────────────────────────
// Campaign contract upgrade tests
// ─────────────────────────────────────────────────────────────────────────────

use campaign::{CampaignContract, CampaignContractClient};

fn deploy_campaign<'a>(
    env: &'a Env,
    signers: &soroban_sdk::Vec<Address>,
    threshold: u32,
) -> CampaignContractClient<'a> {
    let contract_id = env.register(CampaignContract, ());
    let client = CampaignContractClient::new(env, &contract_id);
    let admin = Address::generate(env);
    client.initialize(&admin, signers, &threshold);
    client
}

fn fake_hash(env: &Env, byte: u8) -> BytesN<32> {
    BytesN::from_array(env, &[byte; 32])
}

#[test]
fn campaign_single_signer_below_threshold_upgrade_blocked() {
    let env = Env::default();
    env.mock_all_auths();

    let s1 = Address::generate(&env);
    let s2 = Address::generate(&env);
    let s3 = Address::generate(&env);
    let signers = vec![&env, s1.clone(), s2.clone(), s3.clone()];
    let client = deploy_campaign(&env, &signers, 2);

    let hash = fake_hash(&env, 0xAA);
    client.approve_upgrade(&s1, &hash);

    assert_eq!(client.get_upgrade_approvals(&hash), 1);
    assert_eq!(client.get_threshold(), 2);
    assert_eq!(
        client.get_upgrade_approvals(&hash),
        1,
        "approval state must persist when threshold not reached"
    );
}

#[test]
fn campaign_threshold_reached_upgrade_executes_and_emits_event() {
    let env = Env::default();
    env.mock_all_auths();

    let s1 = Address::generate(&env);
    let s2 = Address::generate(&env);
    let signers = vec![&env, s1.clone(), s2.clone()];
    let client = deploy_campaign(&env, &signers, 2);

    let hash = fake_hash(&env, 0xBB);
    client.approve_upgrade(&s1, &hash);
    assert_eq!(client.get_upgrade_approvals(&hash), 1);

    client.approve_upgrade(&s2, &hash);

    assert_eq!(
        client.get_upgrade_approvals(&hash),
        0,
        "approvals must be cleared after upgrade executes"
    );
    assert!(!env.events().all().is_empty(), "upgraded event must be emitted");
}

#[test]
#[should_panic(expected = "already approved")]
fn campaign_duplicate_approval_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let s1 = Address::generate(&env);
    let s2 = Address::generate(&env);
    let signers = vec![&env, s1.clone(), s2.clone()];
    let client = deploy_campaign(&env, &signers, 2);

    let hash = fake_hash(&env, 0xCC);
    client.approve_upgrade(&s1, &hash);
    client.approve_upgrade(&s1, &hash);
}

#[test]
fn campaign_approval_state_cleared_after_upgrade() {
    let env = Env::default();
    env.mock_all_auths();

    let s1 = Address::generate(&env);
    let s2 = Address::generate(&env);
    let signers = vec![&env, s1.clone(), s2.clone()];
    let client = deploy_campaign(&env, &signers, 2);

    let hash = fake_hash(&env, 0xDD);
    client.approve_upgrade(&s1, &hash);
    client.approve_upgrade(&s2, &hash);

    assert_eq!(client.get_upgrade_approvals(&hash), 0);
}

#[test]
#[should_panic(expected = "not an authorized signer")]
fn campaign_unauthorized_signer_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let s1 = Address::generate(&env);
    let signers = vec![&env, s1.clone()];
    let client = deploy_campaign(&env, &signers, 1);

    let outsider = Address::generate(&env);
    let hash = fake_hash(&env, 0xEE);
    client.approve_upgrade(&outsider, &hash);
}

#[test]
fn campaign_different_hash_is_independent_ballot() {
    let env = Env::default();
    env.mock_all_auths();

    let s1 = Address::generate(&env);
    let s2 = Address::generate(&env);
    let signers = vec![&env, s1.clone(), s2.clone()];
    let client = deploy_campaign(&env, &signers, 2);

    let hash_a = fake_hash(&env, 0x11);
    let hash_b = fake_hash(&env, 0x22);

    client.approve_upgrade(&s1, &hash_a);
    client.approve_upgrade(&s2, &hash_b);

    assert_eq!(client.get_upgrade_approvals(&hash_a), 1);
    assert_eq!(client.get_upgrade_approvals(&hash_b), 1);
}

#[test]
fn campaign_three_of_five_accumulates_then_upgrades() {
    let env = Env::default();
    env.mock_all_auths();

    let signers: soroban_sdk::Vec<Address> = vec![
        &env,
        Address::generate(&env),
        Address::generate(&env),
        Address::generate(&env),
        Address::generate(&env),
        Address::generate(&env),
    ];
    let client = deploy_campaign(&env, &signers, 3);

    let hash = fake_hash(&env, 0x33);
    let s0 = signers.get(0).unwrap();
    let s1 = signers.get(1).unwrap();
    let s2 = signers.get(2).unwrap();

    client.approve_upgrade(&s0, &hash);
    assert_eq!(client.get_upgrade_approvals(&hash), 1);
    client.approve_upgrade(&s1, &hash);
    assert_eq!(client.get_upgrade_approvals(&hash), 2);
    client.approve_upgrade(&s2, &hash);
    assert_eq!(client.get_upgrade_approvals(&hash), 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Distribution contract upgrade tests
// ─────────────────────────────────────────────────────────────────────────────

use distribution::{DistributionContract, DistributionContractClient};

mod mock_token_for_upgrade {
    use soroban_sdk::{contract, contractimpl, Address, Env};

    #[contract]
    pub struct MockToken;

    #[contractimpl]
    impl MockToken {
        pub fn balance(_env: Env, _addr: Address) -> i128 {
            0
        }
    }
}

fn deploy_distribution<'a>(
    env: &'a Env,
    signers: &soroban_sdk::Vec<Address>,
    threshold: u32,
) -> DistributionContractClient<'a> {
    let token_id = env.register(mock_token_for_upgrade::MockToken, ());
    let contract_id = env.register(DistributionContract, ());
    let client = DistributionContractClient::new(env, &contract_id);
    let admin = Address::generate(env);
    client.initialize(&admin, &token_id, signers, &threshold);
    client
}

#[test]
fn distribution_single_signer_below_threshold_upgrade_blocked() {
    let env = Env::default();
    env.mock_all_auths();

    let s1 = Address::generate(&env);
    let s2 = Address::generate(&env);
    let signers = vec![&env, s1.clone(), s2.clone()];
    let client = deploy_distribution(&env, &signers, 2);

    let hash = fake_hash(&env, 0xAA);
    client.approve_upgrade(&s1, &hash);

    assert_eq!(client.get_upgrade_approvals(&hash), 1);
    assert_eq!(client.get_threshold(), 2);
}

#[test]
fn distribution_threshold_reached_upgrade_executes_and_emits_event() {
    let env = Env::default();
    env.mock_all_auths();

    let s1 = Address::generate(&env);
    let s2 = Address::generate(&env);
    let signers = vec![&env, s1.clone(), s2.clone()];
    let client = deploy_distribution(&env, &signers, 2);

    let hash = fake_hash(&env, 0xBB);
    client.approve_upgrade(&s1, &hash);
    assert_eq!(client.get_upgrade_approvals(&hash), 1);
    client.approve_upgrade(&s2, &hash);

    assert_eq!(client.get_upgrade_approvals(&hash), 0);
    assert!(!env.events().all().is_empty());
}

#[test]
#[should_panic(expected = "already approved")]
fn distribution_duplicate_approval_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let s1 = Address::generate(&env);
    let s2 = Address::generate(&env);
    let signers = vec![&env, s1.clone(), s2.clone()];
    let client = deploy_distribution(&env, &signers, 2);

    let hash = fake_hash(&env, 0xCC);
    client.approve_upgrade(&s1, &hash);
    client.approve_upgrade(&s1, &hash);
}

#[test]
fn distribution_approval_state_cleared_after_upgrade() {
    let env = Env::default();
    env.mock_all_auths();

    let s1 = Address::generate(&env);
    let s2 = Address::generate(&env);
    let signers = vec![&env, s1.clone(), s2.clone()];
    let client = deploy_distribution(&env, &signers, 2);

    let hash = fake_hash(&env, 0xDD);
    client.approve_upgrade(&s1, &hash);
    client.approve_upgrade(&s2, &hash);

    assert_eq!(client.get_upgrade_approvals(&hash), 0);
}

#[test]
#[should_panic(expected = "not an authorized signer")]
fn distribution_unauthorized_signer_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let s1 = Address::generate(&env);
    let signers = vec![&env, s1.clone()];
    let client = deploy_distribution(&env, &signers, 1);

    let outsider = Address::generate(&env);
    let hash = fake_hash(&env, 0xEE);
    client.approve_upgrade(&outsider, &hash);
}

#[test]
fn distribution_different_hash_is_independent_ballot() {
    let env = Env::default();
    env.mock_all_auths();

    let s1 = Address::generate(&env);
    let s2 = Address::generate(&env);
    let signers = vec![&env, s1.clone(), s2.clone()];
    let client = deploy_distribution(&env, &signers, 2);

    let hash_a = fake_hash(&env, 0x11);
    let hash_b = fake_hash(&env, 0x22);

    client.approve_upgrade(&s1, &hash_a);
    client.approve_upgrade(&s2, &hash_b);

    assert_eq!(client.get_upgrade_approvals(&hash_a), 1);
    assert_eq!(client.get_upgrade_approvals(&hash_b), 1);
}

#[test]
fn distribution_three_of_five_accumulates_then_upgrades() {
    let env = Env::default();
    env.mock_all_auths();

    let signers: soroban_sdk::Vec<Address> = vec![
        &env,
        Address::generate(&env),
        Address::generate(&env),
        Address::generate(&env),
        Address::generate(&env),
        Address::generate(&env),
    ];
    let client = deploy_distribution(&env, &signers, 3);

    let hash = fake_hash(&env, 0x44);
    let s0 = signers.get(0).unwrap();
    let s1 = signers.get(1).unwrap();
    let s2 = signers.get(2).unwrap();

    client.approve_upgrade(&s0, &hash);
    assert_eq!(client.get_upgrade_approvals(&hash), 1);
    client.approve_upgrade(&s1, &hash);
    assert_eq!(client.get_upgrade_approvals(&hash), 2);
    client.approve_upgrade(&s2, &hash);
    assert_eq!(client.get_upgrade_approvals(&hash), 0);
}
