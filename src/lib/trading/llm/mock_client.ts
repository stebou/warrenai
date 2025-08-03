import type { LLMClient, BotSpec } from './llm_client'; // <-- Cet import fonctionne maintenant
import { log } from '@/lib/logger';

export class MockLLMClient implements LLMClient {
  async generateBotSpec(prompt: string): Promise<BotSpec> {
    log.info('[MockLLM] Received prompt for spec generation.');
    await new Promise(resolve => setTimeout(resolve, 50)); 
    
    return {
      name: 'mock-bot', // Le type BotSpec requiert un nom
      strategy: 'arbitrage_mock',
      description: 'A mock strategy for testing purposes.', // Le type BotSpec requiert une description
      aiConfig: {
        prompt,
        fallback: true,
        source: 'mock',
        generatedAt: new Date().toISOString(),
      },
    };
  }
}