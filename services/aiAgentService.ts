
import OpenAI from 'openai';
import { makeApiRequest } from './apiService';

const agentSystemPrompt = `You are a powerful AI Agent. Your goal is to help the user by accomplishing a given task.
You have access to a set of tools. You must use these tools to gather information and solve the task.
Think step-by-step.
1. Analyze the user's request.
2. If you need information from the web, use the 'make_api_request' tool. You can use it multiple times.
3. Once you have all the information, synthesize a final answer for the user.
4. Your final response should be a text string that directly answers the user's goal. Do not respond with tool calls in your final answer.
`;

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'make_api_request',
            description: 'Makes an HTTP request to a specified URL. Use this to fetch data from any API on the internet.',
            parameters: {
                type: 'object',
                properties: {
                    url: {
                        type: 'string',
                        description: 'The URL to make the request to.',
                    },
                    method: {
                        type: 'string',
                        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                        description: 'The HTTP method.',
                        default: 'GET',
                    },
                    headers: {
                        type: 'string',
                        description: 'A JSON string representing the request headers.',
                    },
                    body: {
                        type: 'string',
                        description: 'A JSON string representing the request body. Used for POST, PUT, PATCH.',
                    },
                },
                required: ['url'],
            },
        },
    },
];

export const runAgent = async (
    goal: string,
    openRouterApiKey: string,
    model: string,
): Promise<string> => {
    
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: openRouterApiKey,
      dangerouslyAllowBrowser: true,
    });
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: agentSystemPrompt },
        { role: 'user', content: goal },
    ];
    
    // Agent loop
    for (let i = 0; i < 5; i++) { // Limit to 5 iterations to prevent infinite loops
        const response = await openai.chat.completions.create({
            model: model,
            messages: messages,
            tools: tools,
            tool_choice: 'auto',
        });

        const responseMessage = response.choices[0].message;
        const toolCalls = responseMessage.tool_calls;

        if (toolCalls) {
            messages.push(responseMessage); // Add assistant's reply to history
            for (const toolCall of toolCalls) {
                const functionName = toolCall.function.name;
                if (functionName === 'make_api_request') {
                    let functionResponseContent: string;
                    try {
                        const functionArgs = JSON.parse(toolCall.function.arguments);
                        
                        let headers: Record<string, string> | undefined;
                        try {
                            if (functionArgs.headers) {
                               headers = JSON.parse(functionArgs.headers);
                            }
                        } catch (e) {
                             console.warn("AI Agent: Could not parse headers JSON", e);
                        }
                        
                        let bodyArg = functionArgs.body;
                        if (bodyArg && typeof bodyArg !== 'string') {
                            bodyArg = JSON.stringify(bodyArg);
                        }

                        const functionResponse = await makeApiRequest(
                            functionArgs.url,
                            functionArgs.method || 'GET',
                            headers,
                            bodyArg
                        );
                        
                        functionResponseContent = typeof functionResponse === 'string' ? functionResponse : JSON.stringify(functionResponse);
                    } catch (e: any) {
                        console.error("AI Agent: Failed to parse tool arguments or execute tool call.", e);
                        functionResponseContent = `Error: Failed to execute tool call. Invalid arguments provided. Details: ${e.message}`;
                    }

                    messages.push({
                        tool_call_id: toolCall.id,
                        role: 'tool',
                        content: functionResponseContent,
                    });
                }
            }
        } else {
            // No tool call, so this should be the final answer
            return responseMessage.content || "Agent finished with no output.";
        }
    }

    return "Agent reached maximum iterations without a final answer.";
};
