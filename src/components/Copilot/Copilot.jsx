import React, { useState, useRef, useEffect } from 'react';
import { fetchChatbotResponse } from '../../services/ai';
import { getAccidentsData, getTrafficData, getWeatherData } from '../../services/api';
import './Copilot.css';

const Copilot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: '¡Hola! Soy tu Copiloto PREVIMED IA. ¿En qué te puedo ayudar hoy con el estado de la movilidad?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const [accidents, traffic, weather] = await Promise.all([
        getAccidentsData(), getTrafficData(), getWeatherData()
      ]);
      const context = { accidents, traffic, weather };
      
      const response = await fetchChatbotResponse(userMsg, context);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Hubo un error al procesar tu solicitud. Revisa la consola.' }]);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="copilot-container">
      {isOpen && (
        <div className="copilot-window">
          <div className="copilot-header">
            <div>
              <strong>PREVIMED Copilot</strong>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Powered by OpenRouter</div>
            </div>
            <button className="copilot-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>
          
          <div className="copilot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`copilot-msg ${m.role}`}>
                <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br/>') }} />
              </div>
            ))}
            {loading && (
              <div className="copilot-msg ai">
                <div className="msg-bubble typing"><span className="dot"></span><span className="dot"></span><span className="dot"></span></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="copilot-input-area">
            <input 
              type="text" 
              placeholder="Pregúntale a la IA..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()}>
              ➔
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button className="copilot-fab" onClick={() => setIsOpen(true)}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}
    </div>
  );
};

export default Copilot;
