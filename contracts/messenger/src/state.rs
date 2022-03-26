use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{Addr, Timestamp};
use cw_storage_plus::{Item, Map, U64Key};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
  pub last_chat_id: u64,
  pub last_msg_id: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Message {
  pub timestamp: Timestamp,
  pub text: String,
}

pub const STATE: Item<State> = Item::new("state");
pub const MESSAGES: Map<(U64Key, U64Key), Message> = Map::new("messages");
pub const CHATS: Map<(&Addr, &Addr), u64> = Map::new("chats");
