import React, { useEffect } from 'react';
import ConversationList from '../ConversationList';
import MessageList from '../MessageList';
import { useRecoilRefresher_UNSTABLE } from 'recoil';
import { messagesState } from '../../data/messages';
import './Messenger.css';

export default function Messenger(props) {
  const resetChat = useRecoilRefresher_UNSTABLE(messagesState);

  useEffect(() => {
    setInterval(() => {
      resetChat();
    }, 10000);
  });

  return (
    <div className="messenger">

      <div className="scrollable sidebar">
        <ConversationList />
      </div>

      <div className="scrollable content">
        <MessageList />
      </div>
    </div>
  );
}
