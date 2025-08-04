# Instructions pour configurer le webhook Clerk

## Problème résolu
Le problème de création automatique d'utilisateur en base de données lors de la première connexion a été résolu avec une approche hybride :

1. **Webhook principal** : `/src/app/api/webhooks/user/route.ts`
2. **Synchronisation de secours** : `/src/lib/auth/sync-user.ts`

## Configuration requise dans Clerk Dashboard

### 1. Créer le webhook
1. Aller sur [Clerk Dashboard](https://dashboard.clerk.com)
2. Sélectionner votre projet
3. Menu "Webhooks" → "Add webhook"

### 2. Configuration webhook
- **URL** : `https://votre-domaine.com/api/webhooks/user`
- **Événements à cocher** :
  - ✅ `user.created`
  - ✅ `user.updated` 
  - ✅ `user.deleted`
- **Secret** : Copier le secret généré et le mettre dans `.env` comme `CLERK_WEBHOOK_SECRET`

### 3. Test du webhook
- Utiliser le script : `npm run send-webhook`
- Vérifier les logs de l'application pour voir `[WEBHOOK]` messages

## Fonctionnement de la solution

### Webhook (méthode principale)
- Reçoit automatiquement les événements de Clerk
- Crée/met à jour les utilisateurs en temps réel
- Logs détaillés pour debugging

### Synchronisation de secours (fallback)
- Active automatiquement si l'utilisateur n'existe pas en base
- Utilisée dans :
  - `checkAuth()` - pages protégées
  - `/api/bots/create` - endpoints API
- Récupère les données depuis Clerk et crée l'utilisateur

## Fichiers modifiés

### Nouveaux fichiers
- `src/lib/auth/sync-user.ts` - Fonctions de synchronisation

### Fichiers modifiés
- `src/lib/auth/utils.ts` - Ajout de sync dans `checkAuth()`
- `src/app/dashboard/page.tsx` - Force dynamic + utilise `checkAuth()`
- `src/app/api/bots/create/route.ts` - Sync avant création de bot
- `src/app/api/webhooks/user/route.ts` - Amélioration des logs

## Tests à effectuer

1. **Nouveau utilisateur** :
   - S'inscrire avec Clerk
   - Vérifier création automatique en base
   - Accéder au dashboard

2. **Vérification logs** :
   - Webhook : `[WEBHOOK] ✅ User xxx upserted successfully`
   - Sync : `[SYNC-USER] User xxx created successfully`

3. **Fallback** :
   - Désactiver temporairement le webhook
   - Créer un utilisateur
   - Vérifier que la sync de secours fonctionne

## Avantages de cette solution

✅ **Robuste** : Double protection webhook + fallback  
✅ **Automatique** : Aucune action manuelle requise  
✅ **Débuggage** : Logs détaillés pour troubleshooting  
✅ **Performance** : Webhook instantané, fallback léger  
✅ **Sécurisé** : Vérification signature webhook en production