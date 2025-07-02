// import React from 'react';
import './ChatBot.css'; // We'll style it separately

const ChatBot = () => {
  const handleClick = () => {
    alert("Hi there! You can contact X via email: x@example.com or WhatsApp: +91-XXXXXX 📩");
  };

  return (
    <button className="chat-button" onClick={handleClick}>
    <div className="avatar-circle">
        <img src="\assets\girl-avatar.png" alt="Noa" />
      </div>
      Any queries? <br /> <strong>Talk to Noa</strong>
    </button>
  );
};

export default ChatBot;
