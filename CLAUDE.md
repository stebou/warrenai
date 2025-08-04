# Claude Code - Configuration du Projet Trading Bot

## Variables d'Environnement Requises

### Variables Critiques pour le Déploiement Vercel
- `USE_REAL_LLM=true` - **CRITIQUE**: Variable manquante qui causait l'erreur 500 sur `/api/bots/create`

### Variables de Base de Données
- `DATABASE_URL` - URL de connexion Prisma
- `DATABASE_DIRECT_URL` - URL directe pour les migrations

### Variables d'Authentification
- `CLERK_SECRET_KEY` - Clé secrète Clerk
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clé publique Clerk
- `CLERK_WEBHOOK_SECRET` - Secret pour les webhooks Clerk

### Variables LLM/OpenAI
- `OPENAI_API_KEY` - Clé API OpenAI
- `USE_REAL_LLM=true` - Active l'utilisation du vrai LLM (requis en production)

## Problèmes Résolus

### Erreur 500 Bot Creation (04/08/2025)
**Problème**: `POST 500 /api/bots/create` avec erreur vide `"error":{}`

**Cause**: Variable d'environnement `USE_REAL_LLM` manquante sur Vercel

**Solution**: 
1. Ajouter `USE_REAL_LLM=true` dans les variables d'environnement Vercel
2. Redéployer l'application

### Cache Prisma Vercel
**Problème**: Client Prisma non régénéré après changements de schéma

**Solution**: 
- Script build: `"build": "prisma generate && next build"`
- Utiliser "Clear Cache" lors du redéploiement Vercel

## Statistiques Implémentées

### Champs BotStats
- `winningTrades` - Nombre de trades gagnants
- `losingTrades` - Nombre de trades perdants
- `winRate` - Taux de réussite calculé

### Sécurité Multi-tenant
- Isolation des données par utilisateur via `userId`
- Filtrage sécurisé dans `DatabasePersistence.getUserStats()`

## Commandes Utiles

```bash
# Développement
npm run dev

# Build avec génération Prisma
npm run build

# Génération Prisma
npm run db:generate

# Migration base de données
npm run db:migrate
```

## Architecture

### Persistance des Données
- `DatabasePersistence` - Gestion des stats en base
- `BotController` - Contrôle des bots en mémoire
- Synchronisation DB ↔ Mémoire

### Composants UI
- `BotStatsWidget` - Affichage des statistiques
- `PerformanceChart` - Graphique temps réel
- `EnhancedCreateBotModal` - Création de bots (z-index fixé)

## Notes de Débogage

### Logs Vercel
- Erreurs détaillées dans `src/app/api/bots/create/route.ts`
- Logging sécurisé des stats utilisateur

### Tests
- `/api/exchange/test` - Test du mock exchange
- `/api/bots/status` - Status des bots utilisateur