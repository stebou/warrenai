// src/lib/auth/sync-user.ts
import { prisma } from '@/lib/prisma';
import { createClerkClient } from '@clerk/nextjs/server';

/**
 * Assure qu'un utilisateur existe en base de données
 * Fonction de secours si le webhook Clerk a échoué
 */
export async function ensureUserExists(clerkUserId: string): Promise<void> {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId }
    });

    if (existingUser) {
      console.log(`[SYNC-USER] User ${clerkUserId} already exists in database`);
      return;
    }

    console.log(`[SYNC-USER] User ${clerkUserId} not found in database, fetching from Clerk...`);

    // Créer le client Clerk et récupérer les données utilisateur
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!
    });
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    
    if (!clerkUser) {
      console.error(`[SYNC-USER] User ${clerkUserId} not found in Clerk`);
      return;
    }

    // Trouver l'email principal
    const primaryEmail = clerkUser.emailAddresses.find(
      email => email.id === clerkUser.primaryEmailAddressId
    )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

    // Créer ou mettre à jour l'utilisateur (évite les race conditions)
    const newUser = await prisma.user.upsert({
      where: { clerkId: clerkUserId },
      create: {
        clerkId: clerkUserId,
        email: primaryEmail || `${clerkUserId}@noemail.temp`,
        firstName: clerkUser.firstName || undefined,
        lastName: clerkUser.lastName || undefined,
        imageUrl: clerkUser.imageUrl || undefined,
        externalId: clerkUser.externalId || undefined,
      },
      update: {
        // Mise à jour optionnelle des champs si l'utilisateur existe déjà
        ...(primaryEmail ? { email: primaryEmail } : {}),
        ...(clerkUser.firstName !== undefined ? { firstName: clerkUser.firstName } : {}),
        ...(clerkUser.lastName !== undefined ? { lastName: clerkUser.lastName } : {}),
        ...(clerkUser.imageUrl !== undefined ? { imageUrl: clerkUser.imageUrl } : {}),
        ...(clerkUser.externalId !== undefined ? { externalId: clerkUser.externalId } : {}),
      }
    });

    console.log(`[SYNC-USER] User ${clerkUserId} upserted successfully:`, {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName
    });

  } catch (error) {
    console.error(`[SYNC-USER] Failed to sync user ${clerkUserId}:`, error);
    throw error;
  }
}

/**
 * Récupère un utilisateur depuis la base de données avec synchronisation automatique
 */
export async function getUserWithSync(clerkUserId: string) {
  try {
    // Essayer de récupérer l'utilisateur
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId }
    });

    // Si l'utilisateur n'existe pas, le synchroniser
    if (!user) {
      await ensureUserExists(clerkUserId);
      user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId }
      });
    }

    return user;
  } catch (error) {
    console.error(`[SYNC-USER] Failed to get user with sync ${clerkUserId}:`, error);
    return null;
  }
}