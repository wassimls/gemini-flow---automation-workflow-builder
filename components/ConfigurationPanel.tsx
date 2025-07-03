import React, { useState, useEffect } from 'react';
import { AppNode, NodeConfig, NodeType, ApiRequestNodeConfig, HttpMethod, IfNodeConfig, IfOperator, SetDataNodeConfig, GeminiTextNodeConfig, StartNodeConfig, AIAgentNodeConfig, AppEdge } from '../types';
import KeyValueEditor from './KeyValueEditor';
import DataPickerModal from './DataPickerModal';
import { findAncestors } from '../utils/workflowUtils';
import { VariableIcon } from './nodes/icons';

interface ConfigurationPanelProps {
  selectedNode: AppNode | null;
  nodes: AppNode[];
  edges: AppEdge[];
  onUpdateNodeConfig: (nodeId: string, newConfig: NodeConfig) => void;
  onUpdateNodeLabel: (nodeId: string, newLabel: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
}

const ExpressionHelperText = () => (
    <div className="mt-3 text-xs text-neutral-400 p-2 rounded-md bg-neutral-950/50 flex items-center gap-2">
        <VariableIcon /> 
        <span>Use the picker to insert data from a previous node.</span>
    </div>
);

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ selectedNode, nodes, edges, onUpdateNodeConfig, onUpdateNodeLabel, onDeleteNode, onClose }) => {
  const [apiBodyType, setApiBodyType] = useState<'kv' | 'raw'>('kv');

  const [isDataPickerOpen, setIsDataPickerOpen] = useState(false);
  const [dataPickerTargetField, setDataPickerTargetField] = useState<string | null>(null);
  const [ancestorNodes, setAncestorNodes] = useState<AppNode[]>([]);

  useEffect(() => {
    if (selectedNode?.data.nodeType === NodeType.API_REQUEST) {
      const config = selectedNode.data.config as ApiRequestNodeConfig;
      try {
        JSON.parse(config.bodyTemplate || '{}');
        setApiBodyType('kv');
      } catch {
        setApiBodyType('raw');
      }
    }
  }, [selectedNode]);


  if (!selectedNode) {
    return (
      <div className="w-96 bg-neutral-900 border-l border-neutral-800 p-6 flex flex-col items-center justify-center text-neutral-400">
        <p className="text-center">Select a node to configure its settings.</p>
      </div>
    );
  }

  const isStartNode = selectedNode.data.nodeType === NodeType.START;

  const handleConfigChange = (field: string, value: string | HttpMethod | IfOperator) => {
    const newConfig = { ...selectedNode.data.config, [field]: value };
    onUpdateNodeConfig(selectedNode.id, newConfig);
  };

  const openDataPicker = (fieldName: string) => {
    setAncestorNodes(findAncestors(selectedNode.id, nodes, edges));
    setDataPickerTargetField(fieldName);
    setIsDataPickerOpen(true);
  };
  
  const handleDataSelect = (expression: string) => {
    if (!dataPickerTargetField) return;

    const currentConfig = selectedNode.data.config as Record<string, any>;
    const currentValue = currentConfig[dataPickerTargetField] || '';
    
    // In most cases, appending makes sense for text areas.
    const newValue = `${currentValue}${expression}`;

    handleConfigChange(dataPickerTargetField, newValue);
    setDataPickerTargetField(null);
  };

  const renderConfigurator = () => {
    switch (selectedNode.data.nodeType) {
      case NodeType.START:
        const startConfig = selectedNode.data.config as StartNodeConfig;
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="outputData" className="block text-sm font-medium text-neutral-300 mb-1">
                Initial Output Data
              </label>
              <KeyValueEditor
                value={startConfig.outputData || '{}'}
                onChange={(jsonString) => handleConfigChange('outputData', jsonString)}
              />
              <p className="mt-2 text-xs text-neutral-400">Set the initial data that the workflow will start with. This data will be passed as the output of this Start node.</p>
            </div>
          </div>
        );
      case NodeType.API_REQUEST:
        const config = selectedNode.data.config as ApiRequestNodeConfig;
        const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-neutral-300 mb-1">
                URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="url"
                  className="block w-full rounded-md border-neutral-700 bg-neutral-950 text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 pr-8"
                  placeholder="https://api.example.com/data"
                  value={config.url || ''}
                  onChange={(e) => handleConfigChange('url', e.target.value)}
                />
                <button onClick={() => openDataPicker('url')} title="Pick data from another node" className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-green-400"><VariableIcon /></button>
              </div>
            </div>
             <div>
              <label htmlFor="method" className="block text-sm font-medium text-neutral-300 mb-1">
                HTTP Method
              </label>
              <select
                id="method"
                className="block w-full rounded-md border-neutral-700 bg-neutral-950 text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2"
                value={config.method || 'GET'}
                onChange={(e) => handleConfigChange('method', e.target.value as HttpMethod)}
              >
                {methods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="headers" className="block text-sm font-medium text-neutral-300 mb-1">
                Headers
              </label>
              <KeyValueEditor
                value={config.headers || '{}'}
                onChange={(jsonString) => handleConfigChange('headers', jsonString)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Body (for POST/PUT/PATCH)
              </label>
                <div className="flex bg-neutral-800 p-1 rounded-md mb-2">
                    <button onClick={() => setApiBodyType('kv')} className={`flex-1 p-1 rounded text-sm text-center transition-colors ${apiBodyType === 'kv' ? 'bg-green-600 text-white shadow' : 'text-neutral-300 hover:bg-neutral-700'}`}>
                        Key-Value
                    </button>
                    <button onClick={() => setApiBodyType('raw')} className={`flex-1 p-1 rounded text-sm text-center transition-colors ${apiBodyType === 'raw' ? 'bg-green-600 text-white shadow' : 'text-neutral-300 hover:bg-neutral-700'}`}>
                        Raw
                    </button>
                </div>
              {apiBodyType === 'kv' ? (
                <KeyValueEditor
                  value={config.bodyTemplate || '{}'}
                  onChange={(jsonString) => handleConfigChange('bodyTemplate', jsonString)}
                />
              ) : (
                <div className="relative">
                  <textarea
                    id="bodyTemplate"
                    rows={8}
                    className="block w-full rounded-md border-neutral-700 bg-neutral-950 text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 font-mono pr-8"
                    placeholder={`{\n  "key": "value",\n  "prompt": "Summarize this: {{$node['Start'].output}}"\n}`}
                    value={config.bodyTemplate || ''}
                    onChange={(e) => handleConfigChange('bodyTemplate', e.target.value)}
                  />
                  <button onClick={() => openDataPicker('bodyTemplate')} title="Pick data from another node" className="absolute right-2 top-2 text-neutral-400 hover:text-green-400"><VariableIcon /></button>
                </div>
              )}
               <ExpressionHelperText/>
            </div>
          </div>
        );
      case NodeType.GEMINI_TEXT:
        const geminiConfig = selectedNode.data.config as GeminiTextNodeConfig;
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="promptTemplate" className="block text-sm font-medium text-neutral-300 mb-1">
                Prompt Template
              </label>
              <div className="relative">
                <textarea
                  id="promptTemplate"
                  rows={10}
                  className="block w-full rounded-md border-neutral-700 bg-neutral-950 text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 font-mono pr-8"
                  placeholder={`Summarize the following text:\n{{input}}`}
                  value={geminiConfig.promptTemplate || ''}
                  onChange={(e) => handleConfigChange('promptTemplate', e.target.value)}
                />
                 <button onClick={() => openDataPicker('promptTemplate')} title="Pick data from another node" className="absolute right-2 top-2 text-neutral-400 hover:text-green-400"><VariableIcon /></button>
              </div>
              <ExpressionHelperText />
            </div>
          </div>
        );
      case NodeType.AI_AGENT:
        const agentConfig = selectedNode.data.config as AIAgentNodeConfig;
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="goalTemplate" className="block text-sm font-medium text-neutral-300 mb-1">
                Agent Goal / Instructions
              </label>
              <div className="relative">
                <textarea
                  id="goalTemplate"
                  rows={10}
                  className="block w-full rounded-md border-neutral-700 bg-neutral-950 text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 font-mono pr-8"
                  placeholder={`Tell the agent what to do.\nE.g., "Find the capital of France and then get the current weather there."`}
                  value={agentConfig.goalTemplate || ''}
                  onChange={(e) => handleConfigChange('goalTemplate', e.target.value)}
                />
                <button onClick={() => openDataPicker('goalTemplate')} title="Pick data from another node" className="absolute right-2 top-2 text-neutral-400 hover:text-green-400"><VariableIcon /></button>
              </div>
              <p className="mt-2 text-xs text-neutral-400">The agent will use AI and tools (like API requests) to accomplish this goal.</p>
              <ExpressionHelperText />
            </div>
          </div>
        );
      case NodeType.IF:
        const ifConfig = selectedNode.data.config as IfNodeConfig;
        const operators: IfOperator[] = ['===', '!==', '>', '<', '>=', '<='];
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="value1" className="block text-sm font-medium text-neutral-300 mb-1">
                Value 1
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="value1"
                  className="block w-full rounded-md border-neutral-700 bg-neutral-950 text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 font-mono pr-8"
                  placeholder="{{input.data.name}}"
                  value={ifConfig.value1 || ''}
                  onChange={(e) => handleConfigChange('value1', e.target.value)}
                />
                <button onClick={() => openDataPicker('value1')} title="Pick data from another node" className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-green-400"><VariableIcon /></button>
              </div>
            </div>
             <div>
              <label htmlFor="operator" className="block text-sm font-medium text-neutral-300 mb-1">
                Operator
              </label>
              <select
                id="operator"
                className="block w-full rounded-md border-neutral-700 bg-neutral-950 text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2"
                value={ifConfig.operator || '==='}
                onChange={(e) => handleConfigChange('operator', e.target.value as IfOperator)}
              >
                {operators.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="value2" className="block text-sm font-medium text-neutral-300 mb-1">
                Value 2
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="value2"
                  className="block w-full rounded-md border-neutral-700 bg-neutral-950 text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 font-mono pr-8"
                  placeholder="'expected_value'"
                  value={ifConfig.value2 || ''}
                  onChange={(e) => handleConfigChange('value2', e.target.value)}
                />
                <button onClick={() => openDataPicker('value2')} title="Pick data from another node" className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-green-400"><VariableIcon /></button>
              </div>
            </div>
            <ExpressionHelperText />
        </div>
        );
      case NodeType.SET_DATA:
        const setDataConfig = selectedNode.data.config as SetDataNodeConfig;
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="jsonData" className="block text-sm font-medium text-neutral-300 mb-1">
                Data
              </label>
              <KeyValueEditor
                value={setDataConfig.data || '{}'}
                onChange={(jsonString) => handleConfigChange('data', jsonString)}
              />
            </div>
            <ExpressionHelperText />
          </div>
        );
      case NodeType.LOG_OUTPUT:
        return <p>The Log Output node has no configurable parameters. It simply displays its input.</p>;
      default:
        return <p>This node has no configuration.</p>;
    }
  };

  return (
    <>
      <DataPickerModal
        isOpen={isDataPickerOpen}
        onClose={() => setIsDataPickerOpen(false)}
        onSelect={handleDataSelect}
        nodes={ancestorNodes}
      />
      <div className="w-96 bg-neutral-900 border-l border-neutral-800 p-6 text-white flex flex-col h-full">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-xl font-bold">Configure Node</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">&times;</button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-6">
          {/* Node Label Editor */}
          <div>
            <label htmlFor="nodeLabel" className="block text-sm font-medium text-neutral-300 mb-1">
              Node Label
            </label>
            <input
              type="text"
              id="nodeLabel"
              className="block w-full rounded-md border-neutral-700 bg-neutral-950 text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              value={selectedNode.data.label}
              onChange={(e) => onUpdateNodeLabel(selectedNode.id, e.target.value)}
              disabled={isStartNode}
              aria-disabled={isStartNode}
            />
            {!isStartNode && <p className="mt-2 text-xs text-neutral-400">The label is used to reference this node in expressions, e.g., <code className="bg-neutral-700 p-0.5 rounded-sm">{`{{$node['${selectedNode.data.label}'].output}}`}</code>.</p>}
            {isStartNode && <p className="mt-2 text-xs text-neutral-400">The Start node cannot be renamed.</p>}
          </div>

          <hr className="border-neutral-700"/>

          {/* Node-specific Configuration */}
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-1">Parameters</h3>
            <p className="text-sm text-neutral-400 mb-4">ID: {selectedNode.id}</p>
            {renderConfigurator()}
          </div>
        </div>

        {/* Footer with Delete Button */}
        {!isStartNode && (
          <div className="mt-6 pt-4 border-t border-neutral-800 flex-shrink-0">
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete the "${selectedNode.data.label}" node?`)) {
                  onDeleteNode(selectedNode.id);
                }
              }}
              className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
              aria-label={`Delete node ${selectedNode.data.label}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
              </svg>
              <span>Delete Node</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ConfigurationPanel;