import { AppNode, AppEdge } from '../types';

/**
 * Performs a backward traversal (DFS) from a given node to find all its ancestors.
 * This is used to prevent circular dependencies when picking data sources.
 * @param startNodeId The ID of the node to start the search from.
 * @param nodes A list of all nodes in the workflow.
 * @param edges A list of all edges in the workflow.
 * @returns An array of AppNode objects that are ancestors of the start node.
 */
export const findAncestors = (startNodeId: string, nodes: AppNode[], edges: AppEdge[]): AppNode[] => {
  const ancestors = new Map<string, AppNode>();
  const queue: string[] = [startNodeId];
  const visited = new Set<string>(); // Keep track of nodes whose parents have been queued

  while (queue.length > 0) {
    const currentNodeId = queue.shift()!;
    if (visited.has(currentNodeId)) {
      continue;
    }
    visited.add(currentNodeId);

    const parentEdges = edges.filter(edge => edge.target === currentNodeId);
    for (const edge of parentEdges) {
      const parentNode = nodes.find(node => node.id === edge.source);
      if (parentNode && !ancestors.has(parentNode.id)) {
        ancestors.set(parentNode.id, parentNode);
        queue.push(parentNode.id);
      }
    }
  }
  
  return Array.from(ancestors.values());
};
