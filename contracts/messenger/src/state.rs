use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
  pub last_chat_id: u128,
  pub last_msg_id: u128,
}

pub const STATE: Item<State> = Item::new("state");
pub const MESSAGES: Map<(u128, u128), String> = Map::new("messages");
pub const CHATS: Map<(&Addr, &Addr), u128> = Map::new("chats");
