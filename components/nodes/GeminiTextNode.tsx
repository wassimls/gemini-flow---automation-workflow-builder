
import React from 'react';
import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { NodeData, GeminiTextNodeConfig } from '../../types';
import BaseNode from './BaseNode';
import { SparklesIcon } from './icons';

const GeminiTextNode: React.FC<NodeProps<NodeData>> = ({ data }) => {
  const config = data.config as GeminiTextNodeConfig;

  return (
    <BaseNode data={data} icon={<SparklesIcon />}>
      <div className="space-y-1">
        <p className="font-semibold text-slate-400">Prompt Template:</p>
        <p className="text-slate-200 bg-slate-700/50 p-2 rounded-md break-words text-xs font-mono max-h-28 overflow-y-auto">
          {config.promptTemplate || <span className="italic text-slate-500">Not configured</span>}
        </p>
      </div>
    </BaseNode>
  );
};

export default memo(GeminiTextNode);