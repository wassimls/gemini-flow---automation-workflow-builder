import React, { useMemo } from 'react';
import ReactFlow, { 
    Controls, 
    MiniMap, 
    Background, 
    type OnConnect, 
    type OnNodesChange, 
    type OnEdgesChange 
} from 'reactflow';
import { AppNode, AppEdge, NodeType } from '../types';
import StartNode from './nodes/StartNode';
import ApiRequestNode from './nodes/ApiRequestNode';
import LogOutputNode from './nodes/LogOutputNode';
import IfNode from './nodes/IfNode';
import SetDataNode from './nodes/SetDataNode';
import GeminiTextNode from './nodes/GeminiTextNode';
import AIAgentNode from './nodes/AIAgentNode';

interface WorkflowCanvasProps {
  nodes: AppNode[];
  edges: AppEdge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeClick: (event: React.MouseEvent, node: AppNode) => void;
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
}) => {
  const nodeTypes = useMemo(() => ({
    [NodeType.START]: StartNode,
    [NodeType.API_REQUEST]: ApiRequestNode,
    [NodeType.LOG_OUTPUT]: LogOutputNode,
    [NodeType.IF]: IfNode,
    [NodeType.SET_DATA]: SetDataNode,
    [NodeType.GEMINI_TEXT]: GeminiTextNode,
    [NodeType.AI_AGENT]: AIAgentNode,
  }), []);

  return (
    <div className="flex-grow h-full bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-900"
      >
        <Controls />
        <MiniMap nodeStrokeColor={(n) => {
            if (n.type === 'input') return '#0041d0';
            if (n.type === 'output') return '#ff0072';
            if (n.type === 'default') return '#1a192b';
            return '#eee';
        }} nodeColor={(n) => {
            if (n.style?.background) return n.style.background as string;
            return '#333'
        }}
        />
        <Background gap={16} color="#4A5568" />
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas;