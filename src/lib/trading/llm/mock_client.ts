import type { LLMClient, BotSpec } from './llm_client';
import { log } from '@/lib/logger';

export class MockLLMClient implements LLMClient {
  async generateBotSpec(prompt: string): Promise<BotSpec> {
    log.info('[MockLLM] Received prompt for spec generation.');
    // Simule un petit délai pour imiter un appel réseau
    await new Promise(resolve => setTimeout(resolve, 50)); 
    
    return {
      strategy: 'arbitrage_mock',
      // La propriété 'description' a été retirée pour se conformer à l'interface BotSpec
      aiConfig: {
        prompt,
        fallback: true,
        source: 'mock',
        generatedAt: new Date().toISOString(),
      },
    };
  }
}