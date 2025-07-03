
import React from 'react';
import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { NodeData, AIAgentNodeConfig } from '../../types';
import BaseNode from './BaseNode';
import { AgentIcon } from './icons';

const AIAgentNode: React.FC<NodeProps<NodeData>> = ({ data }) => {
  const config = data.config as AIAgentNodeConfig;

  return (
    <BaseNode data={data} icon={<AgentIcon />}>
      <div className="space-y-1">
        <p className="font-semibold text-neutral-400">Agent Goal:</p>
        <p className="text-neutral-200 bg-neutral-700/50 p-2 rounded-md break-words text-xs font-mono max-h-28 overflow-y-auto">
          {config.goalTemplate || <span className="italic text-neutral-500">Not configured</span>}
        </p>
      </div>
    </BaseNode>
  );
};

export default memo(AIAgentNode);