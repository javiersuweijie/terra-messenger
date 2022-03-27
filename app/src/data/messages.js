import { atom, selector, useSetRecoilState } from 'recoil';
import { walletState } from './wallet';

export const messagesState = selector({
  key: 'Messages',
  default: [],
  get: ({ get }) => {
    let wallet = get(walletState);
    if (!wallet) {
      return [];
    }
    return [
      {
        id: 0,
        author: 'apple',
        message: `I'm ${wallet.walletAddress}`,
        timestamp: new Date().getTime(),
      },
    ];
  },
});
