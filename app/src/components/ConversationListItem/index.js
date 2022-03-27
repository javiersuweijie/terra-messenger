import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import shave from 'shave';
import { selectedChatState } from '../../data/chats';

import './ConversationListItem.css';

export default function ConversationListItem(props) {
  useEffect(() => {
    shave('.conversation-snippet', 20);
  });

  const [selectedChat, setSelectedChat] = useRecoilState(selectedChatState);

  const { id, name } = props.data;
  const profileSrc = name => {
    const last2 = name.slice(name.length - 2, name.length);
    return `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${last2}`;
  };

  const selectChat = () => {
    setSelectedChat(id);
  };

  const isSelected = () => {
    return selectedChat === id;
  };

  return (
    <div
      className={`conversation-list-item ${isSelected() ? 'selected' : ''}`}
      onClick={selectChat}
    >
      <img
        className="conversation-photo"
        src={profileSrc(name)}
        alt="conversation"
      />
      <div className="conversation-info">
        <h1 className="conversation-title">{name}</h1>
      </div>
    </div>
  );
}
