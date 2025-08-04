import { NextRequest, NextResponse } from 'next/server';
import { CoinbaseOAuthClient } from '@/lib/trading/exchanges/coinbase_oauth_client';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const { userId } = await auth();
    if (!userId) {
      console.error('🔵 Coinbase OAuth Callback: User not authenticated');
      return NextResponse.redirect(new URL('/sign-in?error=unauthorized', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Vérifier s'il y a une erreur dans la réponse OAuth
    if (error) {
      console.error('🔵 Coinbase OAuth Error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(`/dashboard?coinbase=error&message=${encodeURIComponent(errorDescription || error)}`, request.url)
      );
    }

    if (!code) {
      console.error('🔵 Coinbase OAuth Callback: Missing authorization code');
      return NextResponse.redirect(
        new URL('/dashboard?coinbase=error&message=missing_code', request.url)
      );
    }

    // TODO: Vérifier le state pour la sécurité
    console.log('🔵 Coinbase OAuth Callback: State received:', state);

    // Créer le client OAuth Coinbase
    const client = new CoinbaseOAuthClient({
      clientId: process.env.COINBASE_CLIENT_ID!,
      clientSecret: process.env.COINBASE_CLIENT_SECRET!,
      redirectUri: process.env.COINBASE_REDIRECT_URI!,
      sandbox: true
    });

    console.log('🔵 Coinbase OAuth: Exchanging code for tokens...');

    // Échanger le code contre des tokens
    const tokens = await client.exchangeCodeForTokens(code);

    console.log('🔵 Coinbase OAuth: Tokens received successfully');

    // Récupérer les informations utilisateur pour validation
    const coinbaseUser = await client.getUser(tokens.access_token);
    
    console.log('🔵 Coinbase OAuth: User info retrieved:', {
      id: coinbaseUser.id,
      name: coinbaseUser.name,
      username: coinbaseUser.username
    });

    // Récupérer l'utilisateur depuis Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      console.error('🔵 Coinbase OAuth: User not found in database');
      return NextResponse.redirect(
        new URL('/dashboard?coinbase=error&message=user_not_found', request.url)
      );
    }

    // Sauvegarder les tokens en base de données
    await prisma.exchangeCredentials.upsert({
      where: {
        userId_exchange: {
          userId: user.id,
          exchange: 'COINBASE'
        }
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        isTestnet: true,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        exchange: 'COINBASE',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        isTestnet: true
      }
    });

    console.log('🔵 Coinbase OAuth: Credentials saved to database');

    // Récupérer les comptes pour vérification
    try {
      const accounts = await client.getAccounts(tokens.access_token);
      console.log('🔵 Coinbase OAuth: Retrieved', accounts.length, 'accounts');
    } catch (accountError) {
      console.warn('🔵 Coinbase OAuth: Could not retrieve accounts:', accountError);
    }

    // Rediriger vers le dashboard avec succès
    return NextResponse.redirect(
      new URL('/dashboard?coinbase=connected&exchange=coinbase', request.url)
    );

  } catch (error) {
    console.error('🔵 Coinbase OAuth callback error:', error);
    
    let errorMessage = 'oauth_error';
    if (error instanceof Error) {
      errorMessage = error.message.toLowerCase().replace(/\s/g, '_');
    }
    
    return NextResponse.redirect(
      new URL(`/dashboard?coinbase=error&message=${errorMessage}`, request.url)
    );
  }
}