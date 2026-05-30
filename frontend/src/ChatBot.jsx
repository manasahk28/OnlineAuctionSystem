import { useState, useEffect, useRef } from 'react';
import './ChatBot.css';
import noaPic from './assets/girl-avatar.png';

const ChatBot = ({ hide }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMessages([{ from: 'nia', text: "Hey there! 👋 I'm Noa, your AI auction assistant. Ask me anything about our website!" }]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const sendMessage = async (query) => {
    const newMessages = [...messages, { from: 'user', text: query }];
    setMessages(newMessages);
    setIsTyping(true);

    const userObj = JSON.parse(localStorage.getItem('user'));
    const user_email = userObj ? userObj.email : '';

    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const backendUrl = isLocal ? 'https://online-auction-backend-mkn1.onrender.com' : (process.env.REACT_APP_BACKEND_URL || 'https://online-auction-backend-mkn1.onrender.com');
      const res = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          history: newMessages.slice(-10),
          user_email: user_email,
        }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        setMessages(prev => [...prev, { from: 'nia', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { from: 'nia', text: "I'm sorry, I'm having trouble thinking right now. 🤖 Please try again in a bit!" }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { from: 'nia', text: "I couldn't reach my AI servers. 🔌 Please check your connection or try again!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    const query = customInput.trim();
    if (!query) return;
    setCustomInput('');
    await sendMessage(query);
  };

  const handleSuggestionClick = async (question) => {
    if (isTyping) return;
    await sendMessage(question);
  };

  if (hide) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button className="chat-button" onClick={() => setIsOpen(true)}>
          <div className="avatar-circle">
            <img src={noaPic} alt="Noa" />
          </div>
          Any queries? <br /> <strong>Talk to Noa</strong>
        </button>
      )}

      {isOpen && <div className="chat-backdrop" onClick={() => setIsOpen(false)}></div>}

      {/* Side Panel */}
      <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <span>👩‍💻 Noa - Auction Assistant</span>
          <button
            className="closs-btn"
            onClick={() => {
              setIsOpen(false);
              setMessages([]);
            }}
          >×</button>
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

        {/* Suggestion Links (Just above the sender bar) */}
        <div className="default-suggestions" style={{ padding: '8px 15px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
          <button 
            type="button"
            className="suggestion-link"
            style={{ 
              background: 'none', 
              border: 'none', 
              padding: 0, 
              color: 'var(--color-secondary, #ff8800)', 
              textAlign: 'left', 
              cursor: 'pointer', 
              fontSize: '12px', 
              fontStyle: 'italic',
              textDecoration: 'underline'
            }}
            onClick={() => handleSuggestionClick("How do I place a bid?")}
            disabled={isTyping}
          >
            How do I place a bid?
          </button>
          <button 
            type="button"
            className="suggestion-link"
            style={{ 
              background: 'none', 
              border: 'none', 
              padding: 0, 
              color: 'var(--color-secondary, #ff8800)', 
              textAlign: 'left', 
              cursor: 'pointer', 
              fontSize: '12px', 
              fontStyle: 'italic',
              textDecoration: 'underline'
            }}
            onClick={() => handleSuggestionClick("How do I post an item for auction?")}
            disabled={isTyping}
          >
            How do I post an item for auction?
          </button>
        </div>

        <form onSubmit={handleCustomSubmit} className="chat-input">
          <input
            type="text"
            className="chat-input-field"
            placeholder="Type your question..."
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            disabled={isTyping}
          />
          <button type="submit" className="chat-input-btn" disabled={isTyping}>Send</button>
        </form>
      </div>
    </>
  );
};

export default ChatBot;
