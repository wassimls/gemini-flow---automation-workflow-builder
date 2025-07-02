
import React from 'react';
import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { NodeData, IfNodeConfig, ExecutionStatus } from '../../types';
import { BranchIcon } from './icons';

// Copied from BaseNode.tsx for consistency
const statusClasses: Record<ExecutionStatus, string> = {
  idle: 'border-slate-500',
  running: 'border-blue-500 ring-4 ring-blue-500/30',
  success: 'border-green-500',
  error: 'border-red-500',
};


const IfNode: React.FC<NodeProps<NodeData>> = ({ data }) => {
  const config = data.config as IfNodeConfig;
  const hasOutput = data.output !== undefined && data.output !== null;

  return (
    <div className={`bg-slate-800 w-64 rounded-lg border-2 shadow-xl ${statusClasses[data.status]}`}>
      {/* Target handle */}
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />
      
      {/* Header */}
      <div className="p-3 border-b border-slate-700 flex items-center gap-3">
        <div className="text-slate-300"><BranchIcon /></div>
        <div className="font-bold text-slate-200">{data.label}</div>
      </div>
      
      {/* Content wrapper */}
      <div className="p-3 text-slate-300 text-sm space-y-2">
        <div className="text-center text-xs p-1 rounded-md bg-slate-700/50 font-mono">
            {config.value1 || <span className="italic text-slate-500">value1</span>}{' '}
            <span className="font-bold text-indigo-400">{config.operator || 'OP'}</span>{' '}
            {config.value2 || <span className="italic text-slate-500">value2</span>}
        </div>

        {/* Status/Error/Output rendering */}
        {data.status === 'error' && data.error && (
            <div className="text-red-400 bg-red-900/50 p-2 rounded-md break-words">
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

      {/* Source Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="!bg-green-500"
        style={{ top: '33%' }}
      />
      <div style={{ position: 'absolute', right: -40, top: 'calc(33% - 8px)', fontSize: '10px', color: '#86EFAC' }}>
        TRUE
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="!bg-red-500"
        style={{ top: '66%' }}
      />
      <div style={{ position: 'absolute', right: -45, top: 'calc(66% - 8px)', fontSize: '10px', color: '#F87171' }}>
        FALSE
      </div>
    </div>
  );
};

export default memo(IfNode);