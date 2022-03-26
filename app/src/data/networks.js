import { selector } from 'recoil';
import { walletState } from './wallet';

export const networkState = selector({
  key: 'networkState',
  get: ({ get }) => {
    const wallet = get(walletState);
    console.log('wallet state changed', wallet);
    if (wallet && wallet.network && wallet.network.name) {
      console.log('network changing to ', Networks[wallet.network.name]);
      return Networks[wallet.network.name];
    } else {
      return Networks.mainnet;
    }
  },
});

export const Networks = {
  mainnet: {
    name: 'mainnet',
    chainID: 'columbus-5',
    lcd: 'https://lcd.terra.dev',
  },
  testnet: {
    name: 'testnet',
    chainID: 'bombay-12',
    lcd: 'https://bombay-lcd.terra.dev',
  },
  localterra: {
    name: 'localterra',
    chainID: 'localterra',
    lcd: 'http://localhost:1317',
  },
};

export const DefaultNetwork = Networks.testnet;