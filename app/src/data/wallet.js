import { atom } from 'recoil';

export const walletAddressState = atom({
  key: 'walletAddress',
  default: '',
});

export const walletNetworkState = atom({
  key: 'walletNetwork',
  default: {},
});

export const walletState = atom({
  key: 'walletState',
  default: {},
});
