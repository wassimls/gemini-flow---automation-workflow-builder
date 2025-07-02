
import React from 'react';
import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { NodeData, StartNodeConfig } from '../../types';
import BaseNode from './BaseNode';
import { PlayIcon } from './icons';

const StartNode: React.FC<NodeProps<NodeData>> = ({ data }) => {
  const config = data.config as StartNodeConfig;

  return (
    <BaseNode data={data} icon={<PlayIcon />}>
      <p>This is the starting point of the workflow.</p>
      {config.outputData && (
        <div className="mt-2">
            <p className="font-semibold text-slate-400">Initial Data:</p>
            <pre className="text-xs p-2 rounded-md bg-slate-700/50 font-mono whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                {config.outputData}
            </pre>
        </div>
      )}
    </BaseNode>
  );
};

export default memo(StartNode);