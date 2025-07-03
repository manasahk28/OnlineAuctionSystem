import React, { useState, useEffect, useRef } from 'react';
import './ChatBot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showCategories, setShowCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const chatEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [askedQuestions, setAskedQuestions] = useState({});

  const categories = {
    Bidding: [
      {
        text: "How to bid?",
        next: [
          "To place a bid, go to the item's page you're interested in.",
          "Click the orange 'Bid Now' button.",
          "Enter a bid amount higher than the current highest bid + minimum increment.",
          "Hit 'Confirm Bid' and you're done! 🎉"
        ]
      },
      {
        text: "Where to see my bids?",
        next: [
          "Click on your profile (top-right corner).",
          "Select 'My Bids' from the sidebar — you'll find all your active and past bids. 📋"
        ]
      },
      {
        text: "What if someone bids higher than me?",
        next: [
          "You'll be notified instantly in-app.",
          "You can place a higher bid again if the auction is still active.",
          "Stay sharp — bidding wars are real! 🔥"
        ]
      },
      {
        text: "Can I increase my bid later?",
        next: [
          "Yes, you can place a new, higher bid anytime before the auction ends.",
          "Just go to the item again and click 'Bid Now'.",
          "Only the highest bid counts — we won't charge extra. 💰"
        ]
      }
    ],

    "Post-Bid": [
      {
        text: "What happens after I win a bid?",
        next: [
          "Woohoo! 🎉 If you're the highest bidder when the auction ends...",
          "The seller is notified and you'll get a confirmation via email.",
          "You'll also see a status update in 'My Bids'.",
          "Coordinate payment and delivery directly with the seller. 💳📦"
        ]
      },
      {
        text: "Can I cancel a bid?",
        next: [
          "Generally, bids can't be cancelled. 😕",
          "But if it was a mistake, contact support immediately.",
          "We'll check your case and try to help. 🛠️"
        ]
      },
      {
        text: "Do I have to pay immediately after winning?",
        next: [
          "Not instantly, but it's best to contact the seller within 24 hours.",
          "Prompt communication = better trust & faster delivery. 🤝",
          "Delays can lead to cancellation. ⏳"
        ]
      }
    ],

    Safety: [
      {
        text: "How do I know if an item is genuine?",
        next: [
          "Always read the item description thoroughly.",
          "Look for 'Verified Seller' badge ✅ and clear photos.",
          "Still unsure? Contact the seller or report the listing. 🔍"
        ]
      },
      // {
      //   text: "How to contact seller?",
      //   next: [
      //     "Go to the item's page and scroll to the seller section.",
      //     "Click 'Contact Seller' to chat or get their contact info. 📩"
      //   ]
      // },
      {
        text: "Is payment handled on this platform?",
        next: [
          "Currently, payment is handled between buyer and seller directly.",
          "Please confirm details clearly before transferring money.",
          "Soon, we may integrate secure in-app payments too! 🔒"
        ]
      },
      {
        text: "What if the item I received is damaged?",
        next: [
          "Contact the seller first — some offer return/refund options.",
          "If no resolution, report the issue via 'Contact' support.",
          "We'll intervene if needed. We've got your back! 💥"
        ]
      }
    ],

      "Selling & Listings": [
    {
      text: "How do I list an item for auction?",
      next: [
        "Go to 'Post Items' page in the top.",
        "Fill in all details — title, description, price, category, and media.",
        "Set the auction duration, and submit!",
        "Wait for admin approval and you're live. 🚀"
      ]
    },
    {
      text: "Can I edit a listing after posting?",
      next: [
        "Yes! Go to 'My Listings' from your dashboard.",
        "Click 'Edit' on the item you want to change.",
        "Make your changes and hit 'Update'.",
        "Note: Some fields may lock after first bid. 🔒"
      ]
    },
    {
      text: "How do I delete a listing?",
      next: [
        "Head to 'My Listings'.",
        "Click the delete 🗑️ icon next to the item.",
        "Confirm the action. That's it!"
      ]
    }
  ],

  "Account & Settings": [
    {
      text: "How do I change my password?",
      next: [
        "Go to your profile (top-right corner).",
        "Click on 'Account' → 'Change Password'.",
        "Enter your current password, then the new one.",
        "Click save — and don't forget to keep it strong! 🔐"
      ]
    },
    {
      text: "How can I update my contact info?",
      next: [
        "In 'Profile Settings', you can edit your phone, username, and address.",
        "Click save to update.",
        "We use this info to send important updates, so keep it fresh. 📲"
      ]
    },
    {
      text: "I forgot my password. What now?",
      next: [
        "Click on 'Forgot Password' on the login screen.",
        "Enter your registered email.",
        "You'll get a reset link — click it and set a new password. 🔁"
      ]
    }
  ],

  "Shipping & Delivery": [
    {
      text: "Who handles the shipping?",
      next: [
        "For now, buyers and sellers coordinate shipping between themselves.",
        "Some sellers offer delivery or pickup options — check item details. 🚚"
      ]
    },
    {
      text: "Is there any delivery charge?",
      next: [
        "If the seller has added a delivery charge, it'll be mentioned on the item page.",
        "You can negotiate or confirm with the seller before finalizing. 💬"
      ]
    },
    {
      text: "Can I track my delivery?",
      next: [
        "Since shipping is manual, tracking depends on the courier used.",
        "Ask your seller if they've provided a tracking number. 📦"
      ]
    }
  ],

  "Technical Issues": [
    {
      text: "The site isn't loading properly. Help!",
      next: [
        "Try refreshing the page or switching to another browser.",
        "Clear your cache or try incognito mode.",
        "Still stuck? Contact support. 🚑"
      ]
    },
    {
      text: "I can't post a bid!",
      next: [
        "Ensure you're logged in and your internet is stable.",
        "Check if bidding is still open for that item.",
        "If problem persists, report it to support. 🛠️"
      ]
    },
    // {
    //   text: "I didn't get the confirmation email.",
    //   next: [
    //     "Check your spam/junk folder first.",
    //     "Make sure your registered email is correct in settings.",
    //     "If still missing, request a resend or contact support. 📧"
    //   ]
    // }
  ]

  };

  useEffect(() => {
    if (isOpen) {
      setMessages([{ from: 'nia', text: "Hey there! 👋 I'm Noa, your auction guide. Choose a category to begin." }]);
      setShowCategories(true);
      setSelectedCategory(null);
      setShowOptions(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleCategorySelect = (category) => {
    setMessages(prev => [
      ...prev,
      { from: 'user', text: category },
      { from: 'nia', text: `Great! Here are some common questions about ${category} 🧐` }
    ]);
    setSelectedCategory(category);
    setShowCategories(false);
    setTimeout(() => setShowOptions(true), 1200);
  };

  const handleOptionClick = (option) => {
    setMessages(prev => [...prev, { from: 'user', text: option.text }]);

    // Mark question as asked
    setAskedQuestions(prev => ({
      ...prev,
      [selectedCategory]: [...(prev[selectedCategory] || []), option.text]
    }));

    option.next.forEach((text, index) => {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setMessages(prev => [...prev, { from: 'nia', text }]);
          setIsTyping(false);
        }, 800);
      }, index * 1200);
    });
  };

  const unaskedOptions = selectedCategory
    ? categories[selectedCategory].filter(opt => !(askedQuestions[selectedCategory] || []).includes(opt.text))
    : [];

  return (
    <>
      {/* Floating Button */}
      <button className="chat-button" onClick={() => setIsOpen(!isOpen)}>
        <div className="avatar-circle">
          <img src='assets/girl-avatar.png' alt="Noa" />
        </div>
        Any queries? <br /> <strong>Talk to Noa</strong>
      </button>

      {isOpen && <div className="chat-backdrop" onClick={() => setIsOpen(false)}></div>}

      {/* Side Panel */}
      <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <span>👩‍💻 Noa - Auction Assistant</span>
<button
  className="clos-btn"
  onClick={() => {
    setIsOpen(false);
    setMessages([]);
    setShowCategories(true);
    setSelectedCategory(null);
    setShowOptions(false);
    setAskedQuestions({});
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

          {/* Categories */}
          {showCategories && (
            <div className="options">
              {Object.keys(categories).map((cat, i) => (
                <button key={i} className="option-btn" onClick={() => handleCategorySelect(cat)}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Filtered Options */}
          {showOptions && selectedCategory && (
            <div className="options">
              {unaskedOptions.map((opt, i) => (
                <button key={i} className="option-btn" onClick={() => handleOptionClick(opt)}>
                  {opt.text}
                </button>
              ))}

              {unaskedOptions.length === 0 && (
                <div>
                  <p className="nia-msg">That’s all for this category! ✨ Feel free to explore others!</p>
                  <button
                    className="option-btn"
                    onClick={() => {
                      setShowOptions(false);
                      setShowCategories(true);
                      setSelectedCategory(null);
                    }}
                  >
                    🔄 Change Category
                  </button>
                </div>
              )}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>
    </>
  );
};

export default ChatBot;
