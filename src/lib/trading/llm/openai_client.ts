import type { LLMClient, BotSpec } from './llm_client';
import { log } from '@/lib/logger';
import { env } from '@/lib/env.mjs';

const OPENAI_API_KEY = env.OPENAI_API_KEY;

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenAIClient implements LLMClient {
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  private createFallbackSpec(prompt: string, error?: string): BotSpec {
    return {
      strategy: 'default_fallback',
      description: 'A fallback strategy due to an issue with the LLM.',
      aiConfig: { 
        prompt, 
        fallback: true, 
        error,
        source: 'openai_fallback',
        generatedAt: new Date().toISOString() 
      },
    };
  }

  async generateBotSpec(prompt: string): Promise<BotSpec> {
    if (!OPENAI_API_KEY) {
      log.warn('[OpenAIClient] OPENAI_API_KEY missing; falling back to minimal spec');
      return this.createFallbackSpec(prompt, 'OPENAI_API_KEY is not configured.');
    }

    try {
      log.info('[OpenAIClient] Calling OpenAI API...');
      const messages: OpenAIMessage[] = [
        {
          role: 'system',
          content: 'You are a high-performance trading bot spec generator. Respond with a single, minified JSON object containing "strategy" (string), "description" (string), and "aiConfig" (object). Do not include any other text or formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.2,
          max_tokens: 500,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        log.warn('[OpenAIClient] API error:', { status: res.status, body: text });
        return this.createFallbackSpec(prompt, text);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new Error('Invalid content from OpenAI response');
      }

      const parsedSpec = JSON.parse(content) as BotSpec;
      
      return {
        ...parsedSpec,
        aiConfig: {
          ...parsedSpec.aiConfig,
          prompt,
          source: 'openai',
          model: 'gpt-4o-mini',
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log.error('[OpenAIClient] Exception calling OpenAI:', { error: errorMessage });
      return this.createFallbackSpec(prompt, errorMessage);
    }
  }
}