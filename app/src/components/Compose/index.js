import {
  Fee,
  LCDClient,
  MsgExecuteContract,
  MsgSend,
} from '@terra-money/terra.js';
import { useWallet } from '@terra-money/wallet-provider';
import React, { useCallback } from 'react';
import {
  useRecoilRefresher_UNSTABLE,
  useRecoilValue,
  useResetRecoilState,
} from 'recoil';
import { selectedChatState } from '../../data/chats';
import { messagesState } from '../../data/messages';
import { networkState } from '../../data/networks';
import { walletState } from '../../data/wallet';
import './Compose.css';

export default function Compose(props) {
  const { connectedWallet } = useWallet();
  const wallet = useRecoilValue(walletState);
  const network = useRecoilValue(networkState);
  const { name } = useRecoilValue(selectedChatState);
  const resetChat = useRecoilRefresher_UNSTABLE(messagesState);

  const postTx = useCallback(
    async (executeMsg, contract) => {
      if (!wallet || !contract) {
        console.log(wallet, executeMsg, contract);
        return;
      }

      try {
        const { result } = await wallet.post({
          msgs: [
            new MsgExecuteContract(wallet.terraAddress, contract, executeMsg),
          ],
          fee: new Fee(1000000, '200000uusd'),
        });

        const pollResult = await pollTxInfo(wallet.network, result.txhash);
        console.log(pollResult);
        resetChat();
      } catch (error) {
        console.error(error);
      }
    },
    [wallet],
  );

  const submitMessage = useCallback(
    event => {
      if (event.code !== 'Enter') {
        return;
      }

      const message = event.target.value;
      if (message) {
        postTx(
          {
            send_message: {
              data: message,
              to: name,
            },
          },
          network.messengerContract,
        );
      }
      event.target.value = '';
    },
    [postTx, name],
  );

  return (
    <div className="compose">
      <input
        type="text"
        className="compose-input"
        placeholder="Type a message, @name"
        onKeyDown={submitMessage}
      />

      {props.rightItems}
    </div>
  );
}

async function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function pollTxInfo(network, txhash) {
  const until = Date.now() + 1000 * 60 * 60;
  const untilInterval = Date.now() + 1000 * 60;

  const lcd = new LCDClient({
    chainID: network.chainID,
    URL: network.lcd,
  });

  while (true) {
    let txInfo;

    try {
      txInfo = await lcd.tx.txInfo(txhash);
    } catch {}

    if (txInfo) {
      return txInfo;
    } else if (Date.now() < untilInterval) {
      await sleep(500);
    } else if (Date.now() < until) {
      await sleep(1000 * 10);
    } else {
      throw new Error(
        `Transaction queued. To verify the status, please check the transaction hash below.`,
      );
    }
  }
}
