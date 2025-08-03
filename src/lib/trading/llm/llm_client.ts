// create new file src/lib/trading/llm/llm_client.ts
export interface BotSpec {
  strategy: string;
  description?: string; // Correction: Ajout de la description optionnelle
  aiConfig: Record<string, any>;
}

export interface LLMClient {
  /**
   * Génère une spécification de bot à partir d'un prompt.
   */
  generateBotSpec(prompt: string): Promise<BotSpec>;
}