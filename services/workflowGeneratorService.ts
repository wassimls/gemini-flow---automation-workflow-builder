import { AppNode, AppEdge } from '../types';

export const isValidWorkflow = (data: any): data is { nodes: AppNode[], edges: AppEdge[] } => {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) return false;

    const nodeIds = new Set(data.nodes.map((n: any) => n.id));

    for (const node of data.nodes) {
        if (
            typeof node.id !== 'string' ||
            typeof node.type !== 'string' ||
            typeof node.position !== 'object' ||
            !node.position ||
            typeof node.position.x !== 'number' ||
            typeof node.position.y !== 'number' ||
            typeof node.data !== 'object' ||
            !node.data ||
            typeof node.data.label !== 'string' ||
            typeof node.data.nodeType !== 'string' ||
            typeof node.data.config !== 'object' ||
            !node.data.config
        ) {
            console.error("Invalid node found in workflow file:", node);
            return false;
        }
    }
    
    for (const edge of data.edges) {
        if (
            typeof edge.id !== 'string' ||
            typeof edge.source !== 'string' ||
            typeof edge.target !== 'string' ||
            !nodeIds.has(edge.source) ||
            !nodeIds.has(edge.target)
        ) {
            console.error("Invalid edge found in workflow file:", edge);
            return false;
        }
    }

    return true;
};
