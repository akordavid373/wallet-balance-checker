#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, log,
    Address, Env, Symbol, Val, vec,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VaultInfo {
    pub owner: Address,
    pub balance: i128,
    pub created_at: u64,
}

#[contracttype]
pub enum DataKey {
    Vault(Address),
    VaultCount,
    RegistryContract,
}

#[contracterror]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum VaultError {
    NotRegistered = 1,
    VaultNotFound = 2,
    InsufficientBalance = 3,
    AlreadyExists = 4,
}

#[contract]
pub struct Vault;

#[contractimpl]
impl Vault {
    pub fn init(env: Env, registry_contract: Address) {
        env.storage()
            .instance()
            .set(&DataKey::RegistryContract, &registry_contract);
        log!(&env, "Registry contract set: {}", registry_contract);
    }

    pub fn create_vault(env: Env, owner: Address) -> Result<VaultInfo, VaultError> {
        owner.require_auth();

        if env.storage().instance().has(&DataKey::Vault(owner.clone())) {
            return Err(VaultError::AlreadyExists);
        }

        let registry: Address = env
            .storage()
            .instance()
            .get(&DataKey::RegistryContract)
            .expect("Registry contract not initialized");

        let args = vec![&env, owner.clone().to_val()];
        let result: Val = env.invoke_contract(&registry, &Symbol::new(&env, "is_registered"), args);
        let is_registered: bool = result.try_into().unwrap_or(false);

        if !is_registered {
            return Err(VaultError::NotRegistered);
        }

        let ledger_timestamp = env.ledger().timestamp();
        let info = VaultInfo {
            owner: owner.clone(),
            balance: 0,
            created_at: ledger_timestamp,
        };

        env.storage().instance().set(&DataKey::Vault(owner.clone()), &info);

        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::VaultCount)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::VaultCount, &(count + 1));

        env.events().publish(
            ("VaultCreated", owner.clone()),
            ledger_timestamp,
        );

        log!(&env, "Vault created for: {}", owner);

        Ok(info)
    }

    pub fn deposit(env: Env, owner: Address, amount: i128) -> Result<VaultInfo, VaultError> {
        owner.require_auth();

        let mut info: VaultInfo = env
            .storage()
            .instance()
            .get(&DataKey::Vault(owner.clone()))
            .ok_or(VaultError::VaultNotFound)?;

        if amount <= 0 {
            return Err(VaultError::InsufficientBalance);
        }

        info.balance += amount;
        env.storage().instance().set(&DataKey::Vault(owner.clone()), &info);

        env.events().publish(
            ("VaultDeposited", owner.clone()),
            amount,
        );

        log!(&env, "Deposited {} into vault of {}", amount, owner);

        Ok(info)
    }

    pub fn withdraw(
        env: Env,
        owner: Address,
        amount: i128,
        to: Address,
    ) -> Result<VaultInfo, VaultError> {
        owner.require_auth();

        let registry: Address = env
            .storage()
            .instance()
            .get(&DataKey::RegistryContract)
            .expect("Registry contract not initialized");

        let args = vec![&env, owner.clone().to_val()];
        let result: Val = env.invoke_contract(&registry, &Symbol::new(&env, "is_registered"), args);
        let is_registered: bool = result.try_into().unwrap_or(false);

        if !is_registered {
            return Err(VaultError::NotRegistered);
        }

        let mut info: VaultInfo = env
            .storage()
            .instance()
            .get(&DataKey::Vault(owner.clone()))
            .ok_or(VaultError::VaultNotFound)?;

        if amount <= 0 || amount > info.balance {
            return Err(VaultError::InsufficientBalance);
        }

        info.balance -= amount;
        env.storage().instance().set(&DataKey::Vault(owner.clone()), &info);

        env.events().publish(
            ("VaultWithdrawn", owner.clone(), to.clone()),
            amount,
        );

        log!(&env, "Withdrew {} from vault of {} to {}", amount, owner, to);

        Ok(info)
    }

    pub fn get_vault(env: Env, owner: Address) -> Result<VaultInfo, VaultError> {
        env.storage()
            .instance()
            .get(&DataKey::Vault(owner))
            .ok_or(VaultError::VaultNotFound)
    }

    pub fn get_vault_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::VaultCount)
            .unwrap_or(0)
    }

    pub fn get_registry_address(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::RegistryContract)
            .expect("Registry contract not initialized")
    }
}

mod test;
