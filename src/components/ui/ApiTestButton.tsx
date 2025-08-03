'use client';

import { useState } from 'react';

export function ApiTestButton() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTestClick = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/bots/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Correction : Le nom est rendu unique pour éviter le cache du serveur
          name: `OpenAITest_${Date.now()}`,
          description: "A bot generated to test the OpenAI client.",
          strategyHints: ["scalping", "low-risk"],
          riskLimits: {
            max_position_size: 0.05,
            max_daily_loss: -0.01,
          },
        }),
      });

      const data = await response.json();
      setResult(`Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 border-2 border-dashed rounded-lg bg-background/50">
      <h3 className="font-bold text-lg">Test de l'API</h3>
      <p className="text-sm text-muted-foreground">
        Cliquez pour tester l'endpoint <code>POST /api/bots/create</code>.
      </p>
      <button
        onClick={handleTestClick}
        disabled={loading}
        className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Test en cours...' : "Lancer le Test"}
      </button>
      {result && (
        <pre className="mt-4 p-2 bg-slate-100 dark:bg-slate-800 rounded text-sm overflow-x-auto">
          <code>{result}</code>
        </pre>
      )}
    </div>
  );
}