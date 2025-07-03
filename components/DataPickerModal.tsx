import React, { useState } from 'react';
import { AppNode } from '../types';

interface DataPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (expression: string) => void;
  nodes: AppNode[]; // The list of ancestor nodes
}

const DataPickerModal: React.FC<DataPickerModalProps> = ({ isOpen, onClose, onSelect, nodes }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [dataPath, setDataPath] = useState<string>('');

  if (!isOpen) return null;

  const handleInsert = () => {
    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    if (!selectedNode) {
      alert("Please select a source node.");
      return;
    }
    
    // Construct the expression
    let expression = `{{$node['${selectedNode.data.label}'].output`;
    if (dataPath) {
      // Add dot if path doesn't start with a bracket
      if (!dataPath.startsWith('[')) {
        expression += '.';
      }
      expression += dataPath;
    }
    expression += '}}';

    onSelect(expression);
    onClose();
    // Reset for next time
    setSelectedNodeId('');
    setDataPath('');
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-neutral-800 rounded-lg shadow-xl w-full max-w-lg p-6 text-white border border-neutral-700" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-green-400">Select Data Source</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="sourceNode" className="block text-sm font-medium text-neutral-300 mb-1">
              1. Choose a source node
            </label>
            <select
              id="sourceNode"
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              className="block w-full rounded-md border-neutral-700 bg-neutral-900 text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2"
            >
              <option value="" disabled>Select a node...</option>
              {nodes.map(node => (
                <option key={node.id} value={node.id}>{node.data.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dataPath" className="block text-sm font-medium text-neutral-300 mb-1">
              2. Specify data path (optional)
            </label>
            <input
              type="text"
              id="dataPath"
              value={dataPath}
              onChange={(e) => setDataPath(e.target.value)}
              className="block w-full rounded-md border-neutral-700 bg-neutral-900 text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 font-mono"
              placeholder="e.g., user.id or results[0].name"
            />
            <p className="mt-2 text-xs text-neutral-400">Leave blank to get the entire output of the selected node.</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className="py-2 px-4 bg-neutral-700 hover:bg-neutral-600 rounded-md transition-colors">
            Cancel
          </button>
          <button onClick={handleInsert} className="py-2 px-4 bg-green-600 hover:bg-green-700 rounded-md font-semibold transition-colors">
            Insert Expression
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataPickerModal;
