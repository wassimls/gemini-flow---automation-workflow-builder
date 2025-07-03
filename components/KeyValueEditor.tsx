import React, { useState, useEffect } from 'react';

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const PlusIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

interface KeyValuePair {
  id: number;
  key: string;
  value: string;
}

interface KeyValueEditorProps {
  value: string; // The raw JSON string
  onChange: (value: string) => void;
}

const jsonToKeyValue = (jsonString: string): { key: string; value: string }[] => {
    try {
        const obj = JSON.parse(jsonString || '{}');
        if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
            return [];
        }
        return Object.entries(obj).map(([key, value]) => ({
            key,
            value: typeof value === 'string' ? value : JSON.stringify(value),
        }));
    } catch (e) {
        return [];
    }
};

const keyValueToJson = (pairs: { key: string; value: string }[]): string => {
    const obj = pairs.reduce((acc, pair) => {
        if (pair.key.trim() !== '') {
            try {
                acc[pair.key.trim()] = JSON.parse(pair.value);
            } catch {
                acc[pair.key.trim()] = pair.value;
            }
        }
        return acc;
    }, {} as Record<string, any>);
    return JSON.stringify(obj, null, 2);
};

const KeyValueEditor: React.FC<KeyValueEditorProps> = ({ value: jsonString, onChange }) => {
    const [pairs, setPairs] = useState<KeyValuePair[]>([]);

    useEffect(() => {
        const internalJson = keyValueToJson(pairs.map(({ key, value }) => ({ key, value })));
        const formattedJsonString = JSON.stringify(JSON.parse(jsonString || '{}'), null, 2);

        if (internalJson !== formattedJsonString) {
            const initialPairs = jsonToKeyValue(jsonString);
            setPairs(initialPairs.map((p, i) => ({ ...p, id: Date.now() + i })));
        }
    }, [jsonString]);

    const triggerChange = (updatedPairs: KeyValuePair[]) => {
        const simplifiedPairs = updatedPairs.map(({ key, value }) => ({ key, value }));
        onChange(keyValueToJson(simplifiedPairs));
    };

    const handleUpdate = (id: number, field: 'key' | 'value', fieldValue: string) => {
        const updatedPairs = pairs.map(p => p.id === id ? { ...p, [field]: fieldValue } : p);
        setPairs(updatedPairs);
        triggerChange(updatedPairs);
    };

    const handleAdd = () => {
        const newPair = { id: Date.now(), key: '', value: '' };
        const updatedPairs = [...pairs, newPair];
        setPairs(updatedPairs);
        triggerChange(updatedPairs); // Trigger even for empty pair to reflect in parent state
    };

    const handleRemove = (id: number) => {
        const updatedPairs = pairs.filter(p => p.id !== id);
        setPairs(updatedPairs);
        triggerChange(updatedPairs);
    };
    
    return (
        <div className="space-y-2 bg-neutral-950/50 p-2 rounded-md border border-neutral-700/50">
            {pairs.length > 0 && (
                <div className="flex space-x-2 text-xs font-medium text-neutral-400 px-1">
                    <div className="w-2/5">Key</div>
                    <div className="w-3/5">Value</div>
                    <div className="w-8 flex-shrink-0"></div>
                </div>
            )}
            
            {pairs.map((pair) => (
                <div key={pair.id} className="flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder="property_name"
                        value={pair.key}
                        onChange={(e) => handleUpdate(pair.id, 'key', e.target.value)}
                        className="block w-2/5 rounded-md border-neutral-700 bg-neutral-800 text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 font-mono"
                    />
                    <input
                        type="text"
                        placeholder="value"
                        value={pair.value}
                        onChange={(e) => handleUpdate(pair.id, 'value', e.target.value)}
                        className="block w-3/5 rounded-md border-neutral-700 bg-neutral-800 text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 font-mono"
                    />
                    <button
                        onClick={() => handleRemove(pair.id)}
                        className="text-neutral-500 hover:text-red-500 p-1 flex-shrink-0"
                        aria-label="Delete key-value pair"
                    >
                       <TrashIcon />
                    </button>
                </div>
            ))}
            
            <div className="pt-2">
                <button
                    onClick={handleAdd}
                    className="flex items-center space-x-2 text-sm text-green-400 hover:text-green-300 font-semibold"
                >
                    <PlusIcon />
                    <span>Add Property</span>
                </button>
            </div>
        </div>
    );
};

export default KeyValueEditor;
