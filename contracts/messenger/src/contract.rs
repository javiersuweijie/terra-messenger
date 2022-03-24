#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::{
  ExecuteMsg, GetChatsResponse, GetMessagesResponse, InstantiateMsg, MigrateMsg, QueryMsg,
};
use crate::state::{State, STATE};

// version info for migration info
const CONTRACT_NAME: &str = "crates.io:counter";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
  deps: DepsMut,
  _env: Env,
  info: MessageInfo,
  msg: InstantiateMsg,
) -> Result<Response, ContractError> {
  Ok(Response::new())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
  deps: DepsMut,
  _env: Env,
  info: MessageInfo,
  msg: ExecuteMsg,
) -> Result<Response, ContractError> {
  match msg {
    ExecuteMsg::SendMessage { data, to } => send_message(deps, info, data, to),
  }
}

fn send_message(
  deps: DepsMut,
  info: MessageInfo,
  data: String,
  to: String,
) -> Result<Response, ContractError> {
  Ok(Response::new())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
  match msg {
    QueryMsg::GetChats { user, offset } => to_binary(&get_chats(deps, user, offset)?),
    QueryMsg::GetMessages { chat_id, offset } => to_binary(&get_messages(deps, chat_id, offset)?),
  }
}

fn get_chats(deps: Deps, user: String, offset: u128) -> StdResult<GetChatsResponse> {
  Ok(GetChatsResponse {
    chats: vec![],
    next_offset: 0u128,
    total_count: 0u128,
  })
}

fn get_messages(deps: Deps, chat_id: u128, offset: u128) -> StdResult<GetMessagesResponse> {
  Ok(GetMessagesResponse {
    messages: vec![],
    next_offset: 0u128,
    total_count: 0u128,
  })
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn migrate(_deps: DepsMut, _env: Env, _msg: MigrateMsg) -> StdResult<Response> {
  Ok(Response::default())
}

#[cfg(test)]
mod tests {
  use super::*;
  use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
  use cosmwasm_std::{coins, from_binary};

  #[test]
  fn proper_initialization() {}
}
