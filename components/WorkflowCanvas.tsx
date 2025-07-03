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
    <div className="flex-grow h-full bg-neutral-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-neutral-950"
      >
        <Controls />
        <MiniMap nodeStrokeColor={(n) => {
            if (n.data?.status === 'success') return '#22c55e';
            if (n.data?.status === 'running') return '#3b82f6';
            if (n.data?.status === 'error') return '#ef4444';
            return '#404040';
        }} nodeColor={(n) => {
            if (n.style?.background) return n.style.background as string;
            return '#262626'
        }}
        />
        <Background gap={16} color="#262626" />
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas;