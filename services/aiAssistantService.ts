import OpenAI from 'openai';
import { AppNode, AppEdge } from '../types';
import { Message } from '../components/ChatPanel';

const SYSTEM_INSTRUCTION = `You are a helpful and interactive AI assistant for a visual workflow builder app called Gemini Flow.
Your primary goal is to assist the user by having conversations and modifying the workflow on the canvas.

**IMPORTANT CONTEXT**
The user's prompt will be preceded by the current workflow state, serialized as a JSON string:
\`\`\`json
{
  "nodes": [/*...current nodes...*/],
  "edges": [/*...current edges...*/]
}
\`\`\`
You MUST analyze this context to understand what is currently on the canvas.

**YOUR CAPABILITIES**
1.  **CONVERSE**: Have a helpful conversation, answer questions about the app or the current workflow, provide guidance, or chat.
2.  **UPDATE_WORKFLOW**: Modify the workflow. This includes creating, adding, deleting, or changing nodes and edges based on the user's request.

**RESPONSE FORMAT**
You MUST respond with a single valid JSON object. Do not add any explanatory text before or after the JSON.
The JSON object must have this structure:
{
  "intent": "CONVERSE" | "UPDATE_WORKFLOW",
  "payload": "string" | { "nodes": [...], "edges": [...] },
  "explanation": "A short, user-facing explanation of the changes you made. (Optional, only for UPDATE_WORKFLOW)"
}

**INTENT-BASED PAYLOAD**
- If \`intent\` is "CONVERSE", the \`payload\` MUST be a string containing your friendly, helpful response.
- If \`intent\` is "UPDATE_WORKFLOW", the \`payload\` MUST be a JSON object containing the **ENTIRE, NEW** state of the workflow, including all existing nodes/edges you want to keep and any modifications. Your \`explanation\` should summarize what you did (e.g., "I added a Log node after the API request.").

**HOW TO DETERMINE INTENT**
- **CONVERSE**: If the user asks a question ("how do I..?", "what does this node do?", "why did it fail?"), wants help, or makes a general statement.
- **UPDATE_WORKFLOW**: If the user asks you to "create", "build", "add", "change", "connect", "delete", or "modify" any part of the workflow.

**WORKFLOW MODIFICATION RULES (for "UPDATE_WORKFLOW" intent)**
1.  **Analyze first**: Look at the provided workflow JSON. Don't start from scratch unless asked to "create a new workflow" or "delete everything".
2.  **Return the full state**: Your response payload MUST contain the complete list of nodes and edges for the new state. Do not send only the changes.
3.  **Preserve positions**: When modifying, try to keep the positions of existing nodes unless the user asks for a rearrangement. When adding new nodes, place them logically relative to existing nodes.
4.  **Maintain consistency**: Ensure all IDs are unique. Edge IDs should be 'e[sourceId]-[targetId]'. For 'if' nodes, include the handle, e.g., 'e[sourceId]t-[targetId]'.
5.  **Use available tools**: Available Node Types: "start", "if", "apiRequest", "logOutput", "setData", "geminiText", "aiAgent". The "geminiText" node sends a prompt to Google's Gemini model and outputs the text response. Set \`data.nodeType\` correctly.
`;

export type AIResponse =
  | {
      intent: 'CONVERSE';
      payload: string;
      explanation?: never;
    }
  | {
      intent: 'UPDATE_WORKFLOW';
      payload: {
        nodes: AppNode[];
        edges: AppEdge[];
      };
      explanation?: string;
    };

// Convert app messages to the format expected by OpenAI-compatible APIs
const buildHistory = (messages: Message[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] => {
    // We only want user and AI messages for the history
    const chatHistory = messages.filter(msg => msg.sender === 'user' || msg.sender === 'ai');
    
    // The last message in chatHistory is the current user prompt, so we exclude it.
    return chatHistory.slice(0, -1).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
    }));
};


export const sendMessageToAI = async (
    allMessages: Message[],
    nodes: AppNode[],
    edges: AppEdge[],
    openRouterApiKey: string,
    model: string
): Promise<AIResponse> => {
    if (!openRouterApiKey) {
        throw new Error("OpenRouter API Key is not configured for the AI Assistant.");
    }

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: openRouterApiKey,
      dangerouslyAllowBrowser: true, // This is required for client-side usage
    });

    const history = buildHistory(allMessages);
    const lastMessage = allMessages[allMessages.length - 1];
    
    // Create the context string
    const workflowContext = `This is the current workflow state on the canvas:\n\`\`\`json\n${JSON.stringify({ nodes, edges }, null, 2)}\n\`\`\`\n\nUser Request: ${lastMessage.text}`;

    try {
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: SYSTEM_INSTRUCTION },
                ...history,
                { role: "user", content: workflowContext }
            ],
            max_tokens: 4096, // Add a token limit to prevent credit errors
        });

        let text = completion.choices[0].message.content;

        if (!text) {
          throw new Error("The AI model returned an empty response.");
        }

        // Robust parsing to handle models that wrap JSON in markdown
        const jsonRegex = /```json\s*\n([\s\S]*?)\n\s*```/;
        const match = text.match(jsonRegex);
        if (match && match[1]) {
            text = match[1];
        } else {
             // Fallback for models that don't use markdown fences
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                text = text.substring(firstBrace, lastBrace + 1);
            }
        }

        const aiResponse = JSON.parse(text) as AIResponse;

        if (!aiResponse || !aiResponse.intent || aiResponse.payload === undefined) {
             throw new Error("AI response is not in the expected format (intent/payload).");
        }

        return aiResponse;

    } catch (e: any) {
        console.error("Error communicating with AI Assistant:", e);
        if (e instanceof OpenAI.APIError) {
             throw new Error(`OpenRouter API Error: ${e.status} ${e.name} - ${e.message}`);
        }
        throw new Error(`The AI model returned an error or invalid data. Details: ${e.message}`);
    }
};