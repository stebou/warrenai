import OpenAI from 'openai';
import { env } from '@/lib/env.mjs';
import { log } from '@/lib/logger';
import type { LLMClient, BotSpec } from './llm_client';
import { enhancedCache } from '../cache/enhanced-cache';

export class OpenAIClient implements LLMClient {
  private openai: OpenAI;

  constructor() {
    if (!env.OPENAI_API_KEY) {
      const errorMessage = 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment.';
      log.error(errorMessage);
      throw new Error(errorMessage);
    }
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
    log.info('[OpenAIClient] Initialized successfully.');
  }

  private createFallbackSpec(prompt: string, error?: string): BotSpec {
    log.error('[OpenAIClient] OpenAI call failed, creating fallback spec.', { error });
    return {
      name: 'fallback-bot',
      strategy: 'default_fallback',
      description: 'A fallback strategy created due to an AI generation error.',
      aiConfig: {
        prompt, // <-- Prompt brut
        fallback: true,
        source: 'openai-fallback',
        error: error || 'Unknown error',
        generatedAt: new Date().toISOString(), // <-- Timestamp
      },
    };
  }

  async generateBotSpec(prompt: string): Promise<BotSpec> {
    const model = 'gpt-4-turbo';
    const requestParams = { response_format: { type: 'json_object' } };
    
    // 1. Vérifier le cache d'abord
    const cachedResult = enhancedCache.get<BotSpec>(prompt, model, requestParams);
    if (cachedResult) {
      log.info('[OpenAIClient] Using cached result, skipping OpenAI API call');
      return cachedResult;
    }

    log.info('[OpenAIClient] Cache miss, calling OpenAI API...');
    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('OpenAI response content is empty.');
      }

      log.info('[OpenAIClient] Successfully received and parsed response from OpenAI.');
      
      const parsedSpec = JSON.parse(content) as Omit<BotSpec, 'name'>;
      
      const result: BotSpec = {
        name: 'ai-generated-bot',
        ...parsedSpec,
        aiConfig: {
          ...parsedSpec.aiConfig,
          // --- AJOUTS POUR LA TRAÇABILITÉ ---
          prompt, // <-- 1. Stocker le prompt brut
          source: 'openai',
          model: response.model,
          generatedAt: new Date().toISOString(), // <-- 2. Stocker le timestamp
        },
      };

      // 2. Stocker le résultat dans le cache (TTL: 2 heures pour les BotSpecs)
      enhancedCache.set(prompt, result, model, requestParams, 1000 * 60 * 120);
      
      return result;
    } catch (error: any) {
      const fallbackResult = this.createFallbackSpec(prompt, error.message);
      
      // 3. Mettre en cache même les fallbacks (TTL court: 5 minutes)
      enhancedCache.set(prompt, fallbackResult, model + '_fallback', requestParams, 1000 * 60 * 5);
      
      return fallbackResult;
    }
  }
}