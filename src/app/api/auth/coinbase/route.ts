import { NextRequest, NextResponse } from 'next/server';
import { CoinbaseOAuthClient } from '@/lib/trading/exchanges/coinbase_oauth_client';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Créer le client OAuth Coinbase
    const client = new CoinbaseOAuthClient({
      clientId: process.env.COINBASE_CLIENT_ID!,
      clientSecret: process.env.COINBASE_CLIENT_SECRET!,
      redirectUri: process.env.COINBASE_REDIRECT_URI!,
      sandbox: true // Utiliser le sandbox pour les tests
    });

    // Générer un state unique pour la sécurité
    const state = uuidv4();
    
    // TODO: Sauvegarder le state en session/database pour vérification
    // Pour l'instant, on peut l'inclure dans l'URL de callback
    
    // Générer l'URL d'autorisation
    const authUrl = client.getAuthorizationUrl(state);
    
    console.log('🔵 Coinbase OAuth: Redirecting to authorization URL');
    
    // Rediriger vers Coinbase pour l'authentification
    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error('Coinbase OAuth initiation error:', error);
    return NextResponse.json({ 
      error: 'Failed to initiate OAuth flow',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}