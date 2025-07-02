import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

/**
 * Generates text content using the Gemini Flash model.
 * @param prompt The text prompt to send to the model.
 * @returns The generated text as a string.
 */
export const generateText = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("Google AI API Key is not configured in the application environment.");
    }
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
        });
        
        const text = response.text;
        
        if (text) {
            return text;
        } else {
            // This case might happen if the response is blocked or empty.
            throw new Error("The model returned an empty or blocked response.");
        }
    } catch (e: any) {
        console.error("Error calling Gemini API:", e);
        // Re-throw a more user-friendly error message.
        throw new Error(`Gemini API Error: ${e.message || "An unknown error occurred."}`);
    }
};