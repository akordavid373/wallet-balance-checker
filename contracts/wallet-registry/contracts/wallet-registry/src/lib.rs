#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, log, symbol_short, Address, Env, String, Vec,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WalletInfo {
    pub label: String,
    pub registered_at: u64,
}

#[contracttype]
pub enum DataKey {
    Wallet(Address),
    AllWallets,
    WalletCount,
}

#[contracterror]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RegistryError {
    AlreadyRegistered = 1,
    NotRegistered = 2,
    InvalidLabel = 3,
}

#[contract]
pub struct WalletRegistry;

#[contractimpl]
impl WalletRegistry {
    pub fn register(env: Env, wallet: Address, label: String) -> Result<WalletInfo, RegistryError> {
        wallet.require_auth();

        if label.len() == 0 {
            return Err(RegistryError::InvalidLabel);
        }

        if env.storage().instance().has(&DataKey::Wallet(wallet.clone())) {
            return Err(RegistryError::AlreadyRegistered);
        }

        let ledger_timestamp = env.ledger().timestamp();
        let info = WalletInfo {
            label: label.clone(),
            registered_at: ledger_timestamp,
        };

        env.storage().instance().set(&DataKey::Wallet(wallet.clone()), &info);

        let mut wallets: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::AllWallets)
            .unwrap_or(Vec::new(&env));
        wallets.push_back(wallet.clone());
        env.storage().instance().set(&DataKey::AllWallets, &wallets);

        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::WalletCount)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::WalletCount, &(count + 1));

        env.events().publish(
            (symbol_short!("reg"), symbol_short!("wallet")),
            (wallet.clone(), label, ledger_timestamp),
        );

        log!(&env, "Wallet registered: {}", wallet);

        Ok(info)
    }

    pub fn get_wallet(env: Env, wallet: Address) -> Result<WalletInfo, RegistryError> {
        env.storage()
            .instance()
            .get(&DataKey::Wallet(wallet))
            .ok_or(RegistryError::NotRegistered)
    }

    pub fn get_all_wallets(env: Env) -> Vec<(Address, WalletInfo)> {
        let wallets: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::AllWallets)
            .unwrap_or(Vec::new(&env));
        let mut result: Vec<(Address, WalletInfo)> = Vec::new(&env);
        for w in wallets.iter() {
            if let Some(info) = env.storage().instance().get(&DataKey::Wallet(w.clone())) {
                result.push_back((w.clone(), info));
            }
        }
        result
    }

    pub fn remove_wallet(env: Env, wallet: Address) -> Result<(), RegistryError> {
        wallet.require_auth();

        if !env.storage().instance().has(&DataKey::Wallet(wallet.clone())) {
            return Err(RegistryError::NotRegistered);
        }

        let ledger_timestamp = env.ledger().timestamp();
        env.storage()
            .instance()
            .remove(&DataKey::Wallet(wallet.clone()));

        let wallets: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::AllWallets)
            .unwrap_or(Vec::new(&env));
        let mut filtered: Vec<Address> = Vec::new(&env);
        for w in wallets.iter() {
            if w != wallet {
                filtered.push_back(w.clone());
            }
        }
        env.storage()
            .instance()
            .set(&DataKey::AllWallets, &filtered);

        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::WalletCount)
            .unwrap_or(0);
        if count > 0 {
            env.storage()
                .instance()
                .set(&DataKey::WalletCount, &(count - 1));
        }

        env.events().publish(
            (symbol_short!("rem"), symbol_short!("wallet")),
            (wallet.clone(), ledger_timestamp),
        );

        log!(&env, "Wallet removed: {}", wallet);

        Ok(())
    }

    pub fn get_wallet_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::WalletCount)
            .unwrap_or(0)
    }

    pub fn is_registered(env: Env, wallet: Address) -> bool {
        env.storage()
            .instance()
            .has(&DataKey::Wallet(wallet))
    }

    pub fn update_label(
        env: Env,
        wallet: Address,
        new_label: String,
    ) -> Result<WalletInfo, RegistryError> {
        wallet.require_auth();

        if new_label.len() == 0 {
            return Err(RegistryError::InvalidLabel);
        }

        let existing: WalletInfo = env
            .storage()
            .instance()
            .get(&DataKey::Wallet(wallet.clone()))
            .ok_or(RegistryError::NotRegistered)?;

        let info = WalletInfo {
            label: new_label,
            registered_at: existing.registered_at,
        };

        env.storage()
            .instance()
            .set(&DataKey::Wallet(wallet.clone()), &info);

        log!(&env, "Wallet label updated: {}", wallet);

        Ok(info)
    }
}

mod test;
