import { atom, selector, useSetRecoilState } from 'recoil';
import { walletState } from './wallet';
import { networkState } from './networks';
import { LCDClient } from '@terra-money/terra.js';

export const selectedChatState = atom({
  key: 'SelectedChat',
  default: {},
});

export const chatsState = selector({
  key: 'Chats',
  default: [],
  get: async ({ get }) => {
    let wallet = get(walletState);
    let network = get(networkState);
    let lcd = new LCDClient({
      URL: network.lcd,
      chainID: network.chainId,
    });

    if (!wallet) {
      return [];
    }
    try {
      // TODO: pagination
      const chats = await lcd.wasm.contractQuery(network.messengerContract, {
        get_chats: {
          user: wallet.walletAddress,
        },
      });
      return chats.chats.map(c => {
        return {
          name: c.user2,
          id: c.chat_id,
        };
      });
    } catch (e) {
      return [];
    }
  },
});
