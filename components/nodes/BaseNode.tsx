
import React from 'react';
import { Handle, Position } from 'reactflow';
import { ExecutionStatus, NodeData } from '../../types';

interface BaseNodeProps {
  data: NodeData;
  icon: React.ReactNode;
  children?: React.ReactNode;
}

const statusClasses: Record<ExecutionStatus, string> = {
  idle: 'border-neutral-600',
  running: 'border-green-500 ring-4 ring-green-500 pulse-ring',
  success: 'border-green-500',
  error: 'border-red-500',
};

const BaseNode: React.FC<BaseNodeProps> = ({ data, icon, children }) => {
  const isStartNode = data.nodeType === 'start';
  const hasOutput = data.output !== undefined && data.output !== null;

  return (
    <div className={`bg-neutral-800 w-64 rounded-lg border-2 shadow-xl ${statusClasses[data.status]}`}>
      {!isStartNode && <Handle type="target" position={Position.Left} className="!bg-neutral-500" />}
      
      <div className="p-3 flex items-center gap-3">
        <div className="text-neutral-300">{icon}</div>
        <div className="font-bold text-neutral-200">{data.label}</div>
      </div>
      
      <div className="px-3 pb-3 text-neutral-300 text-sm space-y-2">
        {children}
        {data.status === 'error' && data.error && (
            <div className="text-red-300 bg-red-900/50 p-2 rounded-md break-words">
                <p className="font-bold">Error:</p>
                <p>{data.error}</p>
            </div>
        )}
        {data.status === 'success' && hasOutput && (
          <div className="text-green-300 bg-green-900/50 p-2 rounded-md break-words">
            <p className="font-bold">Output:</p>
            <pre className="whitespace-pre-wrap text-xs">
              {typeof data.output === 'string'
                ? data.output
                : JSON.stringify(data.output, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-neutral-500" />
    </div>
  );
};

export default BaseNode;