import React from 'react';
import { useConnectedWallet } from '@terra-money/wallet-provider';
import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { walletState } from '../../data/wallet';

export function WalletSubscriber() {
  const wallet = useConnectedWallet();
  const setWalletState = useSetRecoilState(walletState);
  useEffect(
    () =>
      setWalletState(() => {
        return wallet;
      }),
    [wallet],
  );
  return <></>;
}
