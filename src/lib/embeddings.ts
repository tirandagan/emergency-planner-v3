/**
 * Embedding Generation using OpenRouter
 *
 * OpenRouter supports OpenAI's text-embedding models via their API.
 * We use direct fetch to OpenRouter's API endpoint with the OpenAI-compatible format.
 * Reference: https://openrouter.ai/docs/api-reference
 */

// Using OpenAI's text-embedding-3-small via OpenRouter
// https://openrouter.ai/openai/text-embedding-3-small
const EMBEDDING_MODEL = "openai/text-embedding-3-small";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/embeddings";

interface OpenRouterEmbeddingResponse {
    object: string;
    data: Array<{
        object: string;
        embedding: number[];
        index: number;
    }>;
    model: string;
    usage?: {
        prompt_tokens: number;
        total_tokens: number;
    };
}

export const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
        // Check if API key is present
        if (!process.env.OPENROUTER_API_KEY) {
            throw new Error("OPENROUTER_API_KEY is not set");
        }

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                'X-Title': 'beprepared.ai',
            },
            body: JSON.stringify({
                model: EMBEDDING_MODEL,
                input: text,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
        }

        const result: OpenRouterEmbeddingResponse = await response.json();

        // Extract the embedding from the response
        if (result.data && result.data.length > 0 && Array.isArray(result.data[0].embedding)) {
            return result.data[0].embedding;
        }

        // If no embeddings returned, throw error
        throw new Error(`No embedding returned. Response: ${JSON.stringify(result)}`);
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
};
