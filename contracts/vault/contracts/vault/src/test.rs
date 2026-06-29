#![cfg(test)]

use super::*;
use soroban_sdk::{
    contract, contractimpl,
    testutils::Address as _,
    Address, Env,
};

/// Minimal mock of WalletRegistry for inter-contract testing.
#[contract]
pub struct MockRegistry;

#[contractimpl]
impl MockRegistry {
    pub fn register(env: Env, wallet: Address) {
        env.storage().instance().set(&wallet, &true);
    }

    pub fn unregister(env: Env, wallet: Address) {
        env.storage().instance().remove(&wallet);
    }

    pub fn is_registered(env: Env, wallet: Address) -> bool {
        env.storage().instance().has(&wallet)
    }
}

fn setup_test_env() -> (Env, VaultClient<'static>, MockRegistryClient<'static>) {
    let env = Env::default();

    let registry_id = env.register(MockRegistry, ());
    let registry_client = MockRegistryClient::new(&env, &registry_id);

    let vault_id = env.register(Vault, ());
    let vault_client = VaultClient::new(&env, &vault_id);

    vault_client.init(&registry_id);

    (env, vault_client, registry_client)
}

#[test]
fn test_create_vault() {
    let (env, vault_client, registry_client) = setup_test_env();
    let wallet = Address::generate(&env);
    env.mock_all_auths();

    registry_client.register(&wallet);
    let info = vault_client.create_vault(&wallet);
    assert_eq!(info.balance, 0);
    assert_eq!(info.owner, wallet);
}

#[test]
fn test_create_vault_not_registered_fails() {
    let (env, vault_client, _registry_client) = setup_test_env();
    let wallet = Address::generate(&env);
    env.mock_all_auths();

    let result = vault_client.try_create_vault(&wallet);
    assert!(result.is_err());
}

#[test]
fn test_deposit() {
    let (env, vault_client, registry_client) = setup_test_env();
    let wallet = Address::generate(&env);
    env.mock_all_auths();

    registry_client.register(&wallet);
    vault_client.create_vault(&wallet);
    vault_client.deposit(&wallet, &1000);

    let info = vault_client.get_vault(&wallet);
    assert_eq!(info.balance, 1000);
}

#[test]
fn test_withdraw() {
    let (env, vault_client, registry_client) = setup_test_env();
    let wallet = Address::generate(&env);
    let recipient = Address::generate(&env);
    env.mock_all_auths();

    registry_client.register(&wallet);
    vault_client.create_vault(&wallet);
    vault_client.deposit(&wallet, &1000);
    vault_client.withdraw(&wallet, &500, &recipient);

    let info = vault_client.get_vault(&wallet);
    assert_eq!(info.balance, 500);
}

#[test]
fn test_withdraw_insufficient_balance_fails() {
    let (env, vault_client, registry_client) = setup_test_env();
    let wallet = Address::generate(&env);
    let recipient = Address::generate(&env);
    env.mock_all_auths();

    registry_client.register(&wallet);
    vault_client.create_vault(&wallet);
    vault_client.deposit(&wallet, &100);

    let result = vault_client.try_withdraw(&wallet, &200, &recipient);
    assert!(result.is_err());
}

#[test]
fn test_withdraw_not_registered_fails() {
    let (env, vault_client, registry_client) = setup_test_env();
    let wallet = Address::generate(&env);
    let recipient = Address::generate(&env);
    env.mock_all_auths();

    registry_client.register(&wallet);
    vault_client.create_vault(&wallet);
    vault_client.deposit(&wallet, &1000);
    vault_client.withdraw(&wallet, &500, &recipient);

    registry_client.unregister(&wallet);

    let result = vault_client.try_withdraw(&wallet, &100, &recipient);
    assert!(result.is_err());
}

#[test]
fn test_create_duplicate_vault_fails() {
    let (env, vault_client, registry_client) = setup_test_env();
    let wallet = Address::generate(&env);
    env.mock_all_auths();

    registry_client.register(&wallet);
    vault_client.create_vault(&wallet);
    let result = vault_client.try_create_vault(&wallet);
    assert!(result.is_err());
}

#[test]
fn test_get_vault_count() {
    let (env, vault_client, registry_client) = setup_test_env();
    let wallet1 = Address::generate(&env);
    let wallet2 = Address::generate(&env);
    env.mock_all_auths();

    registry_client.register(&wallet1);
    registry_client.register(&wallet2);

    assert_eq!(vault_client.get_vault_count(), 0);
    vault_client.create_vault(&wallet1);
    assert_eq!(vault_client.get_vault_count(), 1);
    vault_client.create_vault(&wallet2);
    assert_eq!(vault_client.get_vault_count(), 2);
}

#[test]
fn test_get_registry_address() {
    let (_env, vault_client, _registry_client) = setup_test_env();
    let registry_address = vault_client.get_registry_address();
    // Should return a valid address (not the zero address)
    assert!(registry_address != Address::generate(&_env));
}

#[test]
fn test_deposit_invalid_amount_fails() {
    let (env, vault_client, registry_client) = setup_test_env();
    let wallet = Address::generate(&env);
    env.mock_all_auths();

    registry_client.register(&wallet);
    vault_client.create_vault(&wallet);

    let result = vault_client.try_deposit(&wallet, &0);
    assert!(result.is_err());

    let result = vault_client.try_deposit(&wallet, &(-100));
    assert!(result.is_err());
}

#[test]
fn test_get_nonexistent_vault_fails() {
    let (env, vault_client, _registry_client) = setup_test_env();
    let wallet = Address::generate(&env);

    let result = vault_client.try_get_vault(&wallet);
    assert!(result.is_err());
}
