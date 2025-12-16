import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
        // Check if API key is present
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not set");
        }

        const model = "text-embedding-004";
        const result = await ai.models.embedContent({
            model: model,
            contents: [{ // Array of contents
                parts: [{ text }]
            }]
        });
        
        // The SDK returns 'embeddings' array for multiple inputs or 'embedding' for single?
        // Let's check what we got in the test script: "Result keys: [ 'sdkHttpResponse', 'embeddings' ]"
        // So it returns 'embeddings' (plural) which is an array.
        
        if (result.embeddings && result.embeddings.length > 0 && result.embeddings[0].values) {
            return result.embeddings[0].values;
        }
        // If no embeddings returned, throw error
        throw new Error(`No embedding returned. Keys: ${Object.keys(result).join(', ')}`);
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
};
