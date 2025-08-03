import { buildBotPrompt } from './prompt_builder';
import type { LLMClient } from '../../llm/llm_client';
import { MockLLMClient } from '../../llm/mock_client';
import { OpenAIClient } from '../../llm/openai_client';
import { getCached, setCached } from '../../cache';
import { log } from '@/lib/logger';
import { env } from '@/lib/env.mjs';
import crypto from 'crypto';

// Sélectionne le client LLM en fonction de la variable d'environnement
const llmClient: LLMClient = env.USE_REAL_LLM ? new OpenAIClient() : new MockLLMClient();

export interface BotCreationConfig {
  name: string;
  description?: string;
  initialAllocation?: number;
  strategyHints?: string[];
  riskLimits: { max_position_size: number; max_daily_loss: number };
  otherConfig?: Record<string, any>;
}

// Utilise crypto pour un hash plus robuste, garantissant une meilleure unicité pour le cache
function hashPrompt(prompt: string): string {
  return crypto.createHash('sha256').update(prompt).digest('hex');
}

export async function generateBotFromConfig(config: BotCreationConfig) {
  const prompt = buildBotPrompt(config);
  const cacheKey = `botSpec:${hashPrompt(prompt)}`;

  // 1. Vérifier le cache d'abord
  const cached = getCached(cacheKey);
  if (cached) {
    log.info('[Agent] Cache hit for botSpec', { cacheKey });
    return {
      ...cached,
      name: config.name, // Correction 1: 'name' est placé après pour avoir la priorité
      fromCache: true,
    };
  }

  // 2. Si pas de cache, appeler le client LLM (réel ou mock)
  log.info('[Agent] Generating new bot spec from LLM', { name: config.name });
  const botSpec = await llmClient.generateBotSpec(prompt);

  // 3. Mettre le nouveau résultat en cache
  setCached(cacheKey, botSpec);
  
  // 4. Retourner la spécification complète du bot
  return {
    ...botSpec,
    name: config.name, // Correction 1: 'name' est placé après pour avoir la priorité
    promptVersion: cacheKey, // Inclure la version du prompt pour le suivi
  };
} // Correction 2: Ajout de