# Terra Messenger App

## Introduction

This is an experimental dapp that tries to re-create a messenger like experience on the Terra Blockchain. This is designed so that it is able to run fully on-chain without the need for any backend servers to index the transactions. Here are the list of features:

1. Able to start a chat with anyone using their wallet address
2. All chats are published in clear text and can be read by anyone
3. Currently only supports chats between two people but the contract technically supports group chats
4. Chats and messages are paginated with a hardcoded limit of 10 messages per query
5. O(1) to write and O(N) to read chats and messages
6. A "facebook messenger"-like UI is included in the `app` folder. Credits to: [https://github.com/sejr/react-messenger](https://github.com/sejr/react-messenger) for the base template.

## Screenshots

### Connecting your wallet
![image](https://user-images.githubusercontent.com/3447315/160289304-467a4f19-36dc-4e68-8cdf-83d0e7086bbe.png)

### Accessing your chats
![image](https://user-images.githubusercontent.com/3447315/160289319-89e8a7ad-d18f-48df-b8da-821a86dd7045.png)

## Contract Design
![image](https://user-images.githubusercontent.com/3447315/160311252-59cc5019-710b-42cd-85f6-8b2135caf419.png)


### Query Messages

#### QueryMsg::GetChats

Query to get the chats that a wallet address is involved in. The results are sorted by ascending user wallet address and returns a limit of 10 chats per call. Pagination is supported using the `last_user` parameter.

```rust
GetChats {
    user: String,
    last_user: Option<String>,
}
```

Input Parameters

- **user (String)**: Terra wallet address that you want to list the chats for
- **last_user** (Optional\<String\>): Value is used for pagination. The last address that was returned in a previous call so that the previous results can be excluded from the next search.

```rust
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct GetChatsResponse {
  pub chats: Vec<Chat>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Chat {
  pub chat_id: u64,
  pub user1: String,
  pub user2: String,
}
```

#### QueryMsg::GetMessages

Query to get a list of messages in a chat. The results are sorted by `message_id` in descending order (newest messages first). There is a 10 results limit per query but pagination is supported using the `last_message_id` parameter

```rust
GetMessages {
    chat_id: u64,
    last_message_id: Option<u64>,
}
```

Input Parameters:

- **chat_id (u64)** - The chat that the messages you are interested in belongs to
- **last_message_id (Option\<u64>)** - The last message that was returned in the previous call. If this is provided, the query will skip all messages before this. Used to support pagination.

```rust
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct GetMessagesResponse {
  pub messages: Vec<Message>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Message {
  pub from: String,
  pub message_id: u64,
  pub timestamp: Timestamp,
  pub text: String,
}
```

### Execute Messages

#### ExecuteMsg::SendMessage

Used to send a message to a wallet address. If no chat was created in the past between two wallets, this call will create a chat with a new `chat_id`. If a chat already exists, it will use that for the new message.

```rust
SendMessage { text: String, to: String },
```

### Storage

The following are the storages used in the contract. Every single message is stored in the contract. Deletion is not supported yet but it is possible to add.

#### State

State of the messenger contract. Keep tracks of a running count of the last chat and message IDs created so new ones can be created with unique IDs. Both IDs start from zero.

```rust
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
  pub last_chat_id: u64,
  pub last_message_id: u64,
}
```

#### Map<(user1, user2), chat_id>

Storage to keep track of which `chat_id` belongs to which pair of users. Everytime a new chat is created, a pair of records will be added to the storage.

1. `(user1, user2), chat_id`
2. `(user2, user1), chat_id`

This trades storage for query efficiency so that we can quickly search for all chats that a user is involved in just by using the first value in the tuple key.

```rust
pub const CHATS: Map<(&Addr, &Addr), u64> = Map::new("chats");
```

#### Map<(chat_id, message_id), Message>

Main storage to keep all messages sent in every chat.

```rust
pub struct Message {
  pub timestamp: Timestamp,
  pub from: String,
  pub text: String,
}

pub const MESSAGES: Map<(U64Key, U64Key), Message> = Map::new("messages");
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
```

## How to run on LocalTerra

### Deploying to LocalTerra

This project currently includes scripts to deploy to a running LocalTerra. Deployment address will be stored in `scripts/localterra.config.json`. In order to redeploy with an updated code, you will need to delete the `messengerCodeId` and `messengerAddr` and rerun the deployment script

```
npm i
ts-node scripts/deploy.ts
```

Update the LocalTerra messenger contract address in `app/src/data/networks.js` before running the UI.

### (Optional) Seed contract with conversations

There are some seed conversations that you can use to seed the contract storage. It currently assumes that you are using the `test1` account (`terra1x46rqay4d3cssq8gxxvqz8xt6nwlz4td20k38v`) as the main deployer and user of the dapp. Make sure your contract is already deployed to LocalTerra before running the seed scripts.

```
ts-node scripts/seed.ts
```

### Running the UI

A simple UI is included that you can use to:

1. Access chats
2. Read messages
3. Start chats
4. Send messages

```
cd app
npm i
npm start
```

By default, it should run on [http://localhost:3000](http://localhost:3000).

## Possible improvements

1. Encrypt messages using the public key of the recepient before posting the transaction.
2. Instead of storing messages in a contract, we could use an indexer to index `SendMessage` transactions directly.
3. Allow the creation of group chats.
4. Send tokens directly from dapp.
