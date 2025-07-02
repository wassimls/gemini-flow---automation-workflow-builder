
import { AppNode } from '../types';

// A robust 'get' function to safely access nested properties.
// It handles dot notation (prop1.prop2), bracket notation (['prop-with-dash']), and array indices ([0]).
const get = (obj: any, path: string, defaultValue: any = undefined) => {
    if (path == null || path.trim() === '') {
        return obj === undefined ? defaultValue : obj;
    }

    // This regex tokenizes the path into segments, correctly handling bracket notation.
    // e.g., 'a.b['c.d'][0]' becomes ['a', 'b', "['c.d']", '[0]']
    // We then clean up each segment.
    const pathArray = path.match(/[^.\[\]]+|\[(?:['"]?)(.*?)(?:['"]?)\]/g) || [];

    try {
        let current = obj;
        for (const segment of pathArray) {
            if (current === undefined || current === null) {
                return defaultValue;
            }
            // Clean up the segment to get the actual key by removing brackets and quotes.
            const key = segment.replace(/^\[['"]?|['"]?\]$/g, '');
            current = current[key];
        }
        return current === undefined ? defaultValue : current;
    } catch (e) {
        return defaultValue;
    }
};


/**
 * Resolves dynamic expressions in a string, replacing them with data from the workflow.
 * - `{{input}}`: The direct input to the current node.
 * - `{{$node['Node Label'].output.someKey}}`: Data from the output of another node, identified by its label.
 * @param str The string containing expressions to resolve.
 * @param nodes The array of all nodes in the workflow.
 * @param nodeOutputs A map of nodeId to its output data.
 * @param directInput The direct input for the current node's execution.
 * @returns The resolved value. If the entire string is an expression for a non-string value (like a JSON object), it returns that value directly. Otherwise, returns a string with expressions replaced.
 */
export const resolveExpressions = (
    str: string,
    nodes: AppNode[],
    nodeOutputs: Map<string, any>,
    directInput: any
): any => {
    if (typeof str !== 'string') return str;

    const trimmedStr = str.trim();

    // Regex to match an expression that spans the whole string, e.g., `{{$node['Start'].output.data['key']}}`
    const nodeExpressionRegex = /^{{\s*\$node\['(.*?)'\]\.output(.*?)?\s*}}$/;
    
    // Regex for the simple `{{input}}` expression
    const simpleInputRegex = /^{{\s*input\s*}}$/;

    // If the entire string is just `{{input}}`, return the raw input object
    if (simpleInputRegex.test(trimmedStr)) {
        return directInput;
    }

    // If the entire string is a node expression, resolve it and return the raw value
    const nodeMatch = trimmedStr.match(nodeExpressionRegex);
    if (nodeMatch) {
        const [, nodeLabel, rawPath] = nodeMatch;
        const targetNode = nodes.find(n => n.data.label === nodeLabel);
        if (!targetNode) return str; // Return original string if node not found
        const output = nodeOutputs.get(targetNode.id);
        if (output === undefined) return str; // Return original if node has no output yet
        const path = rawPath ? rawPath.trim().replace(/^\./, '') : '';
        return get(output, path, str);
    }

    // Otherwise, perform inline replacement for expressions within a larger string
    return str
      .replace(/{{\s*input\s*}}/g, () => (typeof directInput === 'string' ? directInput : JSON.stringify(directInput)))
      .replace(/{{\s*\$node\['(.*?)'\]\.output(.*?)?}}/g, (match, nodeLabel, rawPath) => {
        const targetNode = nodes.find(n => n.data.label === nodeLabel);
        if (!targetNode) return match;
        const output = nodeOutputs.get(targetNode.id);
        if (output === undefined) return match;
        const path = rawPath ? rawPath.trim().replace(/^\./, '') : '';
        const resolvedValue = get(output, path);
        
        if (resolvedValue === undefined) return match; // Keep original if path not found

        // Stringify if the resolved value is an object/array, otherwise use it directly
        return typeof resolvedValue === 'string' ? resolvedValue : JSON.stringify(resolvedValue);
      });
};
