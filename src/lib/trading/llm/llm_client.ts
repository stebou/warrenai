import { env } from '@/lib/env.mjs';
import { OpenAIClient } from './openai_client';
// On importe les types depuis leur emplacement correct
import type { BotSpec } from '../agents/bot_creation/types';

// On exporte BotSpec pour que openai_client puisse l'utiliser
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
 * Maintenant utilise toujours OpenAI (pas de mock).
 */
export function getLlmClient(): LLMClient {
  if (!llmClient) {
    if (!env.USE_REAL_LLM) {
      throw new Error('USE_REAL_LLM must be set to true. Mock LLM client has been removed.');
    }
    llmClient = new OpenAIClient();
  }
  return llmClient;
}