#!/usr/bin/env tsx
/**
 * Test script for OpenRouter embedding generation
 * Run with: npx tsx scripts/test-embeddings.ts
 */

import * as dotenv from 'dotenv';
import { generateEmbedding } from '../src/lib/embeddings';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function testEmbeddings() {
    console.log('🧪 Testing OpenRouter embedding generation...\n');

    try {
        // Test with a simple text
        const testText = "Portable water filtration pump for emergency survival";
        console.log(`Input text: "${testText}"\n`);

        const embedding = await generateEmbedding(testText);

        console.log('✅ Embedding generated successfully!');
        console.log(`📊 Embedding dimensions: ${embedding.length}`);
        console.log(`📈 First 5 values: [${embedding.slice(0, 5).join(', ')}...]`);
        console.log(`📉 Last 5 values: [...${embedding.slice(-5).join(', ')}]`);

        // Verify it's a valid embedding
        if (!Array.isArray(embedding)) {
            throw new Error('Embedding is not an array');
        }

        if (embedding.length === 0) {
            throw new Error('Embedding is empty');
        }

        if (!embedding.every(val => typeof val === 'number')) {
            throw new Error('Embedding contains non-numeric values');
        }

        console.log('\n✅ All validation checks passed!');
        console.log('🎉 OpenRouter embedding generation is working correctly!\n');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the test
testEmbeddings();
