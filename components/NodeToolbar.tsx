import React from 'react';
import { NodeType } from '../types';
import { AgentIcon, SparklesIcon, EditIcon, CloudIcon, BranchIcon, TerminalIcon } from './nodes/icons';

interface NodeToolbarProps {
    onAddNode: (type: NodeType) => void;
}

interface ToolbarButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        title={label}
        className="p-3 rounded-lg text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors duration-200"
        aria-label={label}
    >
        {icon}
    </button>
);

const nodeTools = [
    { type: NodeType.AI_AGENT, label: 'Add AI Agent Node', icon: <AgentIcon /> },
    { type: NodeType.GEMINI_TEXT, label: 'Add Gemini Text Node', icon: <SparklesIcon /> },
    { type: NodeType.API_REQUEST, label: 'Add API Request Node', icon: <CloudIcon /> },
    { type: NodeType.IF, label: 'Add IF Condition Node', icon: <BranchIcon /> },
    { type: NodeType.SET_DATA, label: 'Add Set Data Node', icon: <EditIcon /> },
    { type: NodeType.LOG_OUTPUT, label: 'Add Log Output Node', icon: <TerminalIcon /> },
];

const NodeToolbar: React.FC<NodeToolbarProps> = ({ onAddNode }) => {
    return (
        <aside className="w-16 bg-neutral-900 p-2 flex flex-col items-center space-y-2 border-r border-neutral-800 flex-shrink-0">
            {nodeTools.map(tool => (
                <ToolbarButton
                    key={tool.type}
                    icon={tool.icon}
                    label={tool.label}
                    onClick={() => onAddNode(tool.type)}
                />
            ))}
        </aside>
    );
};

export default NodeToolbar;
