#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Events as _}, Env, String, Address, Vec};

#[test]
fn test_register_and_get_wallet() {
    let env = Env::default();
    let contract_id = env.register(WalletRegistry, ());
    let client = WalletRegistryClient::new(&env, &contract_id);

    let wallet = Address::generate(&env);
    let label = String::from_str(&env, "My Wallet");

    env.mock_all_auths();
    let info = client.register(&wallet, &label);

    assert_eq!(info.label, label);

    let stored = client.get_wallet(&wallet);
    assert_eq!(stored.label, label);

    assert_eq!(client.get_wallet_count(), 1);
    assert!(client.is_registered(&wallet));
}

#[test]
fn test_get_all_wallets() {
    let env = Env::default();
    let contract_id = env.register(WalletRegistry, ());
    let client = WalletRegistryClient::new(&env, &contract_id);

    let wallet1 = Address::generate(&env);
    let wallet2 = Address::generate(&env);

    env.mock_all_auths();
    client.register(&wallet1, &String::from_str(&env, "Wallet 1"));
    client.register(&wallet2, &String::from_str(&env, "Wallet 2"));

    let all = client.get_all_wallets();
    assert_eq!(all.len(), 2);
    assert_eq!(client.get_wallet_count(), 2);
}

#[test]
fn test_remove_wallet() {
    let env = Env::default();
    let contract_id = env.register(WalletRegistry, ());
    let client = WalletRegistryClient::new(&env, &contract_id);

    let wallet = Address::generate(&env);
    env.mock_all_auths();
    client.register(&wallet, &String::from_str(&env, "To Remove"));

    assert!(client.is_registered(&wallet));
    assert_eq!(client.get_wallet_count(), 1);

    client.remove_wallet(&wallet);

    assert!(!client.is_registered(&wallet));
    assert_eq!(client.get_wallet_count(), 0);
}

#[test]
fn test_update_label() {
    let env = Env::default();
    let contract_id = env.register(WalletRegistry, ());
    let client = WalletRegistryClient::new(&env, &contract_id);

    let wallet = Address::generate(&env);
    env.mock_all_auths();
    client.register(&wallet, &String::from_str(&env, "Old Label"));

    let updated = client.update_label(&wallet, &String::from_str(&env, "New Label"));
    assert_eq!(updated.label, String::from_str(&env, "New Label"));
}

#[test]
fn test_register_same_wallet_fails() {
    let env = Env::default();
    let contract_id = env.register(WalletRegistry, ());
    let client = WalletRegistryClient::new(&env, &contract_id);

    let wallet = Address::generate(&env);
    env.mock_all_auths();
    client.register(&wallet, &String::from_str(&env, "First"));

    let result = client.try_register(&wallet, &String::from_str(&env, "Second"));
    assert!(result.is_err());
}

#[test]
fn test_remove_non_registered_fails() {
    let env = Env::default();
    let contract_id = env.register(WalletRegistry, ());
    let client = WalletRegistryClient::new(&env, &contract_id);

    let wallet = Address::generate(&env);
    env.mock_all_auths();
    let result = client.try_remove_wallet(&wallet);
    assert!(result.is_err());
}

#[test]
fn test_invalid_label_fails() {
    let env = Env::default();
    let contract_id = env.register(WalletRegistry, ());
    let client = WalletRegistryClient::new(&env, &contract_id);

    let wallet = Address::generate(&env);
    env.mock_all_auths();
    let result = client.try_register(&wallet, &String::from_str(&env, ""));
    assert!(result.is_err());
}

#[test]
fn test_events_emitted() {
    let env = Env::default();
    let contract_id = env.register(WalletRegistry, ());
    let client = WalletRegistryClient::new(&env, &contract_id);

    let wallet = Address::generate(&env);
    env.mock_all_auths();

    client.register(&wallet, &String::from_str(&env, "Event Test"));
    client.remove_wallet(&wallet);

    let events = env.events().all();
    assert!(events.events().len() >= 1);
}

#[test]
fn test_multiple_wallets() {
    let env = Env::default();
    let contract_id = env.register(WalletRegistry, ());
    let client = WalletRegistryClient::new(&env, &contract_id);

    env.mock_all_auths();
    let mut wallets: Vec<Address> = Vec::new(&env);
    let labels = ["Wallet A", "Wallet B", "Wallet C", "Wallet D", "Wallet E"];
    for &lbl in labels.iter() {
        let w = Address::generate(&env);
        client.register(&w, &String::from_str(&env, lbl));
        wallets.push_back(w);
    }

    assert_eq!(client.get_wallet_count(), 5);

    let all = client.get_all_wallets();
    assert_eq!(all.len(), 5);
}
