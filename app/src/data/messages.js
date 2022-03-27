import { LCDClient } from '@terra-money/terra.js';
import { selector } from 'recoil';
import { selectedChatState } from './chats';
import { networkState } from './networks';
import { walletState } from './wallet';

export const messagesState = selector({
  key: 'Messages',
  default: [],
  get: async ({ get }) => {
    let wallet = get(walletState);
    let network = get(networkState);
    let selectedChat = get(selectedChatState);
    let lcd = new LCDClient({
      URL: network.lcd,
      chainID: network.chainId,
    });
    if (!wallet || selectedChat === {}) {
      return [];
    }
    const { id: chatId } = selectedChat;
    try {
      let fullMessages = [];
      let { messages } = await lcd.wasm.contractQuery(
        network.messengerContract,
        {
          get_messages: {
            chat_id: chatId,
          },
        },
      );
      fullMessages = fullMessages.concat(messages);
      while (messages.length > 0) {
        const lastMessage = fullMessages[fullMessages.length - 1];
        if (lastMessage) {
          const res = await lcd.wasm.contractQuery(network.messengerContract, {
            get_messages: {
              chat_id: chatId,
              last_message_id: lastMessage.message_id,
            },
          });
          messages = res.messages;
          fullMessages = fullMessages.concat(messages);
        } else {
          break;
        }
      }
      fullMessages.sort((a, b) => {
        return a.message_id - b.message_id;
      });
      return fullMessages.map(m => {
        return {
          ...m,
          timestamp: Number(m.timestamp.slice(0, m.timestamp.length - 6)),
        };
      });
    } catch (e) {
      console.log(e);
      return [];
    }
  },
});
