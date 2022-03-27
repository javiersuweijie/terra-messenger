import React, { useEffect, useRef } from 'react';
import Compose from '../Compose';
import Toolbar from '../Toolbar';
import ToolbarButton from '../ToolbarButton';
import Message from '../Message';
import moment from 'moment';
import {
  useWallet,
  WalletStates,
  WalletStatus,
} from '@terra-money/wallet-provider';
import './MessageList.css';
import { messagesState } from '../../data/messages';
import { useRecoilValue, useRecoilRefresher_UNSTABLE } from 'recoil';
import { walletState } from '../../data/wallet';
import { selectedChatState } from '../../data/chats';

const MY_USER_ID = 'apple';

export default function MessageList(props) {
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  };
  const messages = useRecoilValue(messagesState);
  const { name } = useRecoilValue(selectedChatState);

  useEffect(
    () => {
      scrollToBottom();
    },
    [messages],
  );

  const { disconnect, status } = useWallet();
  const wallet = useRecoilValue(walletState);

  const isConnected = () => {
    return status === WalletStatus.WALLET_CONNECTED;
  };

  const checkIsMine = address => {
    return wallet.walletAddress === address;
  };

  const renderMessages = () => {
    let i = 0;
    let messageCount = messages.length;
    let tempMessages = [];

    while (i < messageCount) {
      let previous = messages[i - 1];
      let current = messages[i];
      let next = messages[i + 1];
      let isMine = checkIsMine(current.from);
      let currentMoment = moment(current.timestamp);
      let prevBySameAuthor = false;
      let nextBySameAuthor = false;
      let startsSequence = true;
      let endsSequence = true;
      let showTimestamp = true;

      if (previous) {
        let previousMoment = moment(previous.timestamp);
        let previousDuration = moment.duration(
          currentMoment.diff(previousMoment),
        );
        prevBySameAuthor = previous.author === current.author;

        if (prevBySameAuthor && previousDuration.as('hours') < 1) {
          startsSequence = false;
        }

        if (previousDuration.as('hours') < 1) {
          showTimestamp = false;
        }
      }

      if (next) {
        let nextMoment = moment(next.timestamp);
        let nextDuration = moment.duration(nextMoment.diff(currentMoment));
        nextBySameAuthor = next.from === current.from;

        if (nextBySameAuthor && nextDuration.as('hours') < 1) {
          endsSequence = false;
        }
      }

      tempMessages.push(
        <Message
          key={i}
          isMine={isMine}
          startsSequence={startsSequence}
          endsSequence={endsSequence}
          showTimestamp={showTimestamp}
          data={current}
        />,
      );

      // Proceed to the next message.
      i += 1;
    }

    return tempMessages;
  };

  return (
    <div className="message-list">
      <Toolbar
        title={name ? name : 'Please select/start a conversation'}
        rightItems={[
          <button
            className="disconnection-modal"
            onClick={disconnect}
            disabled={!isConnected()}
          >
            {isConnected() ? 'Disconnect' : 'Connect'}
          </button>,
        ]}
      />

      <div className="message-list-container">{renderMessages()}</div>
      <div ref={messagesEndRef} />

      <Compose
        rightItems={[
          <ToolbarButton key="photo" icon="ion-ios-camera" />,
          <ToolbarButton key="image" icon="ion-ios-image" />,
          <ToolbarButton key="audio" icon="ion-ios-mic" />,
          <ToolbarButton key="money" icon="ion-ios-card" />,
          <ToolbarButton key="games" icon="ion-logo-game-controller-b" />,
          <ToolbarButton key="emoji" icon="ion-ios-happy" />,
        ]}
      />
    </div>
  );
}
