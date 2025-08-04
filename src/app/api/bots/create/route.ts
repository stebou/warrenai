import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { generateBotFromConfig, type BotCreationConfig } from '@/lib/trading/agents/bot_creation/agent';
import { BotStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { ensureUserExists } from '@/lib/auth/sync-user';

export async function POST(req: Request) {
  try {
    // 1. Authentification et récupération de l'ID utilisateur
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1.5. Assurer que l'utilisateur existe en base de données
    await ensureUserExists(userId);

    // 2. Validation du corps de la requête
    const body = await req.json() as BotCreationConfig;
    if (!body.name || !body.riskLimits) {
        return NextResponse.json({ error: 'Invalid input: name and riskLimits are required.' }, { status: 400 });
    }

    // 3. Appel de l'agent pour générer la spécification complète du bot
    log.info('Calling bot creation agent', { name: body.name });
    const botSpec = await generateBotFromConfig(body);

    // 4. Création du bot dans la base de données avec la promptVersion et la traçabilité
    const newBot = await prisma.bot.create({
      data: {
        name: botSpec.name,
        description: body.description || botSpec.description,
        strategy: botSpec.strategy,
        aiConfig: botSpec.aiConfig,
        status: BotStatus.INACTIVE,
        promptVersion: botSpec.promptVersion,
        
        // Remplissage des nouveaux champs de traçabilité
        promptText: botSpec.aiConfig.prompt,
        source: botSpec.aiConfig.source,
        model: botSpec.aiConfig.model,
        generatedAt: botSpec.aiConfig.generatedAt ? new Date(botSpec.aiConfig.generatedAt) : null,

        user: { 
          connect: { clerkId: userId },
        },
      },
    });

    log.info('Bot created successfully in DB', { botId: newBot.id, ownerClerkId: userId });

    // 5. Retourner une réponse de succès avec informations enrichies
    return NextResponse.json({
      ...newBot,
      validationInfo: {
        riskLevel: body.riskLevel || 'auto-calculated',
        configCompliance: 'valid',
        strategiesApplied: body.strategyHints || [],
        riskScore: {
          maxAllocation: body.riskLimits.maxAllocation,
          maxDailyLoss: body.riskLimits.maxDailyLoss,
          calculatedLevel: body.riskLevel || 'medium'
        }
      }
    }, { status: 201 });

  } catch (error) {
    log.error('Failed to create bot', { error });

    // Gestion d'erreur améliorée avec détails pour le debug
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Erreur spécifique si l'utilisateur n'est pas trouvé (P2025)
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'User not found in database. Please ensure webhook is working.' }, { status: 404 });
      }
    }

    // Pour le debug : retourner plus de détails en développement
    const isDev = process.env.NODE_ENV === 'development';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
      error: 'Failed to create bot',
      ...(isDev && { details: errorMessage, stack: error instanceof Error ? error.stack : null })
    }, { status: 500 });
  }
}