import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy el asistente virtual de EcoClean Store. ¿En qué puedo ayudarte?' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setError('');
    setSending(true);

    try {
      const payload = updatedMessages.filter((m) => m.role === 'user' || m.role === 'assistant').map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data } = await api.post('/ia/chat', { messages: payload });
      setMessages([...updatedMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al comunicarse con el asistente');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
          style={{ height: '520px', maxHeight: 'calc(100vh - 100px)' }}>
          <div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <p className="text-sm font-semibold">Asistente EcoClean</p>
                <p className="text-[10px] text-primary-100">Impulsado por IA</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-primary-100 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-md'
                      : 'bg-white text-slate-700 rounded-bl-md border border-slate-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-400 text-sm px-4 py-2.5 rounded-2xl rounded-bl-md border border-slate-200">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <span className="text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 px-4 py-3 shrink-0 bg-white">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu consulta..."
                disabled={sending}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-50"
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="bg-primary-600 hover:bg-primary-700 text-white p-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Asistente IA"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </>
  );
}
