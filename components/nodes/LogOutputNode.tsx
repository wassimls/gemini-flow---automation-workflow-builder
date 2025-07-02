
import React from 'react';
import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { NodeData } from '../../types';
import BaseNode from './BaseNode';
import { TerminalIcon } from './icons';

const LogOutputNode: React.FC<NodeProps<NodeData>> = ({ data }) => {
  return (
    <BaseNode data={data} icon={<TerminalIcon />}>
      <p>Logs the input it receives. Check the output below after running.</p>
    </BaseNode>
  );
};

export default memo(LogOutputNode);