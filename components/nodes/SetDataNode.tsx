
import React from 'react';
import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { NodeData, SetDataNodeConfig } from '../../types';
import BaseNode from './BaseNode';
import { EditIcon } from './icons';

const SetDataNode: React.FC<NodeProps<NodeData>> = ({ data }) => {
  const config = data.config as SetDataNodeConfig;

  return (
    <BaseNode data={data} icon={<EditIcon />}>
      <p className="font-semibold text-neutral-400">JSON Data:</p>
      <pre className="text-xs p-2 rounded-md bg-neutral-700/50 font-mono whitespace-pre-wrap break-all">
        {config.data || <span className="italic text-neutral-500">Not configured</span>}
      </pre>
    </BaseNode>
  );
};

export default memo(SetDataNode);