
import React, { useState, useRef, useEffect } from 'react';

export interface Message {
    sender: 'user' | 'ai' | 'system';
    text: string;
}

interface ChatPanelProps {
    messages: Message[];
    onSendMessage: (prompt: string) => Promise<void>;
    onClose: () => void;
    isLoading: boolean;
    apiKey: string;
    onApiKeyChange: (key: string) => void;
    selectedModel: string;
    onModelChange: (model: string) => void;
}

const aiModels = [
    // --- Free Models ---
    { id: 'google/gemma-2-9b-it', name: 'Google: Gemma 2 9B (Free)' },
    { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Meta: Llama 3.1 8B (Free)' },
    { id: 'meta-llama/llama-3.2-11b-vision-instruct', name: 'Meta: Llama 3.2 11B Vision (Free)' },
    { id: 'meta-llama/llama-3.2-1b-instruct', name: 'Meta: Llama 3.2 1B (Free)' },
    { id: 'mistralai/mistral-7b-instruct', name: 'Mistral: 7B Instruct (Free)' },
    { id: 'mistralai/mistral-nemo', name: 'Mistral: Nemo 12B (Free)'},
    { id: 'microsoft/phi-3-mini-128k-instruct', name: 'Microsoft: Phi-3 Mini (Free)' },
    { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen: 2.5 72B Instruct (Free)'},
    { id: 'qwen/qwen3-32b', name: 'Qwen: 3 32B (Free)' },
    { id: 'nousresearch/hermes-2-pro-llama-3-8b', name: 'Nous: Hermes 2 Pro Llama-3 8B (Free)'},
    { id: 'deepseek/deepseek-r1-0528-qwen3-8b', name: 'DeepSeek: R1 Qwen3 8B (Free)' },
    { id: 'deepseek/deepseek-r1-0528', name: 'DeepSeek: R1 0528 (Free)' },

    // --- Paid / Low-cost Models ---
    { id: 'google/gemini-2.5-pro-exp-03-25', name: 'Google: Gemini 2.5 Pro Exp' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic: Claude 3.5 Sonnet' },
    { id: 'openai/gpt-4o-mini', name: 'OpenAI: GPT-4o Mini' },
    { id: 'openai/gpt-4o', name: 'OpenAI: GPT-4o' },
];


const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, onClose, isLoading, apiKey, onApiKeyChange, selectedModel, onModelChange }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = () => {
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="w-96 bg-gray-800 border-l border-gray-700 text-white flex flex-col h-full absolute right-0 top-0 z-20 shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">AI Assistant</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg px-4 py-2 max-w-xs break-words ${
                            msg.sender === 'user' ? 'bg-indigo-600' : 'bg-gray-700'
                        } ${
                            msg.sender === 'system' ? '!bg-yellow-800/50 text-yellow-200' : ''
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                         <div className="rounded-lg px-4 py-2 bg-gray-700 flex items-center space-x-2">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-700 space-y-4">
                 <div>
                    <label htmlFor="apiKey" className="block text-sm font-medium text-gray-400 mb-1">
                        OpenRouter API Key
                    </label>
                    <input
                        type="password"
                        id="apiKey"
                        value={apiKey}
                        onChange={(e) => onApiKeyChange(e.target.value)}
                        placeholder="sk-or-..."
                        className="w-full bg-gray-900 text-white rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div>
                    <label htmlFor="aiModel" className="block text-sm font-medium text-gray-400 mb-1">
                        AI Model
                    </label>
                    <select
                        id="aiModel"
                        value={selectedModel}
                        onChange={(e) => onModelChange(e.target.value)}
                        className="w-full bg-gray-900 text-white rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {aiModels.map(model => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask a question or describe a workflow..."
                        disabled={isLoading}
                        className="flex-grow bg-gray-900 text-white rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed transition-colors"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;