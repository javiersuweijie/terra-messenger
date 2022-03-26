import React from 'react';
import {
  ConnectType,
  useWallet,
  WalletStates,
  WalletStatus,
} from '@terra-money/wallet-provider';

import Modal from 'react-modal';
import './WalletConnection.css';

const size = { width: 24, height: 24 };

export function WalletConnection() {
  const {
    availableConnections,
    availableInstallTypes,
    connect,
    install,
    status,
  } = useWallet();

  const modalIsOpen = () => {
    return status !== WalletStatus.WALLET_CONNECTED;
  };

  const buttons = []
    .concat(
      availableInstallTypes.includes(ConnectType.EXTENSION)
        ? {
            label: 'Terra Station Extension',
            image: '',
            onClick: () => install(ConnectType.EXTENSION),
          }
        : [],
    )
    .concat(
      (availableConnections || []).map(({ type, identifier, name, icon }) => ({
        image: <img src={icon} alt="" {...size} />,
        label: name,
        onClick: () =>
          connect(
            type,
            identifier,
          ),
      })),
    );

  return (
    <Modal
      className="connection-modal"
      overlayClassName="overlay"
      isOpen={modalIsOpen()}
      contentLabel="Example Modal"
    >
      <h1>Connect with your Terra Station Wallet</h1>
      {Object.entries(buttons).map(([key, { label, image, onClick }]) => (
        <div style={{ paddingBottom: '10px' }}>
          <button onClick={onClick} key={key}>
            {label}
          </button>
        </div>
      ))}
    </Modal>
  );
}
