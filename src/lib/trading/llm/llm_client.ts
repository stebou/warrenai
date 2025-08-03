import { env } from '@/lib/env.mjs';
import { OpenAIClient } from './openai_client';
import { MockLLMClient } from './mock_client';
// On importe les types depuis leur emplacement correct
import type { BotSpec } from '../agents/bot_creation/types';

// On exporte BotSpec pour que openai_client et mock_client puissent l'utiliser
export type { BotSpec };

/**
 * Définit le contrat pour tout client LLM.
 * Chaque client doit avoir une méthode `generateBotSpec`.
 */
export interface LLMClient {
  generateBotSpec(prompt: string): Promise<BotSpec>;
}

let llmClient: LLMClient;

/**
 * Récupère une instance unique (singleton) du client LLM.
 */
export function getLlmClient(): LLMClient {
  if (!llmClient) {
    // La variable d'environnement s'appelle USE_REAL_LLM dans votre diagnostic
    if (env.USE_REAL_LLM) {
      llmClient = new OpenAIClient();
    } else {
      llmClient = new MockLLMClient();
    }
  }
  return llmClient;
}