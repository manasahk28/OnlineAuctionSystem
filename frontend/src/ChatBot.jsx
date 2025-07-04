import React, { useState, useEffect, useRef } from 'react';
import './ChatBot.css';
import noaPic from './assets/girl-avatar.png';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          from: 'nia',
          text: "Hey there! 👋 I'm Noa, your auction guide. Ask me anything!",
        },
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage) return;

    setMessages((prev) => [...prev, { from: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:5000/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          email: user?.email || '',
        }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { from: 'nia', text: data.response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          from: 'nia',
          text: "Oops! Something went wrong while talking to the server. Please try again later.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      <button className="chat-button" onClick={() => setIsOpen(!isOpen)}>
        <div className="avatar-circle">
          <img src={noaPic} alt="Noa" />
        </div>
        Any queries? <br /> <strong>Talk to Noa</strong>
      </button>

      {isOpen && <div className="chat-backdrop" onClick={() => setIsOpen(false)}></div>}

      <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <span>👩‍💻 Noa - Auction Assistant</span>
          <button
            className="clos-btn"
            onClick={() => {
              setIsOpen(false);
              setMessages([]);
              setInput('');
            }}
          >
            ×
          </button>
        </div>

        <div className="chat-content">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.from}`}>{msg.text}</div>
          ))}

          {isTyping && (
            <div className="typing-indicator">
              <span>Noa is typing</span>
              <span className="dot">.</span>
              <span className="dot">.</span>
              <span className="dot">.</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="chat-input">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button onClick={handleSend}>Send</button>
        </div>
      </div>
    </>
  );
};

export default ChatBot;
