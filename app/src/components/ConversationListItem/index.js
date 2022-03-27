import React, { useEffect } from 'react';
import shave from 'shave';

import './ConversationListItem.css';

export default function ConversationListItem(props) {
  useEffect(() => {
    shave('.conversation-snippet', 20);
  });

  const { name } = props.data;
  const profileSrc = name => {
    const last2 = name.slice(name.length - 2, name.length);
    return `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${last2}`;
  };

  return (
    <div className="conversation-list-item">
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
