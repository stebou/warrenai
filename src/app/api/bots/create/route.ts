import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { generateBotFromConfig, type BotCreationConfig } from '@/lib/trading/agents/bot_creation/agent';
import { BotStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    // 1. Authentification et récupération de l'ID utilisateur
    // CORRECTION : auth() est une fonction asynchrone et doit être attendue avec 'await'
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validation du corps de la requête
    const body = await req.json() as BotCreationConfig;
    if (!body.name || !body.riskLimits) {
        return NextResponse.json({ error: 'Invalid input: name and riskLimits are required.' }, { status: 400 });
    }

    // 3. Appel de l'agent pour générer la spécification complète du bot
    log.info('Calling bot creation agent', { name: body.name });
    const botSpec = await generateBotFromConfig(body);

    // 4. Création du bot dans la base de données avec la promptVersion
    const newBot = await prisma.bot.create({
      data: {
        name: botSpec.name,
        description: botSpec.description,
        strategy: botSpec.strategy,
        aiConfig: botSpec.aiConfig,
        status: BotStatus.INACTIVE,
        promptVersion: botSpec.promptVersion, 
        user: { 
          connect: { clerkId: userId },
        },
      },
    });

    log.info('Bot created successfully in DB', { botId: newBot.id, ownerClerkId: userId });
    return NextResponse.json(newBot, { status: 201 });

  } catch (error) {
    log.error('Failed to create bot', { error });
    // Fournir une réponse d'erreur générique au client
    return NextResponse.json({ error: 'An internal error occurred while creating the bot.' }, { status: 500 });
  }
}