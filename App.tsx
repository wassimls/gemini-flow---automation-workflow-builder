
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from 'reactflow';

import { AppNode, AppEdge, NodeType, NodeConfig, ApiRequestNodeConfig, IfNodeConfig, SetDataNodeConfig, GeminiTextNodeConfig, StartNodeConfig, AIAgentNodeConfig } from './types';
import WorkflowCanvas from './components/WorkflowCanvas';
import ConfigurationPanel from './components/ConfigurationPanel';
import SettingsPanel from './components/SettingsPanel';
import { makeApiRequest } from './services/apiService';
import { generateText } from './services/geminiService';
import { runAgent } from './services/aiAgentService';
import { sendMessageToAI, AIResponse } from './services/aiAssistantService';
import ChatPanel, { Message } from './components/ChatPanel';
import { CloudIcon, TerminalIcon, PlayIcon, BranchIcon, UploadIcon, DownloadIcon, ChatBubbleIcon, EditIcon, PlusIcon, SparklesIcon, AgentIcon, CogIcon } from './components/nodes/icons';
import { isValidWorkflow } from './services/workflowGeneratorService';
import { resolveExpressions } from './services/expressionService';

const initialNodes: AppNode[] = [
  {
    id: '1',
    type: NodeType.START,
    position: { x: 50, y: 150 },
    data: { 
      nodeType: NodeType.START, 
      label: 'Start', 
      config: {
        outputData: JSON.stringify({ message: "Hello from the Start Node!" }, null, 2)
      } as StartNodeConfig, 
      status: 'idle' 
    },
  },
  {
    id: '2',
    type: NodeType.API_REQUEST,
    position: { x: 300, y: 150 },
    data: {
      nodeType: NodeType.API_REQUEST,
      label: 'Fetch Todo',
      config: { 
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/todos/1',
        headers: '{}',
        bodyTemplate: ''
      } as ApiRequestNodeConfig,
      status: 'idle',
    },
  },
   {
    id: '3',
    type: NodeType.LOG_OUTPUT,
    position: { x: 550, y: 150 },
    data: { nodeType: NodeType.LOG_OUTPUT, label: 'Log Response', config: {}, status: 'idle' },
  },
];

const initialEdges: AppEdge[] = [ { id: 'e1-2', source: '1', target: '2' }, { id: 'e2-3', source: '2', target: '3' }];


const App: React.FC = () => {
  const [nodes, setNodes] = useState<AppNode[]>(() => {
    const saved = localStorage.getItem('gemini-flow-nodes');
    return saved ? JSON.parse(saved) : initialNodes;
  });
  const [edges, setEdges] = useState<AppEdge[]>(() => {
    const saved = localStorage.getItem('gemini-flow-edges');
    return saved ? JSON.parse(saved) : initialEdges;
  });
  const [selectedNode, setSelectedNode] = useState<AppNode | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddNodeMenuOpen, setIsAddNodeMenuOpen] = useState(false);

  const [isChatPanelVisible, setIsChatPanelVisible] = useState(false);
  const [isSettingsPanelVisible, setIsSettingsPanelVisible] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
      { sender: 'ai', text: 'Hello! I can answer questions, or I can see the workflow on your canvas and help you modify it. Just describe what you need.' }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State for API Keys
  const [openRouterApiKey, setOpenRouterApiKey] = useState<string>(() => localStorage.getItem('openRouterApiKey') || '');
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem('openRouterModel') || 'google/gemma-2-9b-it');

  // Autosave to localStorage
  useEffect(() => { localStorage.setItem('gemini-flow-nodes', JSON.stringify(nodes)); }, [nodes]);
  useEffect(() => { localStorage.setItem('gemini-flow-edges', JSON.stringify(edges)); }, [edges]);
  useEffect(() => { localStorage.setItem('openRouterApiKey', openRouterApiKey); }, [openRouterApiKey]);
  useEffect(() => { localStorage.setItem('openRouterModel', selectedModel); }, [selectedModel]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
        const willDeleteSelected = changes.some(change => 
            change.type === 'remove' && selectedNode && change.id === selectedNode.id
        );
        if (willDeleteSelected) {
            setIsPanelVisible(false);
            setSelectedNode(null);
        }
        setNodes((nds) => applyNodeChanges(changes, nds))
    },
    [setNodes, selectedNode]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ ...connection, animated: false, style: {} }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: AppNode) => {
    setSelectedNode(node);
    setIsPanelVisible(true);
    setIsSettingsPanelVisible(false);
  }, []);

  const onUpdateNodeConfig = useCallback((nodeId: string, newConfig: NodeConfig) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, config: newConfig } };
        }
        return node;
      })
    );
  }, [setNodes]);
  
  const onUpdateNodeLabel = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
        nds.map((node) => {
        if (node.id === nodeId) {
            if (node.data.nodeType === NodeType.START) return node;
            const updatedNode = { ...node, data: { ...node.data, label: newLabel } };
            if (selectedNode?.id === nodeId) {
                setSelectedNode(updatedNode);
            }
            return updatedNode;
        }
        return node;
        })
    );
  }, [setNodes, selectedNode]);

  const deleteNode = useCallback((nodeId: string) => {
    const nodeToDelete = nodes.find(n => n.id === nodeId);
    if (nodeToDelete && nodeToDelete.data.nodeType === NodeType.START) {
        alert("The Start node cannot be deleted.");
        return;
    }

    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
    setIsPanelVisible(false);
  }, [nodes, setNodes, setEdges]);

  const addNode = (type: NodeType) => {
    const id = `${+new Date()}`;
    let newNode: AppNode;
    const baseNode = {
        id,
        position: { x: Math.random() * 200 + 50, y: Math.random() * 200 },
    };

    if (type === NodeType.API_REQUEST) {
        newNode = {
            ...baseNode, type: NodeType.API_REQUEST,
            data: { nodeType: NodeType.API_REQUEST, label: 'API Request', config: { url: '', method: 'GET', headers: '{"Content-Type": "application/json"}', bodyTemplate: '' } as ApiRequestNodeConfig, status: 'idle' },
        };
    } else if (type === NodeType.LOG_OUTPUT) {
        newNode = {
            ...baseNode, type: NodeType.LOG_OUTPUT,
            data: { nodeType: NodeType.LOG_OUTPUT, label: 'Log Output', config: {}, status: 'idle' },
        };
    } else if (type === NodeType.IF) {
      newNode = {
        ...baseNode, type: NodeType.IF,
        data: { nodeType: NodeType.IF, label: 'IF Condition', config: { value1: '{{input}}', operator: '===', value2: '' } as IfNodeConfig, status: 'idle' },
      }
    } else if (type === NodeType.SET_DATA) {
        newNode = {
            ...baseNode, type: NodeType.SET_DATA,
            data: { nodeType: NodeType.SET_DATA, label: 'Set Data', config: { data: '{\n  "key": "value"\n}' } as SetDataNodeConfig, status: 'idle' },
        };
    } else if (type === NodeType.GEMINI_TEXT) {
        newNode = {
            ...baseNode, type: NodeType.GEMINI_TEXT,
            data: { nodeType: NodeType.GEMINI_TEXT, label: 'Gemini Text', config: { promptTemplate: '' } as GeminiTextNodeConfig, status: 'idle' },
        };
    } else if (type === NodeType.AI_AGENT) {
        newNode = {
            ...baseNode, type: NodeType.AI_AGENT,
            data: { nodeType: NodeType.AI_AGENT, label: 'AI Agent', config: { goalTemplate: '' } as AIAgentNodeConfig, status: 'idle' },
        };
    } else {
        return;
    }
    setNodes((nds) => nds.concat(newNode));
  };
  
  const resetWorkflowStatus = () => {
    setNodes(nds => nds.map(n => ({...n, data: {...n.data, status: 'idle', output: undefined, error: undefined}})));
    setEdges(eds => eds.map(e => ({...e, animated: false, style: {}})))
  };

  const executeNode = async (node: AppNode, input: any, nodeOutputs: Map<string, any>): Promise<any> => {
      setNodes((nds) => nds.map(n => n.id === node.id ? {...n, data: {...n.data, status: 'running', input: input}} : n));
      
      try {
        let output: any;
        switch(node.data.nodeType) {
            case NodeType.START:
                const startConfig = node.data.config as StartNodeConfig;
                output = {};
                if (startConfig.outputData) {
                    try {
                        output = JSON.parse(startConfig.outputData);
                    } catch (e) {
                        throw new Error("Start node's Initial Output Data is not valid JSON.");
                    }
                }
                break;
            case NodeType.API_REQUEST:
                const config = node.data.config as ApiRequestNodeConfig;
                
                const finalUrl = resolveExpressions(config.url, nodes, nodeOutputs, input);

                let finalBody: string | undefined = undefined;
                if (config.bodyTemplate && (config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH')) {
                    const resolvedBody = resolveExpressions(config.bodyTemplate, nodes, nodeOutputs, input);
                    finalBody = typeof resolvedBody === 'string' ? resolvedBody : JSON.stringify(resolvedBody);
                }

                let finalHeaders: Record<string, string> | undefined = undefined;
                if (config.headers) {
                    try {
                        const resolvedHeaders = resolveExpressions(config.headers, nodes, nodeOutputs, input);
                        if (typeof resolvedHeaders === 'string') {
                            finalHeaders = JSON.parse(resolvedHeaders);
                        } else if (typeof resolvedHeaders === 'object' && resolvedHeaders !== null) {
                            finalHeaders = resolvedHeaders;
                        } else {
                            throw new Error("Resolved headers are not a valid object or JSON string.");
                        }
                    } catch (e: any) {
                        throw new Error(`Headers are not valid. ${e.message}`);
                    }
                }
                
                output = await makeApiRequest(finalUrl, config.method, finalHeaders, finalBody);
                break;
            case NodeType.GEMINI_TEXT:
                const geminiConfig = node.data.config as GeminiTextNodeConfig;
                if (!geminiConfig.promptTemplate) {
                    throw new Error("Prompt template is not configured.");
                }
                const resolvedPrompt = resolveExpressions(geminiConfig.promptTemplate, nodes, nodeOutputs, input);
                output = await generateText(resolvedPrompt);
                break;
            case NodeType.AI_AGENT:
                if (!openRouterApiKey) {
                    throw new Error("OpenRouter API Key is not configured. Please set it in the AI Assistant panel.");
                }
                const agentConfig = node.data.config as AIAgentNodeConfig;
                if (!agentConfig.goalTemplate) {
                    throw new Error("Agent goal is not configured.");
                }
                const resolvedGoal = resolveExpressions(agentConfig.goalTemplate, nodes, nodeOutputs, input);
                output = await runAgent(resolvedGoal, openRouterApiKey, selectedModel);
                break;
            case NodeType.IF:
                const ifConfig = node.data.config as IfNodeConfig;
                const v1 = resolveExpressions(ifConfig.value1, nodes, nodeOutputs, input);
                const v2 = resolveExpressions(ifConfig.value2, nodes, nodeOutputs, input);

                const num1 = parseFloat(v1);
                const num2 = parseFloat(v2);

                switch(ifConfig.operator) {
                    case '===': output = v1 === v2; break;
                    case '!==': output = v1 !== v2; break;
                    case '>': output = (!isNaN(num1) && !isNaN(num2)) ? num1 > num2 : String(v1) > String(v2); break;
                    case '<': output = (!isNaN(num1) && !isNaN(num2)) ? num1 < num2 : String(v1) < String(v2); break;
                    case '>=': output = (!isNaN(num1) && !isNaN(num2)) ? num1 >= num2 : String(v1) >= String(v2); break;
                    case '<=': output = (!isNaN(num1) && !isNaN(num2)) ? num1 <= num2 : String(v1) <= String(v2); break;
                    default: throw new Error(`Unknown IF operator: ${ifConfig.operator}`);
                }
                break;
            case NodeType.LOG_OUTPUT:
                output = input;
                console.log('LOG:', input);
                break;
            case NodeType.SET_DATA:
                const setDataConfig = node.data.config as SetDataNodeConfig;
                const resolvedData = resolveExpressions(setDataConfig.data, nodes, nodeOutputs, input);
                try {
                    if (typeof resolvedData === 'string') {
                        output = JSON.parse(resolvedData);
                    } else {
                        output = resolvedData;
                    }
                } catch(e) {
                    throw new Error("The data in the Set Data node is not valid JSON.");
                }
                break;
            default:
                throw new Error(`Unknown node type: ${node.data.nodeType}`);
        }
        setNodes((nds) => nds.map(n => n.id === node.id ? {...n, data: {...n.data, status: 'success', output}} : n));
        return output;
      } catch (e: any) {
        console.error(`Error executing node ${node.id}:`, e);
        setNodes((nds) => nds.map(n => n.id === node.id ? {...n, data: {...n.data, status: 'error', error: e.message}} : n));
        throw e;
      }
  };

  const runWorkflow = async () => {
      setIsExecuting(true);
      resetWorkflowStatus();
      
      const startNode = nodes.find(n => n.data.nodeType === NodeType.START);
      if (!startNode) {
          alert('No Start node found in the workflow.');
          setIsExecuting(false);
          return;
      }

      const executionQueue: {node: AppNode, input: any}[] = [{ node: startNode, input: undefined }];
      const executedNodeIds = new Set<string>();
      const nodeOutputs = new Map<string, any>();
      
      let item;
      while ( (item = executionQueue.shift()) ) {
          const { node: currentNode, input } = item;
          if (executedNodeIds.has(currentNode.id)) continue;

          await new Promise(resolve => setTimeout(resolve, 100));
          
          try {
            const output = await executeNode(currentNode, input, nodeOutputs);
            nodeOutputs.set(currentNode.id, output);
            executedNodeIds.add(currentNode.id);

            let nextEdges: AppEdge[];
            if (currentNode.data.nodeType === NodeType.IF) {
                const sourceHandle = String(output); 
                nextEdges = edges.filter(e => e.source === currentNode.id && e.sourceHandle === sourceHandle);
            } else {
                nextEdges = edges.filter(e => e.source === currentNode.id);
            }

            setEdges(currentEdges => currentEdges.map(e => {
                if (nextEdges.some(ne => ne.id === e.id)) {
                    return { ...e, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }; // blue-500
                }
                return e;
            }));
            
            const nextItems = nextEdges
                .map(e => nodes.find(n => n.id === e.target))
                .filter((n): n is AppNode => !!n)
                .map(n => ({ node: n, input: output }));

            executionQueue.push(...nextItems);
          } catch(e) {
              console.error(`Workflow execution failed at node ${currentNode.id}`);
              break; 
          }
      }
      setIsExecuting(false);
  };
  
  const handleSendMessage = async (prompt: string) => {
    if (!openRouterApiKey) {
        setMessages(prev => [...prev, { sender: 'system', text: 'Error: Please enter your OpenRouter API Key in the chat panel.' }]);
        return;
    }

    setIsGenerating(true);
    const newMessages: Message[] = [...messages, { sender: 'user', text: prompt }];
    setMessages(newMessages);

    try {
        const response: AIResponse = await sendMessageToAI(newMessages, nodes, edges, openRouterApiKey, selectedModel);

        let finalMessages = [...newMessages];

        if (response.intent === 'UPDATE_WORKFLOW' && typeof response.payload === 'object') {
            const { nodes: newNodes, edges: newEdges } = response.payload;
            
            newNodes.forEach((node: any) => {
                if (node.position) {
                    node.position.x = Number(node.position?.x) || 0;
                    node.position.y = Number(node.position?.y) || 0;
                }
                if (node.data && (!node.data.config || typeof node.data.config !== 'object')) {
                    node.data.config = {};
                }
            });

            if (!isValidWorkflow({ nodes: newNodes, edges: newEdges })) {
                console.error("AI returned an invalid workflow structure, even after sanitization:", { newNodes, newEdges });
                throw new Error("The AI assistant returned a workflow with an invalid format. The changes could not be applied.");
            }

             const hydratedNodes = newNodes.map((node: any) => ({
                ...node,
                data: {
                    ...node.data,
                    status: 'idle',
                    input: undefined,
                    output: undefined,
                    error: undefined,
                }
            }));

            setNodes(hydratedNodes);
            setEdges(newEdges);
            setSelectedNode(null);
            setIsPanelVisible(false);
            const explanation = response.explanation || 'Workflow updated!';
            finalMessages.push({ sender: 'system', text: explanation});
        } else if (response.intent === 'CONVERSE' && typeof response.payload === 'string') {
            finalMessages.push({ sender: 'ai', text: response.payload });
        } else {
             throw new Error("The AI returned an invalid response structure.");
        }
        setMessages(finalMessages);
    } catch (error: any) {
         console.error("AI Assistant failed:", error);
         setMessages(prev => [...prev, { sender: 'system', text: `Error: ${error.message}` }]);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleExportWorkflow = () => {
    const workflow = {
        nodes: nodes.map(node => {
            const { id, type, position, data } = node;
            
            const exportedData: any = { ...data };
            delete exportedData.status;
            delete exportedData.input;
            delete exportedData.error;
            delete exportedData.output;

            return { id, type, position, data: exportedData };
        }),
        edges,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(workflow, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "gemini-flow.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result as string;
              const workflow = JSON.parse(text);

              if (workflow && Array.isArray(workflow.nodes)) {
                  workflow.nodes.forEach((node: any) => {
                      if (node.position) {
                          node.position.x = Number(node.position.x) || 0;
                          node.position.y = Number(node.position.y) || 0;
                      } else {
                          node.position = { x: 50, y: 50 };
                      }
                      
                      if (node.data && (!node.data.config || typeof node.data.config !== 'object')) {
                        node.data.config = {};
                      }
                  });
              }

              if (isValidWorkflow(workflow)) {
                  const hydratedNodes = workflow.nodes.map((node: any) => ({
                      ...node,
                      data: {
                          ...node.data,
                          status: 'idle',
                          input: undefined,
                          output: undefined,
                          error: undefined,
                      }
                  }));

                  setNodes(hydratedNodes);
                  setEdges(workflow.edges);
                  setSelectedNode(null);
                  setIsPanelVisible(false);
              } else {
                  throw new Error("Invalid workflow file format.");
              }
          } catch (error: any) {
              alert(`Error importing workflow: ${error.message}`);
          }
      };
      reader.readAsText(file);
      
      if(event.target) {
          event.target.value = '';
      }
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between z-10">
        <h1 className="text-xl font-bold text-indigo-400 pl-4">Gemini Flow</h1>
        <div className="flex items-center space-x-4">
            <button onClick={() => { setIsSettingsPanelVisible(p => !p); setIsChatPanelVisible(false); }} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors duration-200" title="Settings">
                <CogIcon />
            </button>
            <button onClick={() => { setIsChatPanelVisible(p => !p); setIsSettingsPanelVisible(false); }} className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded transition-colors duration-200" title="AI Assistant">
                <ChatBubbleIcon />
                <span>AI Assistant</span>
            </button>
            <div className="w-px h-6 bg-gray-600"></div>
            <div className="flex items-center space-x-2">
                 <button onClick={handleImportClick} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded transition-colors duration-200" title="Import Workflow (JSON)">
                    <UploadIcon />
                    <span>Import</span>
                </button>
                <button onClick={handleExportWorkflow} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded transition-colors duration-200" title="Export Workflow (JSON)">
                    <DownloadIcon />
                    <span>Export</span>
                </button>
            </div>
            <div className="w-px h-6 bg-gray-600"></div>
            <div className="relative">
                <button onClick={() => setIsAddNodeMenuOpen(prev => !prev)} className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                    <PlusIcon />
                    <span>Add Node</span>
                </button>
                {isAddNodeMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-20 text-left">
                        <a href="#" onClick={(e) => { e.preventDefault(); addNode(NodeType.AI_AGENT); setIsAddNodeMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-gray-600"><AgentIcon /> AI Agent</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); addNode(NodeType.GEMINI_TEXT); setIsAddNodeMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-gray-600"><SparklesIcon /> Gemini Text</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); addNode(NodeType.SET_DATA); setIsAddNodeMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-gray-600"><EditIcon /> Set Data</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); addNode(NodeType.API_REQUEST); setIsAddNodeMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-gray-600"><CloudIcon /> API Request</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); addNode(NodeType.IF); setIsAddNodeMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-gray-600"><BranchIcon /> IF Condition</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); addNode(NodeType.LOG_OUTPUT); setIsAddNodeMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-gray-600"><TerminalIcon /> Log Output</a>
                    </div>
                )}
            </div>
            <button
              onClick={runWorkflow}
              disabled={isExecuting}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors duration-200 mr-4"
            >
              {isExecuting ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
              ) : <PlayIcon />}
              <span>{isExecuting ? 'Executing...' : 'Run Workflow'}</span>
            </button>
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden relative">
        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
        />
        {isPanelVisible && (
            <ConfigurationPanel 
                selectedNode={selectedNode}
                onUpdateNodeConfig={onUpdateNodeConfig}
                onUpdateNodeLabel={onUpdateNodeLabel}
                onDeleteNode={deleteNode}
                onClose={() => {
                    setIsPanelVisible(false);
                    setSelectedNode(null);
                }}
            />
        )}
        {isChatPanelVisible && (
            <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                onClose={() => setIsChatPanelVisible(false)}
                isLoading={isGenerating}
                apiKey={openRouterApiKey}
                onApiKeyChange={setOpenRouterApiKey}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
            />
        )}
        {isSettingsPanelVisible && (
            <SettingsPanel
                onClose={() => setIsSettingsPanelVisible(false)}
            />
        )}
      </main>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
    </div>
  );
};

export default App;