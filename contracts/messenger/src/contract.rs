#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
  to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Order, Response, StdResult, Timestamp,
};
use cw2::set_contract_version;
use std::convert::TryInto;

use cw_storage_plus::{Bound, Endian, U64Key};

use crate::error::ContractError;
use crate::msg::{
  Chat, ExecuteMsg, GetChatsResponse, GetMessagesResponse, InstantiateMsg,
  Message as MessageResponse, MigrateMsg, QueryMsg,
};
use crate::state::{Message, State, CHATS, MESSAGES, STATE};

// version info for migration info
const CONTRACT_NAME: &str = "crates.io:counter";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
  deps: DepsMut,
  _env: Env,
  _info: MessageInfo,
  _msg: InstantiateMsg,
) -> Result<Response, ContractError> {
  STATE.save(
    deps.storage,
    &State {
      last_chat_id: 0,
      last_message_id: 0,
    },
  )?;
  Ok(Response::new())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
  deps: DepsMut,
  env: Env,
  info: MessageInfo,
  msg: ExecuteMsg,
) -> Result<Response, ContractError> {
  match msg {
    ExecuteMsg::SendMessage { data, to } => send_message(deps, info, env, data, to),
  }
}

fn send_message(
  deps: DepsMut,
  info: MessageInfo,
  env: Env,
  data: String,
  to: String,
) -> Result<Response, ContractError> {
  let from = info.sender;
  let to_addr = deps.api.addr_validate(&to)?;
  let message = Message {
    timestamp: env.block.time,
    from: from.to_string(),
    text: data,
  };

  let state = STATE.load(deps.storage)?;

  // Check if chat exists, else start a new chat
  let (chat_id, new_chat) = match CHATS.may_load(deps.storage, (&from, &to_addr))? {
    Some(chat_id) => (chat_id, false),
    None => (state.last_chat_id + 1, true),
  };

  if new_chat {
    CHATS.save(deps.storage, (&from, &to_addr), &chat_id)?;
    CHATS.save(deps.storage, (&to_addr, &from), &chat_id)?;
  }

  let message_id = state.last_message_id + 1;

  MESSAGES.save(
    deps.storage,
    (U64Key::from(chat_id), U64Key::from(message_id)),
    &message,
  )?;

  STATE.update(deps.storage, |mut s| -> StdResult<_> {
    if new_chat {
      s.last_chat_id = chat_id;
    }
    s.last_message_id = message_id;
    Ok(s)
  })?;

  Ok(Response::new().add_attributes(vec![("message_id", message_id.to_string())]))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
  match msg {
    QueryMsg::GetChats { user, last_user } => to_binary(&get_chats(deps, user, last_user)?),
    QueryMsg::GetMessages {
      chat_id,
      last_message_id,
    } => to_binary(&get_messages(deps, chat_id, last_message_id)?),
  }
}

fn get_chats(deps: Deps, user: String, last_user: Option<String>) -> StdResult<GetChatsResponse> {
  let lower_bound: Option<Bound> = match last_user {
    None => None,
    Some(user) => Some(Bound::exclusive(user)),
  };
  let user_addr = deps.api.addr_validate(&user)?;
  let chats: Vec<_> = CHATS
    .prefix(&user_addr)
    .range(deps.storage, lower_bound, None, Order::Ascending)
    .take(10)
    .filter_map(|item| -> Option<Chat> {
      match item {
        Ok(i) => {
          let user2 = String::from_utf8(i.0);
          match user2 {
            Ok(u) => Some(Chat {
              user1: user.clone(),
              user2: u,
              chat_id: i.1,
            }),
            _ => None,
          }
        }
        Err(_) => None,
      }
    })
    .collect();

  Ok(GetChatsResponse { chats: chats })
}

fn get_messages(
  deps: Deps,
  chat_id: u64,
  last_message_id: Option<u64>,
) -> StdResult<GetMessagesResponse> {
  let upper_bound: Option<Bound> = match last_message_id {
    None => None,
    Some(message_id) => Some(Bound::exclusive_int(message_id)),
  };
  let messages: Vec<_> = MESSAGES
    .prefix(chat_id.into())
    .range(deps.storage, None, upper_bound, Order::Descending)
    .take(10)
    .filter_map(|item| -> Option<MessageResponse> {
      match item {
        Ok(i) => {
          let message_id: Result<[u8; 8], _> = U64Key::from(i.0).wrapped[0..8].try_into();
          match message_id {
            Ok(mid) => {
              let message = i.1;
              Some(MessageResponse {
                message_id: Endian::from_be_bytes(mid),
                timestamp: message.timestamp,
                text: message.text,
              })
            }
            _ => None,
          }
        }
        Err(_) => None,
      }
    })
    .collect();
  Ok(GetMessagesResponse { messages: messages })
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn migrate(_deps: DepsMut, _env: Env, _msg: MigrateMsg) -> StdResult<Response> {
  Ok(Response::default())
}

#[cfg(test)]
mod tests {
  use super::*;
  use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
  use cosmwasm_std::{coins, from_binary, Addr};

  #[test]
  fn proper_initialization() {}

  #[test]
  fn get_chats_when_empty() {
    let deps = mock_dependencies(&vec![]);
    let user1 = Addr::unchecked("user1");
    let chats = get_chats(deps.as_ref(), user1.to_string(), None).unwrap();
    assert_eq!(chats, GetChatsResponse { chats: vec![] })
  }

  #[test]
  fn get_single_chat() {
    let mut deps = mock_dependencies(&vec![]);
    let user1 = Addr::unchecked("user1");
    let user2 = Addr::unchecked("user2");
    let chat1 = 1u64;
    CHATS
      .save(deps.as_mut().storage, (&user1, &user2), &chat1)
      .unwrap();

    let chats = get_chats(deps.as_ref(), user1.to_string(), None).unwrap();
    assert_eq!(
      chats,
      GetChatsResponse {
        chats: vec![Chat {
          user1: user1.to_string(),
          user2: user2.to_string(),
          chat_id: chat1,
        }],
      }
    )
  }

  #[test]
  fn get_multiple_chats() {
    let mut deps = mock_dependencies(&vec![]);
    let user1 = Addr::unchecked("user1");
    for n in 0..15 {
      let user2 = Addr::unchecked(format!("user{:0>3}", n));
      let chat1: u64 = n;
      CHATS
        .save(deps.as_mut().storage, (&user1, &user2), &chat1)
        .unwrap();
    }

    let chats = get_chats(deps.as_ref(), user1.to_string(), None).unwrap();
    assert_eq!(chats.chats.len(), 10,);

    let mut last_chat = &chats.chats[9];
    assert_eq!(last_chat.user2, "user009");
    let mut last_chat_user = &last_chat.user2;

    let next_chats = get_chats(
      deps.as_ref(),
      user1.to_string(),
      Some(last_chat_user.clone()),
    )
    .unwrap();
    assert_eq!(next_chats.chats.len(), 5,);
    assert_eq!(next_chats.chats[0].user2, "user010");
    assert_eq!(next_chats.chats[0].chat_id, 10u64);

    last_chat = &next_chats.chats[4];
    last_chat_user = &last_chat.user2;

    let next_chats = get_chats(
      deps.as_ref(),
      user1.to_string(),
      Some(last_chat_user.clone()),
    )
    .unwrap();
    assert_eq!(next_chats.chats.len(), 0,);
  }

  #[test]
  fn get_multiple_messages() {
    let mut deps = mock_dependencies(&vec![]);
    let chat_id = U64Key::from(1);
    for n in 0..15 {
      MESSAGES
        .save(
          deps.as_mut().storage,
          (chat_id.clone(), U64Key::from(n)),
          &Message {
            text: format!("text{}", n),
            from: "user1".to_string(),
            timestamp: Timestamp::from_nanos(1_000_000_202 + n),
          },
        )
        .unwrap();
    }

    let mut messages = get_messages(deps.as_ref(), 1, None).unwrap();
    assert_eq!(messages.messages.len(), 10);
    assert_eq!(
      messages.messages[0],
      MessageResponse {
        message_id: 14,
        text: "text14".into(),
        timestamp: Timestamp::from_nanos(1_000_000_202 + 14),
      }
    );

    let mut last_message_id = messages.messages[9].message_id;

    messages = get_messages(deps.as_ref(), 1, Some(last_message_id)).unwrap();
    assert_eq!(messages.messages.len(), 5);
    assert_eq!(
      messages.messages[0],
      MessageResponse {
        message_id: 4,
        text: "text4".into(),
        timestamp: Timestamp::from_nanos(1_000_000_202 + 4),
      }
    );

    last_message_id = messages.messages[4].message_id;
    messages = get_messages(deps.as_ref(), 1, Some(last_message_id)).unwrap();
    assert_eq!(messages.messages.len(), 0);
  }

  #[test]
  fn send_first_message() {
    let mut deps = mock_dependencies(&vec![]);
    let info = mock_info("user1", &vec![]);
    let env = mock_env();

    STATE
      .save(
        deps.as_mut().storage,
        &State {
          last_message_id: 0,
          last_chat_id: 0,
        },
      )
      .unwrap();
    send_message(
      deps.as_mut(),
      info,
      env,
      String::from("hello world"),
      String::from("terra1jh4th9u5zk4wa38wgtmxjmpsvwnsjevjqaz8h9"),
    )
    .unwrap();

    let state = STATE.load(deps.as_mut().storage).unwrap();
    assert_eq!(state.last_chat_id, 1);
    assert_eq!(state.last_message_id, 1);

    let message = MESSAGES
      .load(deps.as_mut().storage, (U64Key::from(1), U64Key::from(1)))
      .unwrap();
    assert_eq!(message.text, "hello world");
    assert_eq!(message.from, "user1");
  }

  #[test]
  fn send_follow_up_message() {
    let mut deps = mock_dependencies(&vec![]);
    let info = mock_info("user1", &vec![]);
    let env = mock_env();
    let user1 = Addr::unchecked("user1");
    let user2 = Addr::unchecked("terra1jh4th9u5zk4wa38wgtmxjmpsvwnsjevjqaz8h9");

    STATE
      .save(
        deps.as_mut().storage,
        &State {
          last_message_id: 1,
          last_chat_id: 1,
        },
      )
      .unwrap();

    CHATS
      .save(deps.as_mut().storage, (&user1, &user2), &1)
      .unwrap();
    CHATS
      .save(deps.as_mut().storage, (&user2, &user1), &1)
      .unwrap();

    send_message(
      deps.as_mut(),
      info,
      env,
      String::from("hello world"),
      String::from("terra1jh4th9u5zk4wa38wgtmxjmpsvwnsjevjqaz8h9"),
    )
    .unwrap();

    let state = STATE.load(deps.as_mut().storage).unwrap();
    assert_eq!(state.last_chat_id, 1);
    assert_eq!(state.last_message_id, 2);

    let message = MESSAGES
      .load(deps.as_mut().storage, (U64Key::from(1), U64Key::from(2)))
      .unwrap();
    assert_eq!(message.text, "hello world");
    assert_eq!(message.from, "user1");

    let info2 = mock_info("terra1jh4th9u5zk4wa38wgtmxjmpsvwnsjevjqaz8h9", &vec![]);
    let env2 = mock_env();
    send_message(
      deps.as_mut(),
      info2,
      env2,
      String::from("bye world"),
      String::from("user1"),
    )
    .unwrap();

    let state = STATE.load(deps.as_mut().storage).unwrap();
    assert_eq!(state.last_chat_id, 1);
    assert_eq!(state.last_message_id, 3);

    let message = MESSAGES
      .load(deps.as_mut().storage, (U64Key::from(1), U64Key::from(3)))
      .unwrap();
    assert_eq!(message.text, "bye world");
    assert_eq!(message.from, "terra1jh4th9u5zk4wa38wgtmxjmpsvwnsjevjqaz8h9");
  }
}
