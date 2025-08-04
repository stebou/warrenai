# Tests du Cache LLM

## Vue d'ensemble

Suite complète de tests pour valider le fonctionnement du cache amélioré des appels LLM. Le cache utilise un hash SHA-256 des prompts comme clé et implémente TTL, éviction automatique, et métriques détaillées.

## Architecture du Cache

```
Enhanced Cache
├── Hash SHA-256 des prompts (normalisés)
├── TTL configurable par type de contenu
├── Éviction automatique (LRU + taille max)
├── Métriques en temps réel
├── Nettoyage périodique
└── API REST pour administration
```

## Types de Tests

### 1. Tests Unitaires (`cache.test.js`)
Tests isolés des fonctionnalités de base du cache :
- ✅ Cache miss/hit
- ✅ Hash consistency et normalisation
- ✅ TTL et expiration
- ✅ Métriques complètes
- ✅ Clear cache

### 2. Tests d'Intégration (`openai-cache-integration.test.js`)
Tests du cache intégré avec le client OpenAI :
- ✅ Premier appel sans cache
- ✅ Deuxième appel avec cache hit
- ✅ Prompts similaires mais différents
- ✅ Différents modèles (GPT-4, GPT-3.5)
- ✅ Gestion des erreurs et fallback
- ✅ Mesure de performance

### 3. Tests API (`cache-api.test.js`)
Tests de l'API REST des métriques :
- ✅ GET `/api/cache/metrics`
- ✅ DELETE `/api/cache/metrics` (clear)
- ✅ Structure des réponses
- ✅ Gestion des erreurs HTTP
- ✅ Test de charge API

### 4. Tests Manuels (`test-cache-manual.js`)
Tests de charge en conditions réelles :
- ✅ Test de charge avec prompts variés
- ✅ Mesure de performance cache vs API
- ✅ Tests des fonctionnalités avancées
- ✅ Métriques en temps réel

## Exécution des Tests

### Commands Rapides

```bash
# Tous les tests
npm run test:cache

# Tests spécifiques
npm run test:cache:unit           # Tests unitaires uniquement
npm run test:cache:integration    # Tests d'intégration
npm run test:cache:api           # Tests API (serveur requis)
npm run test:cache:manual        # Tests manuels/charge
```

### Options Avancées

```bash
# Mode verbeux
npm run test:cache -- --verbose

# Ignorer tests API si serveur non démarré
npm run test:cache -- --skip-api

# Tests unitaires seulement (plus rapide)
npm run test:cache -- --unit-only

# Ignorer tests manuels
npm run test:cache -- --skip-manual
```

## Prérequis

### Pour tous les tests
- Node.js installé
- Dépendances installées (`npm install`)

### Pour les tests API
- Serveur Next.js démarré : `npm run dev`
- Port 3000 disponible

### Pour les tests avec vrai OpenAI
- Variable d'environnement : `USE_REAL_OPENAI=true`
- Variable d'environnement : `OPENAI_API_KEY=your_key`

## Métriques Testées

Le cache expose les métriques suivantes :

```typescript
interface CacheMetrics {
  hits: number;        // Nombre de cache hits
  misses: number;      // Nombre de cache misses  
  sets: number;        // Nombre d'écritures
  evictions: number;   // Nombre d'évictions
  totalEntries: number; // Entrées actuelles
  hitRate: number;     // Taux de hit (%)
}
```

## Scénarios de Test

### Cache Hit/Miss
```javascript
// Miss initial
cache.get('prompt1') // -> null, miss++

// Set
cache.set('prompt1', result)  // -> sets++

// Hit 
cache.get('prompt1') // -> result, hits++
```

### Normalisation des Prompts
```javascript
// Ces prompts génèrent le même hash
'Create a bot'
'  CREATE A BOT  '  // Casse + espaces
'create a bot'     // Casse différente
```

### TTL et Expiration
```javascript
// TTL court pour test
cache.set('prompt', result, 'gpt-4', {}, 100); // 100ms
await sleep(150);
cache.get('prompt') // -> null, evictions++
```

## Benchmarks Attendus

### Performance Cache vs API
- **Cache hit** : ~1-5ms
- **API OpenAI** : ~500-2000ms
- **Amélioration** : 99%+ plus rapide

### Taux de Hit
- **Développement** : 30-50% (prompts variés)
- **Production** : 70-90% (prompts répétés)

### Capacité
- **Mémoire** : ~1KB par entrée (BotSpec)
- **Limite par défaut** : 1000 entrées
- **TTL par défaut** : 30 minutes

## Dépannage

### Tests échouent avec "Server not accessible"
```bash
# Démarrer le serveur Next.js
npm run dev
# Puis relancer les tests API
npm run test:cache:api
```

### Erreur d'import ESM
```bash
# Vérifier que Node.js supporte les modules ES
node --version  # >= 14.x requis
```

### Tests de charge lents
```bash
# Réduire la durée du test
export TEST_DURATION_MS=10000  # 10 secondes
npm run test:cache:manual
```

### Problèmes d'authentification API
```bash
# Les tests API peuvent échouer si Clerk n'est pas configuré
# C'est normal en développement, les tests continueront
```

## Structure des Fichiers

```
tests/
├── README.md                           # Cette documentation
├── cache.test.js                       # Tests unitaires
├── openai-cache-integration.test.js   # Tests d'intégration  
└── cache-api.test.js                   # Tests API

scripts/
├── test-cache-manual.js                # Tests manuels/charge
└── run-all-cache-tests.js             # Orchestrateur principal
```

## Évolution des Tests

### Ajout de nouveaux tests
1. Créer le fichier de test dans `tests/`
2. Ajouter un script npm dans `package.json`
3. Intégrer dans `run-all-cache-tests.js`

### Tests de prompts similaires (TODO)
Implementation future de détection de similarité :
```javascript
// Détection Levenshtein distance
const similarity = calculateSimilarity('prompt1', 'prompt2');
if (similarity > 0.85) {
  return getCachedSimilar('prompt1');
}
```

## Support

Pour toute question sur les tests :
1. Vérifier cette documentation
2. Examiner les logs détaillés avec `--verbose`
3. Tester individuellement chaque suite de tests