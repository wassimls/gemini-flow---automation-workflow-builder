
import React from 'react';
import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { NodeData, ApiRequestNodeConfig } from '../../types';
import BaseNode from './BaseNode';
import { CloudIcon } from './icons';

const ApiRequestNode: React.FC<NodeProps<NodeData>> = ({ data }) => {
  const config = data.config as ApiRequestNodeConfig;

  return (
    <BaseNode data={data} icon={<CloudIcon />}>
      <div className="space-y-1">
          <p className="font-semibold text-neutral-400">Method:</p>
          <p className="text-neutral-200 bg-neutral-700/50 p-1 px-2 rounded-md break-words text-xs font-mono">
            <span className={`font-bold ${config.method === 'GET' ? 'text-green-400' : 'text-orange-400'}`}>
                {config.method || 'N/A'}
            </span>
          </p>
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-neutral-400">URL:</p>
        <p className="text-neutral-200 bg-neutral-700/50 p-2 rounded-md break-words text-xs">
          {config.url || <span className="italic text-neutral-500">Not configured</span>}
        </p>
      </div>
    </BaseNode>
  );
};

export default memo(ApiRequestNode);