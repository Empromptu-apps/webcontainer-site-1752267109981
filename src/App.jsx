import React, { useState, useRef, useEffect } from 'react';

const YesNoChatbot = () => {
  const [agentId, setAgentId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [botReady, setBotReady] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [apiCalls, setApiCalls] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_BASE = 'http://localhost:8080/api_tools';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 4e31d5e989125dc49a09d234c59e85bc',
    'X-Generated-App-ID': '53d1c8a3-2b4e-4e6a-b8f6-3c6ee2e839d3'
  };

  const logApiCall = (method, endpoint, payload, response) => {
    const call = {
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      payload,
      response,
      id: Date.now()
    };
    setApiCalls(prev => [...prev, call]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const initializeBot = async () => {
    setIsLoading(true);
    const payload = {
      instructions: "You are a strict Yes/No chatbot. You must ONLY respond with either 'Yes' or 'No' - nothing else. No explanations, no additional text, no punctuation. For any factual question, determine the most accurate yes or no answer. If a question is ambiguous or unclear, still choose either Yes or No based on the most reasonable interpretation. Never say 'I don't know' or provide any other response.",
      agent_name: "Yes/No Bot"
    };

    try {
      const response = await fetch(`${API_BASE}/create-agent`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      logApiCall('POST', '/create-agent', payload, data);
      
      setAgentId(data.agent_id);
      setBotReady(true);
      setMessages([{ type: 'bot', text: 'Ready! Ask me any yes/no question.', timestamp: new Date() }]);
    } catch (error) {
      console.error('Error creating agent:', error);
      logApiCall('POST', '/create-agent', payload, { error: error.message });
      setMessages([{ type: 'error', text: 'Failed to initialize bot. Please try again.', timestamp: new Date() }]);
    }
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !agentId) return;

    const userMessage = inputMessage.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMessage, timestamp: new Date() }]);
    setInputMessage('');
    setIsLoading(true);

    const payload = {
      agent_id: agentId,
      message: userMessage
    };

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      logApiCall('POST', '/chat', payload, data);
      
      setMessages(prev => [...prev, { type: 'bot', text: data.response, timestamp: new Date() }]);
    } catch (error) {
      console.error('Error sending message:', error);
      logApiCall('POST', '/chat', payload, { error: error.message });
      setMessages(prev => [...prev, { type: 'error', text: 'Error getting response. Please try again.', timestamp: new Date() }]);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setAgentId(null);
    setBotReady(false);
    setApiCalls([]);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile full-screen view */}
      <div className={`md:hidden ${isMinimized ? 'hidden' : 'block'} fixed inset-0 z-50 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-primary-600 text-white">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-primary-600 text-sm font-bold">?</span>
              </div>
              <span className="font-medium">Yes/No Bot</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-primary-700 hover:bg-primary-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 rounded-lg bg-primary-700 hover:bg-primary-800 transition-colors"
                aria-label="Minimize chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite" aria-label="Chat messages">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  msg.type === 'user' 
                    ? 'bg-primary-600 text-white' 
                    : msg.type === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {!botReady ? (
              <button 
                onClick={initializeBot} 
                disabled={isLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium py-3 px-4 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Start chatbot"
              >
                {isLoading ? 'Initializing...' : 'Start Chatbot'}
              </button>
            ) : (
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  aria-label="Type your yes/no question"
                />
                <button 
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white p-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label="Send message"
                >
                  ➤
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop bottom-right panel */}
      <div className="hidden md:block">
        <div className={`fixed bottom-4 right-4 z-50 ${isMinimized ? 'w-auto' : 'w-96'} transition-all duration-300`}>
          {isMinimized ? (
            <button
              onClick={() => setIsMinimized(false)}
              className="bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Open chat"
            >
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <span className="text-primary-600 text-sm font-bold">?</span>
                </div>
                <span className="font-medium">Help</span>
              </div>
            </button>
          ) : (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden`}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-primary-600 text-white">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <span className="text-primary-600 text-sm font-bold">?</span>
                  </div>
                  <span className="font-medium">Yes/No Bot</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-1 rounded hover:bg-primary-700 transition-colors"
                    aria-label="Toggle dark mode"
                  >
                    {darkMode ? '☀️' : '🌙'}
                  </button>
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-1 rounded hover:bg-primary-700 transition-colors"
                    aria-label="Minimize chat"
                  >
                    ➖
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-3" aria-live="polite" aria-label="Chat messages">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${
                      msg.type === 'user' 
                        ? 'bg-primary-600 text-white' 
                        : msg.type === 'error'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                {!botReady ? (
                  <button 
                    onClick={initializeBot} 
                    disabled={isLoading}
                    className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium py-2 px-4 rounded-xl transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    aria-label="Start chatbot"
                  >
                    {isLoading ? 'Initializing...' : 'Start Chatbot'}
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything..."
                      disabled={isLoading}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      aria-label="Type your yes/no question"
                    />
                    <button 
                      onClick={sendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                      className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-3 py-2 rounded-xl transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      aria-label="Send message"
                    >
                      ➤
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content area with debug controls */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Yes/No Chatbot
          </h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Debug Controls
            </h2>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                aria-label="Toggle API debug view"
              >
                {showDebug ? 'Hide' : 'Show'} API Calls
              </button>
              
              <button
                onClick={clearChat}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Clear chat and delete objects"
              >
                Clear Chat & Delete Objects
              </button>
            </div>

            {showDebug && (
              <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-4 max-h-96 overflow-y-auto">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">API Call Log</h3>
                {apiCalls.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No API calls yet</p>
                ) : (
                  <div className="space-y-3">
                    {apiCalls.map((call) => (
                      <div key={call.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 text-sm">
                        <div className="font-mono text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {call.timestamp}
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {call.method} {call.endpoint}
                        </div>
                        <div className="mt-2">
                          <div className="text-gray-700 dark:text-gray-300 font-medium">Request:</div>
                          <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(call.payload, null, 2)}
                          </pre>
                        </div>
                        <div className="mt-2">
                          <div className="text-gray-700 dark:text-gray-300 font-medium">Response:</div>
                          <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(call.response, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Instructions
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300">
                This chatbot is designed to answer factual questions with only "Yes" or "No" responses. 
                It will not provide explanations or additional context - just a simple yes or no answer.
              </p>
              <ul className="text-gray-600 dark:text-gray-300 mt-4">
                <li>Click the chat widget in the bottom-right corner (desktop) or use the mobile interface</li>
                <li>Ask any factual question</li>
                <li>Receive a strict "Yes" or "No" answer</li>
                <li>Use the debug controls above to monitor API calls</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YesNoChatbot;
