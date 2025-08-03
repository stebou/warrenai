/**
 * La configuration initiale fournie par l'utilisateur pour créer un bot.
 */
export interface BotCreationConfig {
  name: string;
  description?: string;
  strategyHints?: string[];
  riskLimits: {
    max_position_size: number;
    max_daily_loss: number;
  };
}

/**
 * La spécification complète du bot, générée par le LLM.
 */
export interface BotSpec {
  name: string;
  strategy: string;
  description: string;
  aiConfig: Record<string, any>;
  fromCache?: boolean;
  promptVersion?: string;
}