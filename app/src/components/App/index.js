import React, { Suspense } from 'react';
import Messenger from '../Messenger';
import Modal from 'react-modal';
import { WalletSubscriber } from '../WalletSubscriber';
import { WalletConnection } from '../WalletConnection';
import { RecoilRoot } from 'recoil';
import ReactDOM from 'react-dom';

Modal.setAppElement('#root');

export default function App() {
  return (
    <RecoilRoot>
      <Suspense fallback={<div>Loading...</div>}>
        <WalletSubscriber />
        <WalletConnection />
        <Messenger />
      </Suspense>
    </RecoilRoot>
  );
}
