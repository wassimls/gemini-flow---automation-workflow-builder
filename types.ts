import type { Node, Edge } from 'reactflow';

export enum NodeType {
  START = 'start',
  API_REQUEST = 'apiRequest',
  LOG_OUTPUT = 'logOutput',
  IF = 'if',
  SET_DATA = 'setData',
  GEMINI_TEXT = 'geminiText',
  AI_AGENT = 'aiAgent',
}

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error';

interface BaseNodeConfig {}

export interface StartNodeConfig extends BaseNodeConfig {
  outputData?: string; // JSON string for the initial output data
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiRequestNodeConfig extends BaseNodeConfig {
  url: string;
  method: HttpMethod;
  headers: string; // JSON string for headers
  bodyTemplate: string; // JSON string template for request body
}

export interface GeminiTextNodeConfig extends BaseNodeConfig {
  promptTemplate: string;
}

export interface AIAgentNodeConfig extends BaseNodeConfig {
  goalTemplate: string;
}

export type IfOperator = '===' | '!==' | '>' | '<' | '>=' | '<=';

export interface IfNodeConfig extends BaseNodeConfig {
    value1: string;
    operator: IfOperator;
    value2: string;
}

export interface LogOutputNodeConfig extends BaseNodeConfig {}

export interface SetDataNodeConfig extends BaseNodeConfig {
    data: string; // JSON string
}

export type NodeConfig = StartNodeConfig | ApiRequestNodeConfig | LogOutputNodeConfig | IfNodeConfig | SetDataNodeConfig | GeminiTextNodeConfig | AIAgentNodeConfig;

export interface NodeData {
  nodeType: NodeType;
  label: string;
  config: NodeConfig;
  input?: any;
  output?: any;
  status: ExecutionStatus;
  error?: string;
}

export type AppNode = Node<NodeData>;
export type AppEdge = Edge;