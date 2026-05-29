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
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startListening = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-CO';
      recognition.interimResults = false;
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e) => {
        setIsListening(false);
        console.error("Error de voz:", e.error);
        if (e.error === 'not-allowed') {
          alert("Debes permitir el acceso al micrófono en tu navegador.");
        }
      };
      recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setInput(text);
        handleSend(text, true);
      };
      recognition.start();
    } catch (err) {
      console.error("Excepción en reconocimiento de voz:", err);
      setIsListening(false);
      alert("Ocurrió un error al intentar iniciar el micrófono.");
    }
  };

  const handleSend = async (overrideText = null, fromVoice = false) => {
    const userMsg = typeof overrideText === 'string' ? overrideText.trim() : input.trim();
    if (!userMsg) return;
    if (typeof overrideText !== 'string') setInput('');
    
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const [accidents, traffic, weather, air, cameras] = await Promise.all([
        getAccidentsData(), getTrafficData(), getWeatherData(), getAirQualityData(), getCamerasData()
      ]);
      const context = { accidents, traffic, weather, air, cameras };
      
      const response = await fetchChatbotResponse(userMsg, context);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);

      if (fromVoice && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(response);
        utterance.lang = 'es-CO';
        window.speechSynthesis.speak(utterance);
      }
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
            <button 
              className={`copilot-mic-btn ${isListening ? 'listening' : ''}`}
              onClick={startListening}
              disabled={loading || isListening}
              title="Hablar por micrófono"
            >
              🎙️
            </button>
            <input 
              type="text" 
              placeholder="Pregúntale a la IA..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button className="copilot-send-btn" onClick={() => handleSend()} disabled={loading || !input.trim()}>
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
