import type { BotSpec } from './types'; // Assurez-vous que le chemin est correct
import { log } from '@/lib/logger';

/**
 * Analyse la réponse JSON du LLM et la transforme en un objet BotSpec.
 * @param llmResponse La réponse brute (chaîne JSON) du LLM.
 * @returns Un objet BotSpec validé.
 */
export function parseBotSpecResponse(llmResponse: string): Omit<BotSpec, 'name'> {
  try {
    // Ici, nous pourrions ajouter une validation plus robuste avec Zod
    const parsed = JSON.parse(llmResponse);
    if (!parsed.strategy || !parsed.description || !parsed.aiConfig) {
      throw new Error('LLM response is missing required fields.');
    }
    return parsed;
  } catch (error) {
    log.error('[AgentParser] Failed to parse LLM response.', { error, response: llmResponse });
    throw new Error('Could not parse the bot specification from the AI response.');
  }
}