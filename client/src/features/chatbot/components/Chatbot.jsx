import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { chatbotApi } from '../api/chatbotApi';
import './Chatbot.css';

// Lightweight markdown formatter for simple **bold** and \n line breaks
const formatMessage = (text) => {
  if (!text) return null;
  // First, split by newlines
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    // Then parse bold parts: **text**
    const parts = line.split(/(\*\*.*?\*\*)/g);
    
    return (
      <React.Fragment key={lineIdx}>
        {parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I am Questro AI. How can I help you find your next adventure today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const query = inputValue.trim();
    setInputValue('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setIsLoading(true);

    try {
      const data = await chatbotApi.getRecommendation(query);
      
      if (data && data.status === 'success') {
        setMessages(prev => [...prev, { role: 'bot', content: data.llmResponse }]);
      } else {
        // If status is "error", or missing, we handle it as per documentation
        console.error('API Error Response:', data?.error);
        throw new Error(data?.error || 'Unknown error from API');
      }
    } catch (error) {
      console.error('Chatbot request failed:', error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Sorry, something went wrong. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-overlay">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="chatbot-window"
          >
            {/* Header */}
            <div className="chatbot-header">
              <div className="chatbot-header-title">
                <div className="bot-avatar">
                  <Bot size={20} color="#ffffff" />
                </div>
                <span>Questro AI</span>
              </div>
              <button onClick={handleToggle} className="close-btn" aria-label="Close chat">
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="chatbot-messages">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`message-wrapper ${msg.role}`}
                >
                  <div className="message-bubble">
                    {formatMessage(msg.content)}
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="message-wrapper bot"
                >
                  <div className="message-bubble">
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chatbot-input-area">
              <form onSubmit={handleSubmit} className="chatbot-input-form">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask for a recommendation..."
                  className="chatbot-input"
                  disabled={isLoading}
                />
                <button 
                  type="submit" 
                  className="chatbot-send-btn" 
                  disabled={!inputValue.trim() || isLoading}
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        className="chatbot-fab"
        onClick={handleToggle}
        aria-label="Toggle chat"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.div
              key="chat"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle size={28} />
              <div className="fab-ripple"></div>
            </motion.div>
          ) : (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={28} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default Chatbot;
