import React from 'react';

interface SettingsPanelProps {
    onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
    return (
        <div className="w-96 bg-neutral-900 border-l border-neutral-800 text-white flex flex-col h-full absolute right-0 top-0 z-20 shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-neutral-700">
                <h2 className="text-xl font-bold">Settings</h2>
                <button onClick={onClose} className="text-neutral-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="flex-grow p-4 overflow-y-auto space-y-6">
                 <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-2">API Keys</h3>
                    <div className="bg-neutral-950/50 p-4 rounded-lg">
                        <h4 className="font-semibold text-neutral-200">Google AI API Key</h4>
                        <p className="mt-2 text-sm text-neutral-400">The Google AI API Key for the 'Gemini Text' node is managed by the application environment and does not need to be configured here.</p>
                    </div>
                </div>
                 <p className="text-xs text-neutral-500 text-center pt-4">API keys for other services (like OpenRouter for the AI Assistant) are saved in your browser's local storage.</p>
            </div>
        </div>
    );
};

export default SettingsPanel;
