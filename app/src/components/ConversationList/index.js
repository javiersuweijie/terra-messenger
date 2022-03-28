import { Fee, LCDClient, MsgExecuteContract } from '@terra-money/terra.js';
import { default as React, useCallback } from 'react';
import { useRecoilRefresher_UNSTABLE, useRecoilValue } from 'recoil';
import { chatsState, selectedChatState } from '../../data/chats';
import { messagesState } from '../../data/messages';
import { networkState } from '../../data/networks';
import { walletState } from '../../data/wallet';
import ConversationListItem from '../ConversationListItem';
import Toolbar from '../Toolbar';
import ToolbarButton from '../ToolbarButton';
import './ConversationList.css';

export default function ConversationList(props) {
  const conversations = useRecoilValue(chatsState);
  const wallet = useRecoilValue(walletState);
  const network = useRecoilValue(networkState);
  const { name } = useRecoilValue(selectedChatState);
  const resetChatList = useRecoilRefresher_UNSTABLE(chatsState);

  const postTx = useCallback(
    async (executeMsg, contract) => {
      if (!wallet || !contract) {
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
        resetChatList();
      } catch (error) {
        console.error(error);
      }
    },
    [wallet],
  );

  const onAdd = useCallback(
    () => {
      const name = window.prompt('What is wallet address?');
      postTx(
        {
          send_message: {
            text: 'Hello! This is the start of our conversation',
            to: name,
          },
        },
        network.messengerContract,
      );
    },
    [postTx, name],
  );

  return (
    <div className="conversation-list">
      <Toolbar
        title="Messenger"
        rightItems={[
          <ToolbarButton
            key="add"
            icon="ion-ios-add-circle-outline"
            onClick={onAdd}
          />,
        ]}
      />
      {conversations.map(conversation => (
        <ConversationListItem key={conversation.id} data={conversation} />
      ))}
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
