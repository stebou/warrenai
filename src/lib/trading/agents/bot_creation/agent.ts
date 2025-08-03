import { createHash } from 'crypto';
import { log } from '@/lib/logger';
import { getCached, setCached } from '../cache';
import { getLlmClient } from '@/lib/trading/llm/llm_client';
import { buildBotSpecPrompt } from './prompt_builder';
import { parseBotSpecResponse } from './parser';
import type { BotCreationConfig, BotSpec } from './types';

export type { BotCreationConfig, BotSpec };

function generateCacheKey(config: BotCreationConfig): string {
  const { name, ...cacheableConfig } = config;
  const configString = JSON.stringify(cacheableConfig);
  return createHash('sha256').update(configString).digest('hex');
}

export async function generateBotFromConfig(config: BotCreationConfig): Promise<BotSpec> {
  const llmClient = getLlmClient();
  const prompt = buildBotSpecPrompt(config);
  const cacheKey = generateCacheKey(config);

  const cached = getCached<Omit<BotSpec, 'name'>>(cacheKey);
  if (cached) {
    log.info('[Agent] Cache hit. Returning stored bot specification.', { cacheKey });
    return {
      ...cached,
      name: config.name,
      fromCache: true,
      promptVersion: cacheKey,
    };
  }

  log.info('[Agent] Cache miss. Generating new bot spec from LLM.', { cacheKey });

  // CORRECTION : La méthode s'appelle `generateBotSpec`, pas `call`.
  const botSpecFromLLM = await llmClient.generateBotSpec(prompt);

  // Le parser n'est plus nécessaire ici car le client LLM retourne déjà un objet BotSpec.
  // On stocke directement la réponse du LLM dans le cache.
  const { name, ...cacheableSpec } = botSpecFromLLM;
  setCached(cacheKey, cacheableSpec);
  log.info('[Agent] New bot spec stored in cache.', { cacheKey });

  return {
    ...botSpecFromLLM,
    name: config.name, // On s'assure d'utiliser le nom demandé par l'utilisateur
    fromCache: false,
    promptVersion: cacheKey,
  };
}