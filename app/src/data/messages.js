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
    if (!wallet || selectedChat === undefined) {
      return [];
    }
    try {
      const { messages } = await lcd.wasm.contractQuery(
        network.messengerContract,
        {
          get_messages: {
            chat_id: selectedChat,
          },
        },
      );
      return messages.map(m => {
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
