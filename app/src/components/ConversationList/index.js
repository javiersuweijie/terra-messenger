import React, { useState, useEffect } from 'react';
import ConversationSearch from '../ConversationSearch';
import ConversationListItem from '../ConversationListItem';
import Toolbar from '../Toolbar';
import ToolbarButton from '../ToolbarButton';
import axios from 'axios';

import './ConversationList.css';
import { useRecoilState, useRecoilValue } from 'recoil';
import { chatsState } from '../../data/chats';

export default function ConversationList(props) {
  const conversations = useRecoilValue(chatsState);

  return (
    <div className="conversation-list">
      <Toolbar
        title="Messenger"
        leftItems={[<ToolbarButton key="cog" icon="ion-ios-cog" />]}
        rightItems={[
          <ToolbarButton key="add" icon="ion-ios-add-circle-outline" />,
        ]}
      />
      <ConversationSearch />
      {conversations.map(conversation => (
        <ConversationListItem key={conversation.id} data={conversation} />
      ))}
    </div>
  );
}
