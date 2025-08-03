export async function generateBotFromPrompt(prompt: string): Promise<Record<string, any>> {
  // appeler LLM ici (OpenAI / Claude) pour générer spec
  console.log('[Agent] Generating bot from prompt:', prompt);
  return { name: 'demo-bot', strategy: 'arbitrage', parameters: {} };
}